<?php

namespace App\Actions\Orders;

use App\Enums\ItemSource;
use App\Enums\Permission;
use App\Models\Product;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Money;
use App\Support\Qty;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Prices bill lines on the server. Names and allowed prices come from the database, never from
 * the till: a line's unit price must be the product's selling price or its marked price (or, when
 * editing a bill, the price it was originally rung up at). Selling below the selling price needs
 * the discount permission; the automatic marked-price discount down to the selling price doesn't.
 * Quantities must suit the product's unit: whole bags, metres to 0.01, kilograms to 0.001.
 */
final class PriceLines
{
    /** Tolerance for comparing rupee amounts sent as floating point. */
    private const PRICE_EPSILON = 0.005;

    /** Selling below the floor by up to half a rupee is rounding, not a discount. */
    private const DISCOUNT_SLACK = 0.5;

    /**
     * Locks the given products for the rest of the transaction, in id order to avoid deadlocks.
     *
     * @param  array<int, int>  $ids
     * @return Collection<int, Product>
     */
    public static function lockProducts(array $ids, bool $withTrashed = false): Collection
    {
        $ids = array_values(array_unique($ids));
        sort($ids);

        return Product::query()
            ->when($withTrashed, fn ($q) => $q->withTrashed())
            ->whereIn('id', $ids)
            ->orderBy('id')
            ->lockForUpdate()
            ->with('unit')
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  list<array{productId: int, qty: int|float, unitPrice: float, discountPct: float, source: ItemSource}>  $lines
     * @param  Collection<int, Product>  $products  locked, keyed by id
     * @param  array<int, list<float>>  $previousUnitPrices  product id => unit prices already on the bill
     * @return array{lines: list<array{product_id: int, name: string, qty: string, unit: string, unit_measured: bool, unit_price: string, discount_pct: string, total: string, source: ItemSource}>, amountCents: int, qtyByProduct: array<int, int>} qtyByProduct in Qty thousandths
     */
    public function __invoke(User $user, array $lines, Collection $products, array $previousUnitPrices = []): array
    {
        if ($lines === []) {
            throw ValidationException::withMessages(['items' => 'A bill must contain at least one item.']);
        }

        $priced = [];
        $amountCents = 0;
        $qtyByProduct = [];
        $needsDiscountPermission = false;

        foreach ($lines as $line) {
            $product = $products->get($line['productId']);
            if ($product === null || $product->trashed()) {
                throw ValidationException::withMessages([
                    'items' => 'An item on this bill is no longer sold. Remove it and try again.',
                ]);
            }

            $qtyMilli = Qty::toMilli($line['qty']);
            if ($qtyMilli <= 0) {
                throw ValidationException::withMessages(['items' => sprintf('Enter a quantity for %s.', $product->name)]);
            }
            Qty::ensureFits($qtyMilli, $product->sellingUnit(), $product->name);

            $unit = $line['unitPrice'];
            $previous = $previousUnitPrices[$product->id] ?? [];
            if (! $this->isAllowedPrice($unit, $product, $previous)) {
                throw ValidationException::withMessages([
                    'items' => sprintf('The price of %s has changed to %s. Remove it and add it again.', $product->name, Money::format($product->price)),
                ]);
            }

            $pct = round(max(0.0, min(100.0, $line['discountPct'])), 4);
            $net = $unit * (100 - $pct) / 100;
            $floor = min((float) $product->price, ...($previous === [] ? [INF] : $previous));
            if ($net < $floor - self::DISCOUNT_SLACK) {
                $needsDiscountPermission = true;
            }

            $unitCents = Money::toCents($unit);
            $totalCents = Money::lineTotalCents($unitCents, $qtyMilli, $pct);
            $amountCents += $totalCents;
            $qtyByProduct[$product->id] = ($qtyByProduct[$product->id] ?? 0) + $qtyMilli;

            $priced[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'qty' => Qty::fromMilli($qtyMilli),
                'unit' => $product->sellingUnit()->name,
                'unit_measured' => $product->sellingUnit()->measured,
                'unit_price' => Money::fromCents($unitCents),
                'discount_pct' => number_format($pct, 4, '.', ''),
                'total' => Money::fromCents($totalCents),
                'source' => $line['source'],
            ];
        }

        if ($needsDiscountPermission) {
            Abilities::ensure($user, Permission::PosDiscount);
        }

        return ['lines' => $priced, 'amountCents' => $amountCents, 'qtyByProduct' => $qtyByProduct];
    }

    /** @param  list<float>  $previous */
    private function isAllowedPrice(float $unit, Product $product, array $previous): bool
    {
        $allowed = [(float) $product->price, ...$previous];
        if ((float) $product->display_price > 0) {
            $allowed[] = (float) $product->display_price;
        }
        foreach ($allowed as $price) {
            if (abs($unit - $price) < self::PRICE_EPSILON) {
                return true;
            }
        }

        return false;
    }
}
