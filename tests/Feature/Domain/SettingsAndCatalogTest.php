<?php

use App\Actions\Catalog\DeleteCatalogRecord;
use App\Actions\Catalog\SaveCategory;
use App\Actions\Customers\DeleteCustomer;
use App\Actions\Products\ReceiveStock;
use App\Actions\Products\SaveProduct;
use App\Actions\Settings\UpdateShopSettings;
use App\Enums\Permission;
use App\Models\ShopSetting;
use App\Models\StockMovement;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

function settingsData(array $overrides = []): array
{
    return ['store_name' => 'Kulatissa Hardware', 'address' => 'Tissa', 'phone' => '', 'reg_no' => '', 'receipt_footer' => "Thanks\r\nCome again\n\n  ", 'low_stock' => 20, 'critical_stock' => 5, ...$overrides];
}

it('validates and normalises shop settings', function () {
    $update = app(UpdateShopSettings::class);

    expect(fn () => $update($this->admin(), settingsData(['store_name' => '  '])))->toThrow(ValidationException::class)
        ->and(fn () => $update($this->admin(), settingsData(['low_stock' => 0])))->toThrow(ValidationException::class)
        ->and(fn () => $update($this->admin(), settingsData(['critical_stock' => 20])))->toThrow(ValidationException::class);

    $settings = $update($this->admin(), settingsData());
    expect($settings->receipt_footer)->toBe("Thanks\nCome again")
        ->and(ShopSetting::current()->receipt_footer)->toBe("Thanks\nCome again");
});

it('needs the prices permission to change a price and the stock permission to change stock', function () {
    $product = $this->product();
    $clerk = $this->staffWith([Permission::PageInventory]);
    $data = ['name' => $product->name, 'brand_id' => $product->brand_id, 'category_id' => $product->category_id, 'unit' => 'Bag', 'price' => 2750, 'display_price' => 0, 'stock' => 100];

    expect(fn () => app(SaveProduct::class)($clerk, [...$data, 'price' => 3000], $product))->toThrow(AuthorizationException::class, 'change prices')
        ->and(fn () => app(SaveProduct::class)($clerk, [...$data, 'stock' => 90], $product))->toThrow(AuthorizationException::class, 'change stock');

    app(SaveProduct::class)($clerk, [...$data, 'name' => 'Renamed'], $product);
    expect($product->refresh()->name)->toBe('Renamed');
});

it('records stock corrections and deliveries in the ledger', function () {
    $product = $this->product(['stock' => 10]);
    $admin = $this->admin();

    app(SaveProduct::class)($admin, ['name' => $product->name, 'category_id' => $product->category_id, 'price' => 2750, 'stock' => 7], $product);
    app(ReceiveStock::class)($admin, [$product->id => 50], 'Lorry from Colombo');

    expect($product->refresh()->stock)->toBe('57.000')
        ->and(StockMovement::query()->orderBy('id')->pluck('qty_delta')->all())->toBe(['-3.000', '50.000']);
});

it('moves products to a category’s new group when it is edited', function () {
    $product = $this->product();

    app(SaveCategory::class)($this->admin(), ['name' => 'Cement', 'group' => 'Building'], $product->category);

    expect($product->refresh()->group)->toBe('Building');
});

it('keeps products when their brand is deleted', function () {
    $product = $this->product();

    app(DeleteCatalogRecord::class)($this->admin(), $product->brand);

    expect($product->refresh()->brand_id)->toBeNull();
});

it('refuses to delete a customer who still owes money', function () {
    $customer = $this->customer(['credit' => 100]);

    expect(fn () => app(DeleteCustomer::class)($this->admin(), $customer))->toThrow(ValidationException::class);
});
