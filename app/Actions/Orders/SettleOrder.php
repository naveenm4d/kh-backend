<?php

namespace App\Actions\Orders;

use App\Enums\OrderStatus;
use App\Enums\Permission;
use App\Models\Order;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Closes a credit bill once the customer has settled it. Only the bill's status changes: customer
 * balances are kept by recorded payments, which aren't tied to bills.
 */
final class SettleOrder
{
    public function __invoke(User $user, Order $order): Order
    {
        Abilities::ensure($user, Permission::OrdersSettle);

        return DB::transaction(function () use ($order) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== OrderStatus::PaymentPending) {
                throw ValidationException::withMessages(['order' => 'Only bills waiting for payment can be marked as paid.']);
            }
            $order->forceFill(['status' => OrderStatus::Completed])->save();

            return $order->load('items');
        });
    }
}
