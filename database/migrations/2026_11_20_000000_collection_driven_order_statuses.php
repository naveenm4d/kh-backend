<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Moves bills onto the collection-driven statuses. Credit bills not yet issued wait at the
 * warehouse if they have warehouse lines, otherwise for payment; issued credit bills wait for
 * payment. Completed and cancelled bills are left alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::update(<<<'SQL'
            UPDATE orders SET status = 'READY_TO_COLLECT'
            WHERE status = 'PENDING'
              AND EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = orders.id AND i.source = 'WAREHOUSE')
            SQL);
        DB::update("UPDATE orders SET status = 'PAYMENT_PENDING' WHERE status IN ('PENDING', 'ISSUED')");
    }

    public function down(): void
    {
        DB::update("UPDATE orders SET status = 'PENDING' WHERE status = 'READY_TO_COLLECT'");
        DB::update("UPDATE orders SET status = 'ISSUED' WHERE status = 'PAYMENT_PENDING'");
    }
};
