<?php

use App\Enums\Permission;
use App\Models\CustomerPayment;

it('lets a cashier add a customer but not set a balance', function () {
    $user = $this->staffWith([Permission::PosAccess]);
    $pos = $this->pos($user);

    $pos->postJson('/api/v1/customers', ['name' => 'Nimal', 'phone' => '0712345678'])
        ->assertCreated()
        ->assertJsonPath('credit', 0)
        ->assertJsonPath('orderCount', 0);
    $pos->postJson('/api/v1/customers', ['name' => 'Owing', 'credit' => 500])->assertForbidden();
});

it('needs the payments permission to change a balance by hand', function () {
    $customer = $this->customer(['credit' => 1000]);
    $this->pos($this->cashier())->putJson("/api/v1/customers/{$customer->id}", ['name' => 'Renamed', 'credit' => 0])
        ->assertForbidden();

    $this->pos($this->cashier())->putJson("/api/v1/customers/{$customer->id}", ['name' => 'Renamed'])
        ->assertOk()
        ->assertJsonPath('credit', 1000)
        ->assertJsonPath('name', 'Renamed');
});

it('finds customers by phone digits, name or address', function () {
    $this->customer(['name' => 'Kasun Perera', 'phone' => '077 123-4567', 'address' => 'Tissa']);
    $this->customer(['name' => 'Nimal Silva', 'phone' => '0712345678', 'address' => 'Kirinda']);
    $pos = $this->pos($this->cashier());

    expect($pos->getJson('/api/v1/customers?search=0771234')->json('items.*.name'))->toBe(['Kasun Perera'])
        ->and($pos->getJson('/api/v1/customers?search=kirin')->json('items.*.name'))->toBe(['Nimal Silva'])
        ->and($pos->getJson('/api/v1/customers?search=SILVA')->json('total'))->toBe(1);
});

it('lists owing customers largest balance first', function () {
    $this->customer(['name' => 'A', 'credit' => 100]);
    $this->customer(['name' => 'B', 'credit' => 900]);
    $this->customer(['name' => 'C']);

    expect($this->pos($this->cashier())->getJson('/api/v1/customers?owing=1')->json('items.*.name'))->toBe(['B', 'A']);
});

it('records a payment against credit within the balance', function () {
    $customer = $this->customer(['credit' => 1000]);
    $user = $this->staffWith([Permission::PosAccess, Permission::CustomersPayment]);
    $pos = $this->pos($user);

    $pos->postJson("/api/v1/customers/{$customer->id}/payments", ['amount' => 1600, 'method' => 'CASH'])->assertUnprocessable();
    $pos->postJson("/api/v1/customers/{$customer->id}/payments", ['amount' => 100, 'method' => 'CREDIT'])->assertUnprocessable();
    $pos->postJson("/api/v1/customers/{$customer->id}/payments", ['amount' => 0, 'method' => 'CASH'])->assertUnprocessable();

    // Up to half a rupee over is rounding, and is clamped to the balance.
    $pos->postJson("/api/v1/customers/{$customer->id}/payments", ['amount' => 1000.4, 'method' => 'CARD', 'note' => ' paid '])
        ->assertCreated()
        ->assertJsonPath('amount', 1000)
        ->assertJsonPath('note', 'paid');

    expect((float) $customer->refresh()->credit)->toBe(0.0);
    $pos->postJson("/api/v1/customers/{$customer->id}/payments", ['amount' => 1, 'method' => 'CASH'])->assertUnprocessable();
});

it('needs the payments permission to record a payment', function () {
    $customer = $this->customer(['credit' => 1000]);

    $this->pos($this->staffWith([Permission::PosAccess]))
        ->postJson("/api/v1/customers/{$customer->id}/payments", ['amount' => 100, 'method' => 'CASH'])
        ->assertForbidden();
    expect(CustomerPayment::query()->count())->toBe(0);
});

it('shows a customer with all their bills and payments', function () {
    $cement = $this->product();
    $customer = $this->customer();
    $pos = $this->pos($this->cashier());
    $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement, 2)], 'payment' => 'CASH', 'customerId' => $customer->id]);

    $pos->getJson("/api/v1/customers/{$customer->id}")
        ->assertOk()
        ->assertJsonPath('spent', 5500)
        ->assertJsonPath('orderCount', 1)
        ->assertJsonPath('lastPurchase', now()->toDateString())
        ->assertJsonCount(1, 'bills')
        ->assertJsonCount(0, 'payments');
});
