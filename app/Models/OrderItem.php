<?php

namespace App\Models;

use App\Enums\ItemSource;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $order_id
 * @property int|null $product_id
 * @property string $name
 * @property string $qty
 * @property string $unit
 * @property bool $unit_measured
 * @property string $unit_price
 * @property string $discount_pct
 * @property string $total
 * @property ItemSource $source
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Product|null $product
 */
#[Fillable(['order_id', 'product_id', 'name', 'qty', 'unit', 'unit_measured', 'unit_price', 'discount_pct', 'total', 'source'])]
class OrderItem extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['discount_pct' => '0.0000', 'source' => 'STORE'];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
            'unit_measured' => 'boolean',
            'unit_price' => 'decimal:2',
            'discount_pct' => 'decimal:4',
            'total' => 'decimal:2',
            'source' => ItemSource::class,
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }
}
