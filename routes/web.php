<?php

use App\Http\Controllers\Admin\CatalogController;
use App\Http\Controllers\Admin\InsightsController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\TerminalController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('admin.home'))->name('home');

/*
| The admin console. Pages render through Inertia; the data they show and change goes through the
| JSON routes under /admin/api, on the same session and CSRF protection. Every action re-checks
| permissions itself, so the `can:` gates here are the first line, not the only one.
*/
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Land on the first page this person's role opens.
    Route::get('/', function (Request $request) {
        /** @var User $user */
        $user = $request->user();
        foreach (['dashboard', 'reports', 'orders', 'customers', 'inventory', 'catalog', 'users', 'settings'] as $page) {
            if ($user->can("page.$page")) {
                return redirect()->route("admin.$page");
            }
        }
        abort(403);
    })->name('home');

    foreach (['dashboard', 'reports', 'orders', 'customers', 'inventory', 'catalog', 'users', 'settings'] as $page) {
        Route::inertia($page, "admin/$page")->middleware("can:page.$page")->name($page);
    }
    Route::inertia('terminals', 'admin/terminals')->middleware('can:page.settings')->name('terminals');

    Route::prefix('api')->name('api.')->middleware('throttle:admin-api')->group(function () {
        Route::get('dashboard', [InsightsController::class, 'dashboard'])->middleware('can:page.dashboard');
        Route::get('reports/summary', [InsightsController::class, 'report'])->middleware('can:page.reports');

        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/{product}', [ProductController::class, 'show'])->whereNumber('product');
        Route::post('products', [AdminProductController::class, 'store']);
        Route::put('products/{product}', [AdminProductController::class, 'update'])->whereNumber('product');
        Route::delete('products/{product}', [AdminProductController::class, 'destroy'])->whereNumber('product');
        Route::post('products/{product}/receive', [AdminProductController::class, 'receive'])->whereNumber('product');

        Route::get('categories', [CategoryController::class, 'index']);
        Route::post('categories', [CatalogController::class, 'storeCategory']);
        Route::put('categories/{category}', [CatalogController::class, 'updateCategory'])->whereNumber('category');
        Route::delete('categories/{category}', [CatalogController::class, 'destroyCategory'])->whereNumber('category');
        Route::get('brands', [CatalogController::class, 'brands']);
        Route::post('brands', [CatalogController::class, 'storeBrand']);
        Route::put('brands/{brand}', [CatalogController::class, 'updateBrand'])->whereNumber('brand');
        Route::delete('brands/{brand}', [CatalogController::class, 'destroyBrand'])->whereNumber('brand');
        Route::get('units', [CatalogController::class, 'units']);
        Route::post('units', [CatalogController::class, 'storeUnit']);
        Route::put('units/{unit}', [CatalogController::class, 'updateUnit'])->whereNumber('unit');
        Route::delete('units/{unit}', [CatalogController::class, 'destroyUnit'])->whereNumber('unit');
        Route::get('suppliers', [CatalogController::class, 'suppliers']);
        Route::post('suppliers', [CatalogController::class, 'storeSupplier']);
        Route::put('suppliers/{supplier}', [CatalogController::class, 'updateSupplier'])->whereNumber('supplier');
        Route::delete('suppliers/{supplier}', [CatalogController::class, 'destroySupplier'])->whereNumber('supplier');

        Route::middleware('can:view-sales')->group(function () {
            Route::get('customers', [CustomerController::class, 'index']);
            Route::get('customers/{customer}', [CustomerController::class, 'show'])->whereNumber('customer');
            Route::get('orders', [OrderController::class, 'index']);
            Route::get('orders/{order}', [OrderController::class, 'show']);
        });
        Route::post('customers', [CustomerController::class, 'store']);
        Route::put('customers/{customer}', [CustomerController::class, 'update'])->whereNumber('customer');
        Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->whereNumber('customer');
        Route::post('customers/{customer}/payments', [CustomerController::class, 'recordPayment'])->whereNumber('customer');

        Route::put('orders/{order}/items', [OrderController::class, 'updateItems']);
        Route::post('orders/{order}/issue', [OrderController::class, 'issue']);
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);

        Route::middleware('can:page.users')->group(function () {
            Route::get('staff', [StaffController::class, 'index']);
            Route::post('staff', [StaffController::class, 'store']);
            Route::put('staff/{staff}', [StaffController::class, 'update'])->whereNumber('staff');
            Route::delete('staff/{staff}', [StaffController::class, 'destroy'])->whereNumber('staff');
            Route::post('staff/{staff}/password', [StaffController::class, 'resetPassword'])->whereNumber('staff');
            Route::get('roles', [StaffController::class, 'roles']);
            Route::post('roles', [StaffController::class, 'storeRole']);
            Route::put('roles/{role}', [StaffController::class, 'updateRole'])->whereNumber('role');
            Route::delete('roles/{role}', [StaffController::class, 'destroyRole'])->whereNumber('role');
            Route::get('permissions', [StaffController::class, 'permissions']);
        });

        Route::get('settings/shop', [SettingsController::class, 'shop']);
        Route::put('settings/shop', [SettingsController::class, 'updateShop']);
        Route::get('terminals', [TerminalController::class, 'index']);
        Route::post('terminals', [TerminalController::class, 'store']);
        Route::delete('terminals/{terminal}', [TerminalController::class, 'destroy'])->whereNumber('terminal');
    });
});

require __DIR__.'/settings.php';
