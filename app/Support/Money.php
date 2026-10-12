<?php

namespace App\Support;

/**
 * Rupee amounts are handled as integer cents inside calculations so totals never drift, and are
 * stored/serialised as 2-decimal values.
 */
final class Money
{
    public static function toCents(string|int|float $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    public static function fromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    /** Line total: unit price × qty (in Qty thousandths), less the line's percentage discount, rounded to the cent. */
    public static function lineTotalCents(int $unitCents, int $qtyMilli, float $discountPct): int
    {
        return (int) round($unitCents * $qtyMilli * (100 - $discountPct) / 100 / Qty::SCALE);
    }

    public static function format(string|int|float $amount): string
    {
        return 'Rs. '.number_format(round((float) $amount), 0);
    }
}
