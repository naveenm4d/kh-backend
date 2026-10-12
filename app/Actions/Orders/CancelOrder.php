<?php

namespace App\Actions\Orders;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\Permission;
use App\Enums\StockMovementReason;
use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Money;
use App\Support\Qty;
use App\Support\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Voids a bill: puts its stock back and, for credit bills, takes it off the customer's balance. */
final class CancelOrder
{
    public function __invoke(User $user, Order $order): Order
    {
        Abilities::ensure($user, Permission::OrdersCancel);

        return DB::transaction(function () use ($user, $order) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status === OrderStatus::Cancelled) {
                throw ValidationException::withMessages(['order' => 'This bill is already cancelled.']);
            }

            $items = $order->items()->get();
            $products = PriceLines::lockProducts($items->pluck('product_id')->filter()->all(), withTrashed: true);
            foreach ($items->groupBy('product_id') as $productId => $lines) {
                if ($product = $products->get($productId)) {
                    Stock::move($product, $lines->sum(fn ($line) => Qty::toMilli($line->qty)), StockMovementReason::Cancel, $user, $order);
                }
            }

            if ($order->customer_id !== null) {
                $customer = Customer::withTrashed()->lockForUpdate()->find($order->customer_id);
                if ($customer !== null) {
                    if ($order->payment === PaymentMethod::Credit) {
                        $customer->credit = Money::fromCents(max(0, Money::toCents($customer->credit) - Money::toCents($order->amount)));
                    }
                    $customer->updated_at = now();
                    $customer->save();
                }
            }

            $order->forceFill(['status' => OrderStatus::Cancelled, 'cancelled_at' => now()])->save();

            return $order->load('items');
        });
    }
}
