<?php

namespace App\Models;

use App\Enums\StockMovementReason;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $product_id
 * @property string $qty_delta
 * @property StockMovementReason $reason
 * @property int|null $order_id
 * @property int|null $user_id
 * @property string $note
 * @property CarbonImmutable $created_at
 */
#[Fillable(['product_id', 'qty_delta', 'reason', 'order_id', 'user_id', 'note'])]
class StockMovement extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['note' => ''];

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'qty_delta' => 'decimal:3',
            'reason' => StockMovementReason::class,
        ];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
