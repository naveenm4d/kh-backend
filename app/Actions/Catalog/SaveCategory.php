<?php

namespace App\Actions\Catalog;

use App\Enums\Permission;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Support\Facades\DB;

/** Creates or renames a category. Its products take the new group, and the tills re-sync them. */
final class SaveCategory
{
    /** @param  array{name: string, parent?: string|null, group?: string|null}  $data */
    public function __invoke(User $user, array $data, ?Category $category = null): Category
    {
        Abilities::ensure($user, Permission::PageCatalog);

        return DB::transaction(function () use ($data, $category) {
            $category ??= new Category;
            $category->fill([
                'name' => trim($data['name']),
                'parent' => trim((string) ($data['parent'] ?? '')),
                'group' => trim((string) ($data['group'] ?? '')) ?: Category::DEFAULT_GROUP,
            ])->save();

            Product::query()->where('category_id', $category->id)->update([
                'group' => $category->group,
                'updated_at' => now(),
            ]);

            return $category;
        });
    }
}
