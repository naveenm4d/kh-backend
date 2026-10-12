<?php

namespace App\Actions\Products;

use App\Enums\Permission;
use App\Models\Product;
use App\Models\User;
use App\Support\Abilities;

/** Archives a product: it leaves the tills but stays on past bills. */
final class DeleteProduct
{
    public function __invoke(User $user, Product $product): void
    {
        Abilities::ensure($user, Permission::PageInventory, Permission::RecordsDelete);

        // Bump first so the delta sync, which reads updated_at, reports the removal.
        $product->updated_at = now();
        $product->save();
        $product->delete();
    }
}
