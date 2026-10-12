<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Shop details printed on receipts plus the shared low / very-low stock levels. One row.
 *
 * @property int $id
 * @property string $store_name
 * @property string $address
 * @property string $phone
 * @property string $reg_no
 * @property string $receipt_footer
 * @property int $low_stock
 * @property int $critical_stock
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['store_name', 'address', 'phone', 'reg_no', 'receipt_footer', 'low_stock', 'critical_stock'])]
class ShopSetting extends Model
{
    public const CACHE_KEY = 'shop-settings';

    protected function casts(): array
    {
        return [
            'low_stock' => 'integer',
            'critical_stock' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
    }

    /**
     * The settings row, cached until it next changes. Cached as plain attributes: the cache store
     * never unserializes objects (config/cache.php serializable_classes).
     */
    public static function current(): self
    {
        /** @var array<string, mixed> $attributes */
        $attributes = Cache::rememberForever(self::CACHE_KEY, fn () => self::query()->firstOrFail()->getAttributes());

        return (new self)->newFromBuilder($attributes);
    }
}
