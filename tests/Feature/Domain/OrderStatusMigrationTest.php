<?php

use Illuminate\Support\Facades\DB;

it('moves old bills onto the collection-driven statuses', function () {
    $pos = $this->pos($this->cashier());
    $cement = $this->product();
    $customer = $this->customer();
    $bill = fn (string $source, string $payment) => $pos->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 1, ['source' => $source])], 'payment' => $payment, 'customerId' => $customer->id,
    ])->json('invoice');

    $old = [
        'pendingWarehouse' => [$bill('WAREHOUSE', 'CREDIT'), 'PENDING', 'READY_TO_COLLECT'],
        'pendingStore' => [$bill('STORE', 'CREDIT'), 'PENDING', 'PAYMENT_PENDING'],
        'issued' => [$bill('WAREHOUSE', 'CREDIT'), 'ISSUED', 'PAYMENT_PENDING'],
        'completed' => [$bill('WAREHOUSE', 'CASH'), 'COMPLETED', 'COMPLETED'],
        'cancelled' => [$bill('STORE', 'CASH'), 'CANCELLED', 'CANCELLED'],
    ];
    foreach ($old as [$invoice, $status]) {
        DB::table('orders')->where('invoice', $invoice)->update(['status' => $status]);
    }

    (require database_path('migrations/2026_11_20_000000_collection_driven_order_statuses.php'))->up();

    foreach ($old as [$invoice, , $expected]) {
        expect(DB::table('orders')->where('invoice', $invoice)->value('status'))->toBe($expected);
    }
});
