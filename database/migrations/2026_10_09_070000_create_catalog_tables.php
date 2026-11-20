<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The catalogue. Names that must be unique are unique ignoring case: the utf8mb4_unicode_ci
 * collation compares case-insensitively, so a plain unique index is enough.
 */
return new class extends Migration
{
    /** The starting unit list: name => [measured, decimals]. */
    private const DEFAULT_UNITS = [
        'Piece' => [false, 0], 'Bag' => [false, 0], 'Box' => [false, 0], 'Roll' => [false, 0],
        'Tin' => [false, 0], 'Pack' => [false, 0], 'Set' => [false, 0], 'Pair' => [false, 0],
        'm' => [true, 2], 'ft' => [true, 2], 'kg' => [true, 3], 'g' => [true, 0],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('parent')->default('');
            // The product group shown on the POS tabs and in reports (Cement, Steel, ...).
            $table->string('group', 64);
            $table->timestamps();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('supplies')->default('');
            $table->string('phone', 32)->default('');
            $table->timestamps();
        });

        // Counted units take whole numbers; measured ones (length, weight) up to 3 decimals.
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name', 24)->unique();
            // Sold by length or weight: quantities print with the unit ("2.5 kg") and may have decimals.
            $table->boolean('measured')->default(false);
            $table->smallInteger('decimals')->default(0);
            $table->timestamps();
        });
        DB::statement('ALTER TABLE units ADD CONSTRAINT units_decimals_range CHECK (decimals BETWEEN 0 AND 3 AND (measured OR decimals = 0))');

        $now = now();
        foreach (self::DEFAULT_UNITS as $name => [$measured, $decimals]) {
            DB::table('units')->insert(['name' => $name, 'measured' => $measured, 'decimals' => $decimals, 'created_at' => $now, 'updated_at' => $now]);
        }

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            // Denormalised from the category so the POS can filter by group without a join.
            $table->string('group', 64)->index();
            $table->foreignId('unit_id')->constrained()->restrictOnDelete();
            $table->decimal('price', 12, 2);
            // Marked price shown to customers; 0 means none.
            $table->decimal('display_price', 12, 2)->default(0);
            $table->decimal('stock', 12, 3)->default(0);
            $table->timestamps();
            $table->softDeletes();

            // Delta sync for the tills reads "changed since".
            $table->index('updated_at');
        });
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_prices_non_negative CHECK (price >= 0 AND display_price >= 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('units');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('categories');
    }
};
