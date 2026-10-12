<?php

use App\Enums\Permission;
use App\Models\Category;

it('returns the full catalogue without a cursor and only changes after it', function () {
    $cement = $this->product();
    $tile = $this->product(['name' => 'Tile']);
    $pos = $this->pos($this->cashier());

    $this->travel(1)->minute();
    $full = $pos->getJson('/api/v1/sync/products')->assertOk();
    expect($full->json('full'))->toBeTrue()
        ->and($full->json('items'))->toHaveCount(2)
        ->and($full->json('deletedIds'))->toBe([]);

    $this->travel(1)->minute();
    $tile->update(['price' => 600]);
    $cement->delete();

    $delta = $pos->getJson('/api/v1/sync/products?since='.urlencode($full->json('cursor')))->assertOk();
    expect($delta->json('full'))->toBeFalse()
        ->and($delta->json('items.*.id'))->toBe([(string) $tile->id])
        ->and($delta->json('items.0.price'))->toEqual(600)
        ->and($delta->json('deletedIds'))->toBe([(string) $cement->id]);
});

it('reports a product whose stock changed through a sale', function () {
    $cement = $this->product();
    $this->product(['name' => 'Untouched']);
    $pos = $this->pos($this->cashier());
    $this->travel(1)->minute();
    $cursor = $pos->getJson('/api/v1/sync/products')->json('cursor');

    $this->travel(1)->minute();
    $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement, 2)], 'payment' => 'CASH'])->assertCreated();

    $delta = $pos->getJson('/api/v1/sync/products?since='.urlencode($cursor));
    expect($delta->json('items.*.name'))->toBe(['Tokyo Cement 50kg'])
        ->and($delta->json('items.0.stock'))->toBe(98)
        ->and($delta->json('items.0.unitsSoldWeek'))->toBe(2);
});

it('reports customers whose balance or stats changed', function () {
    $owing = $this->customer(['name' => 'Owing']);
    $this->customer(['name' => 'Quiet']);
    $pos = $this->pos($this->cashier());
    $this->travel(1)->minute();
    $cursor = $pos->getJson('/api/v1/sync/customers')->json('cursor');

    $this->travel(1)->minute();
    $pos->postJson('/api/v1/orders', ['items' => [$this->line($this->product())], 'payment' => 'CREDIT', 'customerId' => $owing->id]);

    $delta = $pos->getJson('/api/v1/sync/customers?since='.urlencode($cursor));
    expect($delta->json('items.*.name'))->toBe(['Owing'])
        ->and($delta->json('items.0.credit'))->toEqual(2750)
        ->and($delta->json('items.0.orderCount'))->toBe(1);
});

it('answers 304 when categories or settings have not changed, and a new tag after they do', function () {
    $this->product();
    $pos = $this->pos($this->cashier());

    $first = $pos->getJson('/api/v1/categories')->assertOk();
    $etag = $first->headers->get('ETag');
    expect($etag)->not->toBeEmpty();

    $pos->withHeader('If-None-Match', $etag)->getJson('/api/v1/categories')->assertStatus(304);

    Category::query()->first()->update(['name' => 'Cement & Lime']);
    $after = $pos->withHeader('If-None-Match', $etag)->getJson('/api/v1/categories')->assertOk();
    expect($after->headers->get('ETag'))->not->toBe($etag)
        ->and($after->json('0.name'))->toBe('Cement & Lime');

    $settings = $pos->getJson('/api/v1/settings/shop')->assertOk()->assertJsonPath('lowStock', 20);
    $pos->withHeader('If-None-Match', $settings->headers->get('ETag'))->getJson('/api/v1/settings/shop')->assertStatus(304);
});

it('lists the bills changed since the cursor, including edits made elsewhere', function () {
    $cement = $this->product();
    $cashier = $this->cashier();
    $pos = $this->pos($cashier);
    $old = $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CASH'])->json('invoice');
    $other = $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement)], 'payment' => 'CASH'])->json('invoice');

    $this->travel(1)->minute();
    $start = $pos->getJson('/api/v1/sync/orders')->assertOk();
    expect($start->json('invoices'))->toBe([]);

    $this->travel(1)->minute();
    $manager = $this->staffWith([Permission::PosAccess, Permission::OrdersCancel]);
    $this->pos($manager)->postJson("/api/v1/orders/$old/cancel")->assertOk();

    $delta = $pos->getJson('/api/v1/sync/orders?since='.urlencode($start->json('cursor')))->assertOk();
    expect($delta->json('invoices'))->toBe([$old])
        ->and($delta->json('invoices'))->not->toContain($other);
});
