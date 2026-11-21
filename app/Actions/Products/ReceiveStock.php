<?php

namespace App\Actions\Products;

use App\Enums\ActivityAction;
use App\Enums\Permission;
use App\Enums\StockMovementReason;
use App\Models\Product;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Activity;
use App\Support\Qty;
use App\Support\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Adds delivered stock to one or more products, in each product's unit (2.5 kg, 3 bags). */
final class ReceiveStock
{
    /** @param  array<int, float|int|string>  $quantities  product id => quantity received */
    public function __invoke(User $user, array $quantities, string $note = ''): void
    {
        Abilities::ensure($user, Permission::PageInventory, Permission::StockAdjust);

        $quantities = array_filter(array_map(fn ($qty) => Qty::toMilli($qty), $quantities), fn (int $milli) => $milli > 0);
        if ($quantities === []) {
            throw ValidationException::withMessages(['items' => 'Enter how many units arrived.']);
        }

        DB::transaction(function () use ($user, $quantities, $note) {
            $ids = array_keys($quantities);
            sort($ids);
            $products = Product::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->with('unit')->get();
            $changes = [];
            foreach ($products as $product) {
                Qty::ensureFits($quantities[$product->id], $product->unit, $product->name);
                $before = $product->stock;
                Stock::move($product, $quantities[$product->id], StockMovementReason::Receive, $user, note: trim($note));
                $changes[] = Activity::change('stock:'.$product->id, $product->name, Qty::format($before, $product->unit), Qty::format($product->stock, $product->unit));
            }
            $label = $products->count() === 1 ? $products->first()->name : sprintf('%d products', $products->count());
            Activity::record($user, ActivityAction::StockReceived, $products->count() === 1 ? $products->first() : null, $label,
                'Received stock for '.$label.(trim($note) === '' ? '' : ' ('.trim($note).')'), $changes);
        });
    }
}
