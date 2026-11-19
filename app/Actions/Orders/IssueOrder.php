<?php

namespace App\Actions\Orders;

use App\Enums\OrderStatus;
use App\Enums\Permission;
use App\Models\Order;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Marks a pending bill's goods as handed over. */
final class IssueOrder
{
    public function __invoke(User $user, Order $order): Order
    {
        Abilities::ensureAny($user, Permission::PosAccess, Permission::PageOrders);

        return DB::transaction(function () use ($order) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== OrderStatus::Pending) {
                throw ValidationException::withMessages(['order' => 'Only pending bills can be marked as issued.']);
            }
            $order->forceFill(['status' => OrderStatus::Issued])->save();

            return $order->load('items');
        });
    }
}
