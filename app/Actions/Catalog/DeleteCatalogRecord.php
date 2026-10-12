<?php

namespace App\Actions\Catalog;

use App\Enums\Permission;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Deletes a brand, category, supplier or unit. Products keep existing without the brand/category,
 * and are touched so the tills pick up the change. A unit still used by a product can't be deleted:
 * every product needs one.
 */
final class DeleteCatalogRecord
{
    public function __invoke(User $user, Brand|Category|Supplier|Unit $record): void
    {
        Abilities::ensure($user, Permission::PageCatalog, Permission::RecordsDelete);

        if ($record instanceof Unit) {
            $used = Product::withTrashed()->where('unit_id', $record->id)->count();
            if ($used > 0) {
                throw ValidationException::withMessages([
                    'unit' => sprintf('%d %s sold by %s. Move %s to another unit first.', $used, $used === 1 ? 'product is' : 'products are', $record->name, $used === 1 ? 'it' : 'them'),
                ]);
            }
        }

        DB::transaction(function () use ($record) {
            $column = match (true) {
                $record instanceof Brand => 'brand_id',
                $record instanceof Category => 'category_id',
                default => null,
            };
            if ($column !== null) {
                Product::withTrashed()->where($column, $record->id)->update([$column => null, 'updated_at' => now()]);
            }
            $record->delete();
        });
    }
}
