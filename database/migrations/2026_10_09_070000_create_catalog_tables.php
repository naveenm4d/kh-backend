<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('parent')->default('');
            // The product group shown on the POS tabs and in reports (Cement, Steel, ...).
            $table->string('group', 64);
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX categories_name_lower_unique ON categories (lower(name))');

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX brands_name_lower_unique ON brands (lower(name))');

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('supplies')->default('');
            $table->string('phone', 32)->default('');
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            // Denormalised from the category so the POS can filter by group without a join.
            $table->string('group', 64)->index();
            $table->string('unit', 32)->default('Piece');
            $table->decimal('price', 12, 2);
            // Marked price shown to customers; 0 means none.
            $table->decimal('display_price', 12, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->timestamps();
            $table->softDeletes();

            // Delta sync for the tills reads "changed since".
            $table->index('updated_at');
        });
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_prices_non_negative CHECK (price >= 0 AND display_price >= 0)');
        DB::statement('CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('categories');
    }
};
