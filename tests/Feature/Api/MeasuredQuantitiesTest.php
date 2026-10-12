<?php

use App\Actions\Products\ReceiveStock;
use App\Actions\Products\SaveProduct;
use App\Enums\Permission;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Support\Qty;
use Illuminate\Validation\ValidationException;

it('sells by weight, pricing and taking stock to the gram', function () {
    $nails = $this->product(['name' => 'Wire Nails', 'unit' => 'kg', 'price' => 540, 'stock' => 10]);

    $response = $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($nails, 2.345)],
        'payment' => 'CASH',
    ])->assertCreated();

    // 540 × 2.345 = 1266.30
    $response->assertJsonPath('amount', 1266.3)
        ->assertJsonPath('items.0.qty', 2.345)
        ->assertJsonPath('items.0.unit', 'kg');
    expect($nails->refresh()->stock)->toBe('7.655')
        ->and(StockMovement::query()->sole()->qty_delta)->toBe('-2.345');
});

it('sells by length to the centimetre', function () {
    $chain = $this->product(['name' => 'Chain', 'unit' => 'm', 'price' => 420, 'stock' => 50]);
    $pos = $this->pos($this->cashier());

    $pos->postJson('/api/v1/orders', ['items' => [$this->line($chain, 1.25)], 'payment' => 'CASH'])
        ->assertCreated()
        ->assertJsonPath('amount', 525);

    $response = $pos->postJson('/api/v1/orders', ['items' => [$this->line($chain, 1.255)], 'payment' => 'CASH'])->assertUnprocessable();
    $this->assertMessage($response, 'Chain is sold to the nearest 0.01 m');
});

it('refuses part of a counted item', function () {
    $cement = $this->product(['stock' => 10]);

    $response = $this->pos($this->cashier())->postJson('/api/v1/orders', [
        'items' => [$this->line($cement, 1.5)],
        'payment' => 'CASH',
    ])->assertUnprocessable();

    $this->assertMessage($response, 'sold in whole bags');
    expect($cement->refresh()->stock)->toBe('10.000');
});

it('adds up decimal lines exactly and says what is left in the product’s unit', function () {
    $wire = $this->product(['name' => 'Binding Wire', 'unit' => 'kg', 'price' => 650, 'stock' => 0.3]);
    $pos = $this->pos($this->cashier());

    // 0.1 + 0.2 is exactly the 0.3 kg in stock.
    $pos->postJson('/api/v1/orders', ['items' => [$this->line($wire, 0.1), $this->line($wire, 0.2)], 'payment' => 'CASH'])
        ->assertCreated();
    expect($wire->refresh()->stock)->toBe('0.000');

    $response = $pos->postJson('/api/v1/orders', ['items' => [$this->line($wire, 0.5)], 'payment' => 'CASH'])->assertUnprocessable();
    $this->assertMessage($response, 'Only 0 kg of Binding Wire left in stock.');
});

it('puts decimal quantities back when a bill is cancelled or edited', function () {
    $hose = $this->product(['name' => 'Hose', 'unit' => 'ft', 'price' => 95, 'stock' => 100]);
    $pos = $this->pos($this->staffWith([Permission::PosAccess, Permission::OrdersEdit, Permission::OrdersCancel]));

    $invoice = $pos->postJson('/api/v1/orders', ['items' => [$this->line($hose, 12.5)], 'payment' => 'CASH'])->json('invoice');
    expect($hose->refresh()->stock)->toBe('87.500');

    $pos->putJson("/api/v1/orders/{$invoice}/items", ['items' => [$this->line($hose, 20.25)]])->assertOk();
    expect($hose->refresh()->stock)->toBe('79.750');

    $pos->postJson("/api/v1/orders/{$invoice}/cancel")->assertOk();
    expect($hose->refresh()->stock)->toBe('100.000');
});

it('tells the tills how many decimals each product’s quantity may have', function () {
    $this->product(['name' => 'Nails', 'unit' => 'kg', 'stock' => 1.5]);

    $this->pos($this->cashier())->getJson('/api/v1/sync/products')
        ->assertOk()
        ->assertJsonPath('items.0.unit', 'kg')
        ->assertJsonPath('items.0.qtyDecimals', 3)
        ->assertJsonPath('items.0.stock', 1.5);
});

