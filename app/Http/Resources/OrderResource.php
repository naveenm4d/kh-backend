<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'invoice' => $this->invoice,
            'date' => $this->sold_on->toDateString(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'customerId' => $this->customer_id === null ? null : (string) $this->customer_id,
            'customer' => $this->customer_name,
            'payment' => $this->payment->value,
            'status' => $this->status->value,
            'cashier' => $this->cashier_name,
            'cashierCode' => $this->cashier_code,
            'items' => $this->items->map(fn (OrderItem $item) => [
                'productId' => $item->product_id === null ? '' : (string) $item->product_id,
                'name' => $item->name,
                'qty' => (float) $item->qty,
                'unit' => $item->unit,
                'measured' => $item->unit_measured,
                'unitPrice' => (float) $item->unit_price,
                'discountPct' => (float) $item->discount_pct,
                'total' => (float) $item->total,
                'source' => $item->source->value,
            ])->all(),
            'amount' => (float) $this->amount,
            'cashReceived' => $this->cash_received === null ? null : (float) $this->cash_received,
        ];
    }
}
