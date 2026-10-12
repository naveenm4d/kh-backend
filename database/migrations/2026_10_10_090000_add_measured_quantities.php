<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Lets products be sold by length or weight as well as by count. Units become a catalogue list the
 * console manages (counted units take whole numbers, measured ones up to 3 decimals), products point
 * at one, quantities become numeric(12,3), and each bill line keeps the unit it was sold in.
 */
return new class extends Migration
{
    /** The starting list: name => [measured, decimals]. */
    private const DEFAULTS = [
        'Piece' => [false, 0], 'Bag' => [false, 0], 'Box' => [false, 0], 'Roll' => [false, 0],
        'Tin' => [false, 0], 'Pack' => [false, 0], 'Set' => [false, 0], 'Pair' => [false, 0],
        'm' => [true, 2], 'ft' => [true, 2], 'kg' => [true, 3], 'g' => [true, 0],
    ];

    /** Old free-text spellings of the defaults. Anything else becomes a counted unit of its own. */
    private const ALIASES = [
        'pieces' => 'Piece', 'pc' => 'Piece', 'pcs' => 'Piece', 'nos' => 'Piece', 'no' => 'Piece', 'each' => 'Piece', 'unit' => 'Piece', 'units' => 'Piece', '' => 'Piece',
        'bags' => 'Bag', 'boxes' => 'Box', 'rolls' => 'Roll', 'tins' => 'Tin', 'packs' => 'Pack', 'packet' => 'Pack', 'packets' => 'Pack', 'sets' => 'Set', 'pairs' => 'Pair',
        'meter' => 'm', 'meters' => 'm', 'metre' => 'm', 'metres' => 'm',
        'foot' => 'ft', 'feet' => 'ft',
        'kgs' => 'kg', 'kilo' => 'kg', 'kilos' => 'kg', 'kilogram' => 'kg', 'kilograms' => 'kg',
        'gram' => 'g', 'grams' => 'g',
    ];

    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name', 24);
            // Sold by length or weight: quantities print with the unit ("2.5 kg") and may have decimals.
            $table->boolean('measured')->default(false);
            $table->smallInteger('decimals')->default(0);
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX units_name_lower_unique ON units (lower(name))');
        DB::statement('ALTER TABLE units ADD CONSTRAINT units_decimals_range CHECK (decimals BETWEEN 0 AND 3 AND (measured OR decimals = 0))');

        $now = now();
        foreach (self::DEFAULTS as $name => [$measured, $decimals]) {
            DB::table('units')->insert(['name' => $name, 'measured' => $measured, 'decimals' => $decimals, 'created_at' => $now, 'updated_at' => $now]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('unit_id')->nullable()->after('group')->constrained()->restrictOnDelete();
        });
        foreach (DB::table('products')->distinct()->pluck('unit') as $old) {
            DB::table('products')->where('unit', $old)->update(['unit_id' => $this->unitIdFor((string) $old)]);
        }
        DB::statement('ALTER TABLE products ALTER COLUMN unit_id SET NOT NULL');
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('unit'));

        DB::statement('ALTER TABLE products ALTER COLUMN stock TYPE numeric(12,3)');
        DB::statement('ALTER TABLE order_items ALTER COLUMN qty TYPE numeric(12,3)');
        DB::statement('ALTER TABLE stock_movements ALTER COLUMN qty_delta TYPE numeric(12,3)');

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('unit', 24)->default('Piece')->after('qty');
            $table->boolean('unit_measured')->default(false)->after('unit');
        });
        DB::statement('UPDATE order_items SET unit = units.name, unit_measured = units.measured FROM products JOIN units ON units.id = products.unit_id WHERE products.id = order_items.product_id');
    }

    public function down(): void
    {
        Schema::table('order_items', fn (Blueprint $table) => $table->dropColumn(['unit', 'unit_measured']));
        DB::statement('ALTER TABLE stock_movements ALTER COLUMN qty_delta TYPE integer USING round(qty_delta)');
        DB::statement('ALTER TABLE order_items ALTER COLUMN qty TYPE integer USING greatest(round(qty), 1)');
        DB::statement('ALTER TABLE products ALTER COLUMN stock TYPE integer USING round(stock)');

        Schema::table('products', fn (Blueprint $table) => $table->string('unit', 32)->default('Piece')->after('group'));
        DB::statement('UPDATE products SET unit = units.name FROM units WHERE units.id = products.unit_id');
        Schema::table('products', fn (Blueprint $table) => $table->dropConstrainedForeignId('unit_id'));
        Schema::dropIfExists('units');
    }

    private function unitIdFor(string $old): int
    {
        $name = trim($old);
        $name = self::ALIASES[mb_strtolower($name)] ?? $name;
        $id = DB::table('units')->whereRaw('lower(name) = ?', [mb_strtolower($name)])->value('id');
        if ($id !== null) {
            return (int) $id;
        }

        return DB::table('units')->insertGetId(['name' => mb_substr($name, 0, 24), 'created_at' => now(), 'updated_at' => now()]);
    }
};
