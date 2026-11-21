<?php

use App\Enums\Permission;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Str;

it('rings up a cash sale, taking stock and recording the ledger', function () {
    $cashier = $this->cashier();
    $cement = $this->product(['stock' => 10]);

    $response = $this->pos($cashier)->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 3, ['source' => 'WAREHOUSE'])],
        'payment' => 'CASH',
        'cashReceived' => 10000,
    ])->assertCreated();

    $response->assertJsonPath('status', 'READY_TO_COLLECT')
        ->assertJsonPath('amount', 8250)
        ->assertJsonPath('cashier', $cashier->name)
        ->assertJsonPath('cashierCode', $cashier->code)
        ->assertJsonPath('customer', 'Walk-in')
        ->assertJsonPath('items.0.source', 'WAREHOUSE');
    expect($cement->refresh()->stock)->toBe('7.000')
        ->and(StockMovement::query()->sole()->qty_delta)->toBe('-3.000');
});

it('numbers invoices sequentially', function () {
    $cashier = $this->cashier();
    $cement = $this->product();
    $pos = $this->pos($cashier);

    $a = $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CASH'])->json('invoice');
    $b = $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CARD'])->json('invoice');

    expect((int) substr($b, 3))->toBe((int) substr($a, 3) + 1)
        ->and($a)->toMatch('/^INV\d{6}$/');
});

it('takes the name and price from the database, not the till', function () {
    $cement = $this->product();

    $response = $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 1, ['unitPrice' => 1])],
        'payment' => 'CASH',
    ])->assertUnprocessable();

    $this->assertMessage($response, 'price of Tokyo Cement 50kg has changed');
    expect(Order::query()->count())->toBe(0);
});

it('lets a cashier sell at the marked price with the automatic discount, without the discount permission', function () {
    $user = $this->staffWith([Permission::PosAccess]);
    $bar = $this->product(['name' => 'Steel Bar', 'price' => 4365, 'display_price' => 4850]);

    $this->pos($user)->postJson('/api/v1/orders', [
        'items' => [$this->line($bar, 2, ['unitPrice' => 4850, 'discountPct' => 10])],
        'payment' => 'CASH',
    ])->assertCreated()->assertJsonPath('amount', 8730);
});

it('needs the discount permission to sell below the selling price', function () {
    $user = $this->staffWith([Permission::PosAccess]);
    $cement = $this->product();

    $response = $this->pos($user)->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 1, ['discountPct' => 20])],
        'payment' => 'CASH',
    ])->assertForbidden();

    $this->assertMessage($response, 'give discounts');
});

it('rejects discounts outside 0-100%', function (float $pct) {
    $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($this->product(), 1, ['discountPct' => $pct])],
        'payment' => 'CASH',
    ])->assertUnprocessable();
})->with([-5.0, 120.0]);

it('refuses to sell more than is in stock, counting repeated lines together', function () {
    $cement = $this->product(['stock' => 5]);

    $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 3), $this->line($cement, 3)],
        'payment' => 'CASH',
    ])->assertUnprocessable();

    expect($cement->refresh()->stock)->toBe('5.000');
});

it('takes stock for every line of the same product', function () {
    $cement = $this->product(['stock' => 10]);

    $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 3), $this->line($cement, 2, ['source' => 'WAREHOUSE'])],
        'payment' => 'CASH',
    ])->assertCreated();

    expect($cement->refresh()->stock)->toBe('5.000');
});

it('refuses archived products', function () {
    $cement = $this->product();
    $cement->delete();

    $this->pos($this->cashier())->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CASH'])
        ->assertUnprocessable();
});

it('adds credit sales to the customer balance and needs a customer and the credit permission', function () {
    $cement = $this->product();
    $customer = $this->customer(['credit' => 1000]);
    $pos = $this->pos($this->cashier());

    $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CREDIT'])->assertUnprocessable();

    $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CREDIT', 'customerId' => $customer->id])
        ->assertCreated()
        ->assertJsonPath('status', 'PAYMENT_PENDING')
        ->assertJsonPath('customerId', (string) $customer->id);
    expect((float) $customer->refresh()->credit)->toBe(3750.0);

    $noCredit = $this->staffWith([Permission::PosAccess]);
    $this->pos($noCredit)->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CREDIT', 'customerId' => $customer->id])
        ->assertForbidden();
});

it('returns the original bill when a checkout is retried', function () {
    $cement = $this->product(['stock' => 10]);
    $pos = $this->pos($this->cashier());
    $payload = ['items' => [$this->line($cement, 2)], 'payment' => 'CASH', 'clientRef' => (string) Str::uuid()];

    $first = $pos->postJson('/api/v1/orders', $payload)->assertCreated()->json('invoice');
    $second = $pos->postJson('/api/v1/orders', $payload)->assertOk()->json('invoice');

    expect($second)->toBe($first)
        ->and(Order::query()->count())->toBe(1)
        ->and($cement->refresh()->stock)->toBe('8.000');
});

