<?php

namespace App\Actions\Products;

use App\Enums\Permission;
use App\Enums\StockMovementReason;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Money;
use App\Support\Qty;
use App\Support\Stock;
use Illuminate\Support\Facades\DB;

/**
 * Creates or updates a product. Price changes need the prices permission and stock changes the
 * stock permission; a stock change is written to the ledger as a manual adjustment. The unit sets
 * whether quantities may have decimals (App\Models\Unit), and the stock must suit it. New products
 * default to the Piece unit (or the first one) when none is given.
 */
final class SaveProduct
{
    /**
     * @param  array{name: string, brand_id?: int|null, category_id?: int|null, unit_id?: int|null, price: float|int|string, display_price?: float|int|string|null, stock?: float|int|string|null}  $data
     */
    public function __invoke(User $user, array $data, ?Product $product = null): Product
    {
        Abilities::ensure($user, Permission::PageInventory);

        return DB::transaction(function () use ($user, $data, $product) {
            if ($product !== null) {
                $product = Product::query()->lockForUpdate()->findOrFail($product->id);
            }

            $price = Money::fromCents(Money::toCents($data['price']));
            $displayPrice = Money::fromCents(Money::toCents($data['display_price'] ?? 0));
            $stockMilli = Qty::toMilli($data['stock'] ?? ($product->stock ?? 0));
            $currentMilli = Qty::toMilli($product->stock ?? 0);

            $priceChanged = $product === null
                || $price !== $product->price
                || $displayPrice !== $product->display_price;
            if ($priceChanged) {
                Abilities::ensure($user, Permission::PricesEdit);
            }
            $stockDelta = $stockMilli - $currentMilli;
            if ($stockDelta !== 0) {
                Abilities::ensure($user, Permission::StockAdjust);
            }

            $categoryId = $data['category_id'] ?? null;
            $category = $categoryId === null ? null : Category::query()->find($categoryId);

            $isNew = $product === null;
            $product ??= new Product(['stock' => 0]);
            $unit = match (true) {
                isset($data['unit_id']) => Unit::query()->findOrFail($data['unit_id']),
                ! $isNew => $product->sellingUnit(),
                default => Unit::query()->whereRaw("lower(name) = 'piece'")->first() ?? Unit::query()->orderBy('id')->firstOrFail(),
            };
            $product->fill([
                'name' => trim($data['name']),
                'brand_id' => $data['brand_id'] ?? null,
                'category_id' => $category?->id,
                'group' => $category->group ?? ($product->group ?: Category::DEFAULT_GROUP),
                'unit_id' => $unit->id,
                'price' => $price,
                'display_price' => $displayPrice,
            ]);
            $product->setRelation('unit', $unit);
            Qty::ensureFits($stockMilli, $unit, $product->name, 'stock');
            $product->save();

            Stock::move($product, $stockDelta, $isNew ? StockMovementReason::Opening : StockMovementReason::Adjust, $user);

            return $product->refresh();
        });
    }
}
