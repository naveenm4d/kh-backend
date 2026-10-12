<?php

namespace App\Support;

use App\Enums\StockMovementReason;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * The only way stock changes: updates the running total and writes the ledger row together.
 * Callers hold a row lock on the product (lockForUpdate) inside a transaction. Deltas are in Qty
 * thousandths, so 2.5 kg is 2500.
 */
final class Stock
{
    public static function move(
        Product $product,
        int $deltaMilli,
        StockMovementReason $reason,
        ?User $user = null,
        ?Order $order = null,
        string $note = '',
    ): void {
        if ($deltaMilli === 0) {
            return;
        }
        $stockMilli = Qty::toMilli($product->stock) + $deltaMilli;
        if ($stockMilli < 0) {
            throw ValidationException::withMessages([
                'items' => sprintf('Only %s of %s left in stock.', Qty::format($product->stock, $product->sellingUnit()), $product->name),
            ]);
        }

        $product->stock = Qty::fromMilli($stockMilli);
        // save() bumps updated_at, which is what tells the tills to re-sync this product.
        $product->save();

        StockMovement::create([
            'product_id' => $product->id,
            'qty_delta' => Qty::fromMilli($deltaMilli),
            'reason' => $reason,
            'order_id' => $order?->id,
            'user_id' => $user?->id,
            'note' => $note,
        ]);
    }
}