it('rejects cash received below the total', function () {
    $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($this->product())],
        'payment' => 'CASH',
        'cashReceived' => 100,
    ])->assertUnprocessable();
});

it('cancels a bill, putting stock back and reversing credit', function () {
    $cement = $this->product(['stock' => 10]);
    $customer = $this->customer();
    $invoice = $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 4)], 'payment' => 'CREDIT', 'customerId' => $customer->id,
    ])->json('invoice');
    expect($cement->refresh()->stock)->toBe('6.000');

    $manager = $this->staffWith([Permission::PosAccess, Permission::OrdersCancel]);
    $this->pos($manager)->postJson("/api/v1/orders/$invoice/cancel")->assertOk()->assertJsonPath('status', 'CANCELLED');

    expect($cement->refresh()->stock)->toBe('10.000')
        ->and((float) $customer->refresh()->credit)->toBe(0.0);
    $this->pos($manager)->postJson("/api/v1/orders/$invoice/cancel")->assertUnprocessable();
});

it('needs the cancel permission to cancel', function () {
    $cashier = $this->cashier();
    $invoice = $this->pos($cashier)->postJson('/api/v1/orders', ['items' => [$this->line($this->product())], 'payment' => 'CASH'])->json('invoice');

    $this->pos($cashier)->postJson("/api/v1/orders/$invoice/cancel")->assertForbidden();
});

it('starts bills without warehouse lines as completed, or payment pending on credit', function () {
    $cement = $this->product();
    $pos = $this->pos($this->cashier());

    $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CARD'])
        ->assertJsonPath('status', 'COMPLETED');
    $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CREDIT', 'customerId' => $this->customer()->id])
        ->assertJsonPath('status', 'PAYMENT_PENDING');
});

it('keeps bills with warehouse lines ready to collect until collected', function (string $payment, string $after) {
    $cement = $this->product();
    $tile = $this->product(['name' => 'Tile', 'price' => 500]);
    $pos = $this->pos($this->cashier());

    $invoice = $pos->postJson('/api/v1/orders', [
        'items' => [$this->line($tile), $this->line($cement, 1, ['source' => 'WAREHOUSE'])],
        'payment' => $payment,
        'customerId' => $this->customer()->id,
    ])->assertJsonPath('status', 'READY_TO_COLLECT')->json('invoice');

    $pos->postJson("/api/v1/orders/$invoice/issue")->assertOk()->assertJsonPath('status', $after);
    $this->assertMessage($pos->postJson("/api/v1/orders/$invoice/issue")->assertUnprocessable(), 'Only bills waiting for collection');
})->with([['CASH', 'COMPLETED'], ['CREDIT', 'PAYMENT_PENDING']]);

it('only marks bills waiting at the warehouse as collected', function () {
    $pos = $this->pos($this->cashier());
    $cash = $pos->postJson('/api/v1/orders', ['items' => [$this->line($this->product())], 'payment' => 'CASH'])->json('invoice');

    $pos->postJson("/api/v1/orders/$cash/issue")->assertUnprocessable();
});

it('marks payment pending bills as paid with the settle permission, leaving the balance alone', function () {
    $cement = $this->product();
    $customer = $this->customer();
    $invoice = $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($cement)], 'payment' => 'CREDIT', 'customerId' => $customer->id,
    ])->json('invoice');

    $this->pos($this->cashier())->postJson("/api/v1/orders/$invoice/settle")->assertForbidden();

    $settler = $this->pos($this->staffWith([Permission::PosAccess, Permission::OrdersSettle]));
    $settler->postJson("/api/v1/orders/$invoice/settle")->assertOk()->assertJsonPath('status', 'COMPLETED');
    expect((float) $customer->refresh()->credit)->toBe(2750.0);

    $this->assertMessage($settler->postJson("/api/v1/orders/$invoice/settle")->assertUnprocessable(), 'Only bills waiting for payment');
});

it('settles from the admin console too', function () {
    $invoice = $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($this->product())], 'payment' => 'CREDIT', 'customerId' => $this->customer()->id,
    ])->json('invoice');

    $this->actingAs($this->staffWith([Permission::PageOrders]))->postJson("/admin/api/orders/$invoice/settle")->assertForbidden();
    $this->actingAs($this->staffWith([Permission::PageOrders, Permission::OrdersSettle]))
        ->postJson("/admin/api/orders/$invoice/settle")->assertOk()->assertJsonPath('status', 'COMPLETED');
});

