<?php

namespace App\Actions\Catalog;

use App\Enums\Permission;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Qty;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates or edits a unit. Counted units take whole numbers; measured ones (length, weight) up to
 * 3 decimals. Allowing fewer decimals is refused while a product's stock wouldn't fit them.
 */
final class SaveUnit
{
    /** @param  array{name: string, measured: bool, decimals: int}  $data */
    public function __invoke(User $user, array $data, ?Unit $unit = null): Unit
    {
        Abilities::ensure($user, Permission::PageCatalog);

        $decimals = $data['measured'] ? $data['decimals'] : 0;
        if ($decimals < 0 || $decimals > Qty::DECIMALS) {
            throw ValidationException::withMessages(['decimals' => 'Decimal places must be from 0 to 3.']);
        }
        if (! $data['measured'] && $data['decimals'] > 0) {
            throw ValidationException::withMessages(['decimals' => 'Counted units take whole numbers. Mark it as measured to allow decimals.']);
        }

        return DB::transaction(function () use ($data, $decimals, $unit) {
            if ($unit !== null) {
                $unit = Unit::query()->lockForUpdate()->findOrFail($unit->id);
            }
            $unit ??= new Unit;
            $unit->fill(['name' => trim($data['name']), 'measured' => $data['measured'], 'decimals' => $decimals]);

            if ($unit->exists) {
                $step = 10 ** (Qty::DECIMALS - $decimals);
                $misfit = Product::query()
                    ->where('unit_id', $unit->id)
                    ->whereRaw('mod(round(stock * ?), ?) <> 0', [Qty::SCALE, $step])
                    ->value('name');
                if ($misfit !== null) {
                    throw ValidationException::withMessages(['decimals' => sprintf("%s has stock that doesn't fit %d decimal places. Correct its stock first.", $misfit, $decimals)]);
                }
            }
            $unit->save();

            // Product rows carry the unit to the tills.
            Product::withTrashed()->where('unit_id', $unit->id)->update(['updated_at' => now()]);

            return $unit;
        });
    }
}
