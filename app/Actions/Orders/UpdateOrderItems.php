<?php

namespace App\Actions\Orders;

use App\Enums\ActivityAction;
use App\Enums\ItemSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\Permission;
use App\Enums\StockMovementReason;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Activity;
use App\Support\Money;
use App\Support\Qty;
use App\Support\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Replaces a bill's items. Behaves like cancel-then-recreate for stock and credit, but keeps the
 * invoice number, customer and payment. Lines may keep the price they were rung up at. The status
 * follows the warehouse lines: more to collect sends the bill back to READY_TO_COLLECT, and a
 * waiting bill left with nothing to collect moves on.
 */
final class UpdateOrderItems
{
    public function __construct(private readonly PriceLines $priceLines) {}

    /**
     * @param  list<array{productId: int, qty: int|float, unitPrice: float, discountPct: float, source: ItemSource}>  $lines
     */
    public function __invoke(User $user, Order $order, array $lines): Order
    {
        Abilities::ensure($user, Permission::OrdersEdit);

        return DB::transaction(function () use ($user, $order, $lines) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status === OrderStatus::Cancelled) {
                throw ValidationException::withMessages(['order' => "Cancelled bills can't be edited."]);
            }

            $oldItems = $order->items()->get();
            $products = PriceLines::lockProducts(
                [...$oldItems->pluck('product_id')->filter()->all(), ...array_column($lines, 'productId')],
                withTrashed: true,
            );

            $previousPrices = [];
            foreach ($oldItems as $item) {
                if ($item->product_id !== null) {
                    $previousPrices[$item->product_id][] = (float) $item->unit_price;
                }
            }

            // Price first so a rejected edit changes nothing.
            $priced = ($this->priceLines)($user, $lines, $products, $previousPrices);

            $delta = [];
            foreach ($oldItems as $item) {
                if ($item->product_id !== null) {
                    $delta[$item->product_id] = ($delta[$item->product_id] ?? 0) + Qty::toMilli($item->qty);
                }
            }
            foreach ($priced['qtyByProduct'] as $productId => $qty) {
                $delta[$productId] = ($delta[$productId] ?? 0) - $qty;
            }
            foreach ($delta as $productId => $qtyDelta) {
                if ($product = $products->get($productId)) {
                    Stock::move($product, $qtyDelta, StockMovementReason::Edit, $user, $order);
                }
            }

            $status = $this->statusAfterEdit($order, $oldItems, $priced['lines']);

            $oldAmountCents = Money::toCents($order->amount);
            $order->items()->delete();
            $order->items()->createMany($priced['lines']);
            // updated_at is set even when the total is unchanged: the items did change, and tills sync on it.
            $order->forceFill(['amount' => Money::fromCents($priced['amountCents']), 'status' => $status, 'updated_at' => now()]);
            $changes = [...self::lineChanges($oldItems->map(fn (OrderItem $item) => $item->only(['product_id', 'name', 'qty', 'unit', 'unit_price', 'discount_pct']))->all(), $priced['lines']), ...Activity::changesOf($order, ['amount' => 'Total'])];
            $order->save();
            Activity::record($user, ActivityAction::OrderItemsUpdated, $order, $order->invoice,
                sprintf('Edited the items on bill %s (%s → %s)', $order->invoice, Money::format(Money::fromCents($oldAmountCents)), Money::format($order->amount)), $changes);

            if ($order->customer_id !== null) {
                $customer = Customer::withTrashed()->lockForUpdate()->find($order->customer_id);
                if ($customer !== null) {
                    if ($order->payment === PaymentMethod::Credit) {
                        $credit = Money::toCents($customer->credit) - $oldAmountCents + $priced['amountCents'];
                        $customer->credit = Money::fromCents(max(0, $credit));
                    }
                    $customer->updated_at = now();
                    $customer->save();
                }
            }

            return $order->load('items');
        });
    }

    /**
     * Each product whose lines changed, as "2 bag × Rs. 1,500" before and after (null when absent).
     *
     * @param  array<int, array<string, mixed>>  $before
     * @param  array<int, array<string, mixed>>  $after
     * @return list<array{field: string, label: string, from: mixed, to: mixed}>
     */
    private static function lineChanges(array $before, array $after): array
    {
        $describe = function (array $lines): array {
            $out = [];
            foreach ($lines as $line) {
                $key = (string) ($line['product_id'] ?? $line['name']);
                $qty = rtrim(rtrim((string) $line['qty'], '0'), '.');
                $text = sprintf('%s %s × %s', $qty, $line['unit'], Money::format($line['unit_price']));
                if ((float) $line['discount_pct'] > 0) {
                    $text .= sprintf(' (−%s%%)', rtrim(rtrim((string) $line['discount_pct'], '0'), '.'));
                }
                $out[$key]['name'] = (string) $line['name'];
                $out[$key]['text'][] = $text;
            }

            return array_map(fn (array $v) => ['name' => $v['name'], 'text' => implode(', ', $v['text'])], $out);
        };
        $old = $describe($before);
        $new = $describe($after);

        $changes = [];
        foreach ($old + $new as $key => $line) {
            $from = $old[$key]['text'] ?? null;
            $to = $new[$key]['text'] ?? null;
            if ($from !== $to) {
                $changes[] = Activity::change('item:'.$key, $line['name'], $from, $to);
            }
        }

        return $changes;
    }

    /**
     * @param  iterable<OrderItem>  $oldItems
     * @param  list<array{product_id: int, qty: string, source: ItemSource}>  $newLines
     */
    private function statusAfterEdit(Order $order, iterable $oldItems, array $newLines): OrderStatus
    {
        $before = [];
        foreach ($oldItems as $item) {
            if ($item->source === ItemSource::Warehouse) {
                $key = $item->product_id ?? 0;
                $before[$key] = ($before[$key] ?? 0) + Qty::toMilli($item->qty);
            }
        }
        $after = [];
        foreach ($newLines as $line) {
            if ($line['source'] === ItemSource::Warehouse) {
                $after[$line['product_id']] = ($after[$line['product_id']] ?? 0) + Qty::toMilli($line['qty']);
            }
        }

        foreach ($after as $productId => $qty) {
            if ($qty > ($before[$productId] ?? 0)) {
                return OrderStatus::ReadyToCollect;
            }
        }
        if ($order->status === OrderStatus::ReadyToCollect && $after === []) {
            return OrderStatus::afterCollection($order->payment);
        }

        return $order->status;
    }
}
