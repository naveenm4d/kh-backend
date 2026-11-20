<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * What products are sold, priced and stocked by, managed in the console's catalogue. Counted
 * units (Bag, Piece) take whole numbers; measured ones (m, kg) print with the unit and may take
 * up to 3 decimals (`decimals`; App\Support\Qty).
 *
 * @property int $id
 * @property string $name
 * @property bool $measured
 * @property int $decimals
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['name', 'measured', 'decimals'])]
class Unit extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['measured' => false, 'decimals' => 0];

    protected function casts(): array
    {
        return [
            'measured' => 'boolean',
            'decimals' => 'integer',
        ];
    }

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
