<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property int|null $brand_id
 * @property int|null $category_id
 * @property string $group
 * @property int $unit_id
 * @property string $price
 * @property string $display_price
 * @property string $stock
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property CarbonImmutable|null $deleted_at
 * @property-read Brand|null $brand
 * @property-read Category|null $category
 * @property-read Unit $unit
 * @property string|null $units_sold_week
 * @property string|null $units_sold_month
 */
#[Fillable(['name', 'brand_id', 'category_id', 'group', 'unit_id', 'price', 'display_price', 'stock'])]
class Product extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['display_price' => '0.00', 'stock' => 0];

    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'display_price' => 'decimal:2',
            'stock' => 'decimal:3',
        ];
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return BelongsTo<Unit, $this> */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /** The unit, loaded on first use (strict mode forbids lazy loading). */
    public function sellingUnit(): Unit
    {
        return $this->loadMissing('unit')->unit;
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Adds units sold this week (Monday onward) and this calendar month, from non-cancelled
     * bills. Computed from the bills themselves, so the numbers always mean what they say.
     *
     * @param  Builder<Product>  $query
     */
    public function scopeWithSales(Builder $query): void
    {
        $now = now();
        $sold = fn (CarbonInterface $since) => OrderItem::query()
            ->selectRaw('coalesce(sum(order_items.qty), 0)')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereColumn('order_items.product_id', 'products.id')
            ->where('orders.status', '!=', 'CANCELLED')
            ->where('orders.sold_on', '>=', $since->toDateString());

        $query->addSelect([
            'units_sold_week' => $sold($now->startOfWeek()),
            'units_sold_month' => $sold($now->startOfMonth()),
        ]);
    }
}