it('recomputes the status when an edit changes the warehouse lines', function () {
    $cement = $this->product(['stock' => 20]);
    $tile = $this->product(['name' => 'Tile', 'price' => 500, 'stock' => 20]);
    $pos = $this->pos($this->staffWith([Permission::PosAccess, Permission::OrdersEdit]));
    $warehouse = fn (int $qty) => $this->line($cement, $qty, ['source' => 'WAREHOUSE']);

    $invoice = $pos->postJson('/api/v1/orders', ['items' => [$warehouse(2)], 'payment' => 'CASH'])->json('invoice');

    // Nothing left to collect: the bill moves on.
    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => [$this->line($tile)]])->assertJsonPath('status', 'COMPLETED');
    // Editing store lines on a finished bill keeps it finished.
    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => [$this->line($tile, 2)]])->assertJsonPath('status', 'COMPLETED');
    // New warehouse goods have to be collected again.
    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => [$this->line($tile, 2), $warehouse(1)]])->assertJsonPath('status', 'READY_TO_COLLECT');
    $pos->postJson("/api/v1/orders/$invoice/issue")->assertJsonPath('status', 'COMPLETED');
    // Lowering a collected warehouse quantity doesn't reopen it; raising it does.
    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => [$warehouse(1)]])->assertJsonPath('status', 'COMPLETED');
    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => [$warehouse(3)]])->assertJsonPath('status', 'READY_TO_COLLECT');
});

it('edits bill items like cancel-then-recreate, keeping the original price allowed', function () {
    $cement = $this->product(['stock' => 20]);
    $tile = $this->product(['name' => 'Tile', 'price' => 500, 'stock' => 20]);
    $customer = $this->customer();
    $editor = $this->staffWith([Permission::PosAccess, Permission::PosCredit, Permission::OrdersEdit]);
    $pos = $this->pos($editor);
    $invoice = $pos->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 4)], 'payment' => 'CREDIT', 'customerId' => $customer->id,
    ])->json('invoice');

    // The price goes up after the sale; the bill can keep its original price.
    $cement->update(['price' => 3000]);

    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => [
        $this->line($cement, 2, ['unitPrice' => 2750]),
        $this->line($tile, 3),
    ]])->assertOk()->assertJsonPath('amount', 7000);

    expect($cement->refresh()->stock)->toBe('18.000')
        ->and($tile->refresh()->stock)->toBe('17.000')
        ->and((float) $customer->refresh()->credit)->toBe(7000.0);
});

it('filters and pages bills newest first', function () {
    $cashier = $this->cashier();
    $cement = $this->product();
    $pos = $this->pos($cashier);
    foreach (range(1, 3) as $_) {
        $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CASH']);
    }
    $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CARD']);

    $pos->getJson('/api/v1/orders?payment=CASH&pageSize=2')
        ->assertOk()
        ->assertJsonPath('total', 3)
        ->assertJsonCount(2, 'items')
        ->assertJsonPath('pageSize', 2);
    expect($pos->getJson('/api/v1/orders')->json('items.0.payment'))->toBe('CARD');
});

it('reports a missing bill as not found', function () {
    $this->pos($this->cashier())->getJson('/api/v1/orders/INV999999')->assertNotFound()
        ->assertJsonPath('message', 'That order no longer exists.');
});

it('computes units sold this week from bills', function () {
    $cement = $this->product();
    $this->pos($this->cashier())->postJson('/api/v1/orders', ['items' => [$this->line($cement, 5)], 'payment' => 'CASH']);

    $this->getJson("/api/v1/products/{$cement->id}")
        ->assertJsonPath('unitsSoldWeek', 5)
        ->assertJsonPath('unitsSoldMonth', 5)
        ->assertJsonPath('stock', 95);
    expect(Product::query()->count())->toBe(1)->and(Customer::query()->count())->toBe(0);
});

it('keeps a manual line discount when another line is edited', function () {
    $user = $this->staffWith([Permission::PosAccess, Permission::PosDiscount, Permission::OrdersEdit]);
    $cement = $this->product();
    $sand = $this->product(['name' => 'River Sand', 'price' => 1200]);
    $pos = $this->pos($user);
    $invoice = $pos->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 2, ['discountPct' => 7.35]), $this->line($sand, 1)],
        'payment' => 'CASH',
    ])->assertCreated()->json('invoice');

    // The edit screen sends back each line's stored discount, changing only the sand.
    $items = collect($pos->getJson("/api/v1/orders/$invoice")->assertOk()->json('items'))
        ->map(fn (array $i) => [
            'productId' => (int) $i['productId'], 'qty' => $i['name'] === 'River Sand' ? 3 : $i['qty'],
            'unitPrice' => $i['unitPrice'], 'discountPct' => $i['discountPct'], 'source' => $i['source'],
        ])->all();
    expect($items[0]['discountPct'])->toBe(7.35);

    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => $items])->assertOk()
        ->assertJsonPath('items.0.discountPct', 7.35)
        ->assertJsonPath('items.0.total', 5095.75);
});
