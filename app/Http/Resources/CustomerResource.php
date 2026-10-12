<?php

namespace App\Http\Resources;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** A customer with lifetime stats (load with Customer::withStats()). */
/** @mixin Customer */
class CustomerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'address' => $this->address,
            'credit' => (float) $this->credit,
            'spent' => (float) ($this->spent ?? 0),
            'orderCount' => (int) ($this->order_count ?? 0),
            'lastPurchase' => $this->last_purchase === null ? '' : substr((string) $this->last_purchase, 0, 10),
        ];
    }
}
