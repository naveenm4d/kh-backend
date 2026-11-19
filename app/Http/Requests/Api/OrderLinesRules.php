<?php

namespace App\Http\Requests\Api;

use App\Enums\ItemSource;
use Illuminate\Validation\Rule;

/** Shared validation and normalisation for bill lines sent by a till. */
trait OrderLinesRules
{
    /** @return array<string, mixed> */
    protected function lineRules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.productId' => ['required', 'integer', 'min:1'],
            // Decimals are checked against each product's unit when the bill is priced.
            'items.*.qty' => ['required', 'numeric', 'gt:0', 'max:100000'],
            'items.*.unitPrice' => ['required', 'numeric', 'min:0', 'max:100000000'],
            'items.*.discountPct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.source' => ['nullable', Rule::enum(ItemSource::class)],
        ];
    }

    /** @return list<array{productId: int, qty: int|float, unitPrice: float, discountPct: float, source: ItemSource}> */
    public function lines(): array
    {
        return array_map(fn (array $line) => [
            'productId' => (int) $line['productId'],
            'qty' => (float) $line['qty'],
            'unitPrice' => (float) $line['unitPrice'],
            'discountPct' => (float) ($line['discountPct'] ?? 0),
            'source' => ItemSource::tryFrom((string) ($line['source'] ?? '')) ?? ItemSource::Store,
        ], array_values($this->validated('items')));
    }
}
