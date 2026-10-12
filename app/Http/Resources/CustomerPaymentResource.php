<?php

namespace App\Http\Resources;

use App\Models\CustomerPayment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CustomerPayment */
class CustomerPaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'customerId' => (string) $this->customer_id,
            'date' => $this->paid_on->toDateString(),
            'amount' => (float) $this->amount,
            'method' => $this->method->value,
            'note' => $this->note,
        ];
    }
}
