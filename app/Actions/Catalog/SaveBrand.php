<?php

namespace App\Actions\Catalog;

use App\Enums\Permission;
use App\Models\Brand;
use App\Models\Product;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Activity;
use Illuminate\Support\Facades\DB;

final class SaveBrand
{
    public function __invoke(User $user, string $name, ?Brand $brand = null): Brand
    {
        Abilities::ensure($user, Permission::PageCatalog);

        return DB::transaction(function () use ($user, $name, $brand) {
            $brand ??= new Brand;
            $brand->fill(['name' => trim($name)]);
            $log = Activity::catalogSave($user, $brand, 'brand');
            $brand->save();
            $log();

            // Product rows carry the brand name to the tills.
            Product::query()->where('brand_id', $brand->id)->update(['updated_at' => now()]);

            return $brand;
        });
    }
}
