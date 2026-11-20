<?php

namespace App\Actions\Orders;

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
            $order->forceFill(['amount' => Money::fromCents($priced['amountCents']), 'status' => $status, 'updated_at' => now()])->save();

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
