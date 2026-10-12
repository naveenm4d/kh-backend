<?php

namespace App\Http\Requests\Admin;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Foundation\Http\FormRequest;

/** Product form: brand, category and unit arrive by name (as the pickers show them) and resolve to ids. */
class ProductRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'brand' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'unit' => ['nullable', 'string', 'max:24'],
            'price' => ['required', 'numeric', 'min:0', 'max:100000000'],
            'displayPrice' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            // Decimals are checked against the unit in SaveProduct.
            'stock' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
        ];
    }

    /** @return list<\Closure> */
    public function after(): array
    {
        return [function ($validator) {
            foreach (['brand' => Brand::class, 'category' => Category::class, 'unit' => Unit::class] as $field => $model) {
                $name = trim((string) $this->input($field));
                if ($name !== '' && ! $model::query()->whereRaw('lower(name) = ?', [mb_strtolower($name)])->exists()) {
                    $validator->errors()->add($field, "There's no $field called \"$name\".");
                }
            }
        }];
    }

    /** @return array{name: string, brand_id: int|null, category_id: int|null, unit_id: int|null, price: float, display_price: float, stock: float|null} */
    public function productData(): array
    {
        $find = fn (string $model, ?string $name) => trim((string) $name) === ''
            ? null
            : $model::query()->whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $name))])->value('id');

        return [
            'name' => (string) $this->validated('name'),
            'brand_id' => $find(Brand::class, $this->validated('brand')),
            'category_id' => $find(Category::class, $this->validated('category')),
            'unit_id' => $find(Unit::class, $this->validated('unit')),
            'price' => (float) $this->validated('price'),
            'display_price' => (float) ($this->validated('displayPrice') ?? 0),
            'stock' => $this->validated('stock') === null ? null : (float) $this->validated('stock'),
        ];
    }
}