it('keeps stock and deliveries to the product’s unit in the console', function () {
    $admin = $this->admin();
    $product = $this->product();
    $kg = Unit::query()->where('name', 'kg')->sole();
    $bag = Unit::query()->where('name', 'Bag')->sole();
    $data = ['name' => 'Loose Nails', 'category_id' => $product->category_id, 'price' => 540];

    $nails = app(SaveProduct::class)($admin, [...$data, 'unit_id' => $kg->id, 'stock' => 12.345]);
    expect($nails->unit_id)->toBe($kg->id)->and($nails->stock)->toBe('12.345');

    app(ReceiveStock::class)($admin, [$nails->id => '0.655']);
    expect($nails->refresh()->stock)->toBe('13.000');

    expect(fn () => app(SaveProduct::class)($admin, [...$data, 'unit_id' => $bag->id, 'stock' => 2.5], $nails))
        ->toThrow(ValidationException::class, 'sold in whole bags');

    $this->actingAs($admin)->postJson("/admin/api/products/{$nails->id}/receive", ['qty' => 0.25])
        ->assertOk()
        ->assertJsonPath('stock', 13.25)
        ->assertJsonPath('unit', 'kg')
        ->assertJsonPath('measured', true);
    $this->actingAs($admin)->postJson('/admin/api/products', ['name' => 'Odd', 'category' => 'Cement', 'price' => 1, 'unit' => 'Gallon'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('unit');
    $this->actingAs($admin)->postJson('/admin/api/products', ['name' => 'Rope', 'category' => 'Cement', 'price' => 30, 'unit' => 'M', 'stock' => 20.5])
        ->assertCreated()
        ->assertJsonPath('unit', 'm')
        ->assertJsonPath('qtyDecimals', 2);
});

it('lets the console add units and sells in them', function () {
    $admin = $this->admin();

    $this->actingAs($admin)->postJson('/admin/api/units', ['name' => 'Litre', 'measured' => true, 'decimals' => 2])
        ->assertCreated()
        ->assertJsonPath('name', 'Litre')
        ->assertJsonPath('decimals', 2);
    $this->actingAs($admin)->postJson('/admin/api/units', ['name' => 'litre', 'measured' => true])->assertUnprocessable();
    $this->actingAs($admin)->postJson('/admin/api/units', ['name' => 'Coil', 'measured' => false, 'decimals' => 2])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('decimals');

    $thinner = $this->product(['name' => 'Thinner', 'unit' => 'Litre', 'price' => 800, 'stock' => 10]);
    $this->pos($this->cashier())->postJson('/api/v1/orders', ['items' => [$this->line($thinner, 1.75)], 'payment' => 'CASH'])
        ->assertCreated()
        ->assertJsonPath('amount', 1400)
        ->assertJsonPath('items.0.unit', 'Litre')
        ->assertJsonPath('items.0.measured', true);

    $this->actingAs($admin)->getJson('/admin/api/units')->assertOk()->assertJsonFragment(['name' => 'Litre', 'productCount' => 1]);
});

it('keeps units consistent with the products sold by them', function () {
    $admin = $this->admin();
    $kg = Unit::query()->where('name', 'kg')->sole();
    $nails = $this->product(['name' => 'Nails', 'unit' => 'kg', 'stock' => 2.5]);
    $before = $nails->updated_at;
    $this->travel(1)->minutes();

    // Fewer decimals than the stock has is refused; the rename reaches the tills.
    $this->actingAs($admin)->putJson("/admin/api/units/{$kg->id}", ['name' => 'kg', 'measured' => true, 'decimals' => 0])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('decimals');
    $this->actingAs($admin)->putJson("/admin/api/units/{$kg->id}", ['name' => 'Kilo', 'measured' => true, 'decimals' => 1])
        ->assertOk()
        ->assertJsonPath('productCount', 1);
    expect($nails->refresh()->updated_at->gt($before))->toBeTrue();

    $this->actingAs($admin)->deleteJson("/admin/api/units/{$kg->id}")->assertUnprocessable();
    $unused = Unit::query()->where('name', 'Pair')->sole();
    $this->actingAs($admin)->deleteJson("/admin/api/units/{$unused->id}")->assertNoContent();
    expect(Unit::query()->whereKey($unused->id)->exists())->toBeFalse();
});

it('words quantities for messages', function () {
    $unit = fn (string $name) => Unit::query()->where('name', $name)->sole();

    expect(Qty::format(3, $unit('Bag')))->toBe('3 bags')
        ->and(Qty::format(1, $unit('Box')))->toBe('1 box')
        ->and(Qty::format(4, $unit('Box')))->toBe('4 boxes')
        ->and(Qty::format(2.5, $unit('kg')))->toBe('2.5 kg')
        ->and(Qty::format(1250, $unit('m')))->toBe('1,250 m');
});
