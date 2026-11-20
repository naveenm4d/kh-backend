<?php

namespace App\Actions\Orders;

use App\Enums\OrderStatus;
use App\Enums\Permission;
use App\Models\Order;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Marks a bill's warehouse goods as collected: credit bills then wait for payment, the rest are completed. */
final class IssueOrder
{
    public function __invoke(User $user, Order $order): Order
    {
        Abilities::ensureAny($user, Permission::PosAccess, Permission::PageOrders);

        return DB::transaction(function () use ($order) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== OrderStatus::ReadyToCollect) {
                throw ValidationException::withMessages(['order' => 'Only bills waiting for collection can be marked as collected.']);
            }
            $order->forceFill(['status' => OrderStatus::afterCollection($order->payment)])->save();

            return $order->load('items');
        });
    }
}
