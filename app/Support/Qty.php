<?php

namespace App\Support;

use App\Models\Unit;
use Illuminate\Validation\ValidationException;

/**
 * Quantities (stock, bill lines, deliveries) are handled as integer thousandths ("milli") inside
 * calculations so 0.1 + 0.2 kg is exactly 0.3 kg, and are stored as numeric(12,3). Like Money.
 */
final class Qty
{
    public const DECIMALS = 3;

    public const SCALE = 1000;

    public static function toMilli(string|int|float $qty): int
    {
        return (int) round(((float) $qty) * self::SCALE);
    }

    public static function fromMilli(int $milli): string
    {
        return number_format($milli / self::SCALE, self::DECIMALS, '.', '');
    }

    /** Whether the quantity has no more decimals than the unit allows (whole bags, 0.01 m, 0.001 kg). */
    public static function fits(int $milli, Unit $unit): bool
    {
        return $milli % (10 ** (self::DECIMALS - min(self::DECIMALS, $unit->decimals))) === 0;
    }

    /** Refuses a quantity finer than the unit allows, with a message the cashier can act on. */
    public static function ensureFits(int $milli, Unit $unit, string $productName, string $field = 'items'): void
    {
        if (self::fits($milli, $unit)) {
            return;
        }
        throw ValidationException::withMessages([$field => self::precisionMessage($productName, $unit)]);
    }

    /** "Cement is sold in whole bags." / "Chain is sold to the nearest 0.01 m." */
    public static function precisionMessage(string $productName, Unit $unit): string
    {
        return $unit->decimals === 0
            ? sprintf('%s is sold in whole %s. Enter a whole number.', $productName, self::unitName($unit, 2))
            : sprintf('%s is sold to the nearest %s %s.', $productName, number_format(10 ** -$unit->decimals, $unit->decimals), $unit->name);
    }

    /** "2.5 kg", "3 bags", "1 piece": for messages. */
    public static function format(string|int|float $qty, Unit $unit): string
    {
        $value = (float) $qty;
        $number = $unit->decimals === 0
            ? number_format($value, 0, '.', ',')
            : rtrim(rtrim(number_format($value, $unit->decimals, '.', ','), '0'), '.');

        return $number.' '.self::unitName($unit, $value);
    }

    /** Measured units read as written (kg, m); counted ones lower-case and pluralise (bags, boxes). */
    private static function unitName(Unit $unit, float $qty): string
    {
        if ($unit->measured) {
            return $unit->name;
        }
        $name = mb_strtolower($unit->name);
        if ($qty == 1) {
            return $name;
        }

        return preg_match('/(s|x|z|ch|sh)$/', $name) === 1 ? $name.'es' : $name.'s';
    }
}
