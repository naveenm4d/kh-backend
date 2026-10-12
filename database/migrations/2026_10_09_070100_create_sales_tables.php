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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 32)->default('');
            // Digits of the phone number, so "077 123-4567" and "0771234567" match the same search.
            $table->string('phone_digits', 32)->default('')->index();
            $table->string('address')->default('');
            // Balance owed to the shop.
            $table->decimal('credit', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('updated_at');
        });
        DB::statement('ALTER TABLE customers ADD CONSTRAINT customers_credit_non_negative CHECK (credit >= 0)');

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('invoice', 16)->unique();
            // Idempotency key from the till, so a retried checkout never rings up a second sale.
            $table->uuid('client_ref')->nullable()->unique();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('cashier_name');
            $table->string('cashier_code', 24)->default('');
            $table->foreignId('terminal_id')->nullable()->constrained()->nullOnDelete();
            $table->string('payment', 16);
            $table->string('status', 16)->index();
            $table->decimal('amount', 12, 2);
            $table->decimal('cash_received', 12, 2)->nullable();
            // Business date (shop timezone), kept separately so reports group by day with an index.
            $table->date('sold_on')->index();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'sold_on']);
            $table->index('updated_at'); // tills ask which bills changed (sync/orders)
        });
        // Invoice numbers. Owned by the table so it's dropped with it.
        DB::statement('CREATE SEQUENCE order_invoice_seq START 1 OWNED BY orders.invoice');

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->integer('qty');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount_pct', 7, 4)->default(0);
            $table->decimal('total', 12, 2);
            $table->string('source', 16)->default('STORE');
            $table->timestamps();

            $table->index('product_id');
        });
        DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_qty_positive CHECK (qty > 0)');
        DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_discount_range CHECK (discount_pct >= 0 AND discount_pct <= 100)');

        Schema::create('customer_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('method', 16);
            $table->string('note')->default('');
            $table->date('paid_on');
            $table->timestamps();

            $table->index(['customer_id', 'paid_on']);
        });
        DB::statement('ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_amount_positive CHECK (amount > 0)');

        // Every stock change, with why it happened. Stock on products is the running total.
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('qty_delta');
            $table->string('reason', 16);
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('note')->default('');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['product_id', 'created_at']);
        });

        Schema::create('shop_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name');
            $table->string('address')->default('');
            $table->string('phone', 32)->default('');
            $table->string('reg_no', 64)->default('');
            $table->text('receipt_footer');
            $table->integer('low_stock')->default(20);
            $table->integer('critical_stock')->default(5);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_settings');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('customer_payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('customers');
    }
};
