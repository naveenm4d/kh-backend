<?php

namespace App\Http\Resources;

use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\Order;
use Illuminate\Http\Request;

/** A customer with stats, every bill (cancelled included) and every payment, newest first. */
/** @mixin Customer */
class CustomerDetailResource extends CustomerResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $bills = Order::query()
            ->where('customer_id', $this->id)
            ->with('items')
            ->newestFirst()
            ->get();
        $payments = CustomerPayment::query()
            ->where('customer_id', $this->id)
            ->orderByDesc('paid_on')
            ->orderByDesc('id')
            ->get();

        return [
            ...parent::toArray($request),
            'bills' => OrderResource::collection($bills)->resolve($request),
            'payments' => CustomerPaymentResource::collection($payments)->resolve($request),
        ];
    }
}
