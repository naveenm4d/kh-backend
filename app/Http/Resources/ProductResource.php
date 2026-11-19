<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'brand' => $this->brand->name ?? '',
            'brandId' => $this->brand_id === null ? null : (string) $this->brand_id,
            'category' => $this->category->name ?? '',
            'categoryId' => $this->category_id === null ? null : (string) $this->category_id,
            'group' => $this->group,
            'unit' => $this->unit->name,
            'unitId' => (string) $this->unit_id,
            // Sold by length or weight: quantities show with the unit ("2.5 kg").
            'measured' => $this->unit->measured,
            // Decimal places a quantity may have: 0 for counted units, e.g. 2 for m, 3 for kg.
            'qtyDecimals' => $this->unit->decimals,
            'price' => (float) $this->price,
            'displayPrice' => (float) $this->display_price,
            'stock' => (float) $this->stock,
            'unitsSoldMonth' => (float) ($this->units_sold_month ?? 0),
            'unitsSoldWeek' => (float) ($this->units_sold_week ?? 0),
        ];
    }
}
