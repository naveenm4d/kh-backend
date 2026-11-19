<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\SyncController;
use Illuminate\Support\Facades\Route;

/*
| POS API for the desktop tills. Every route needs a registered till (X-Terminal-Key); everything
| but sign-in also needs a staff bearer token issued on that same till.
*/

Route::prefix('v1')->middleware('terminal')->group(function () {
    Route::get('ping', fn () => response()->json(['ok' => true]))->middleware('throttle:pos-public');

    Route::middleware('throttle:pos-public')->group(function () {
        Route::get('auth/sign-in-accounts', [AuthController::class, 'signInAccounts']);
        Route::post('auth/login', [AuthController::class, 'login']);
    });

    Route::middleware(['auth:sanctum', 'abilities:pos', 'throttle:pos'])->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/confirm-password', [AuthController::class, 'confirmPassword']);

        Route::get('sync/products', [SyncController::class, 'products']);
        Route::get('sync/customers', [SyncController::class, 'customers']);
        Route::get('sync/orders', [SyncController::class, 'orders']);

        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/{product}', [ProductController::class, 'show'])->whereNumber('product');
        Route::get('categories', [CategoryController::class, 'index']);
        Route::get('settings/shop', [SettingsController::class, 'shop']);

        Route::get('customers', [CustomerController::class, 'index']);
        Route::post('customers', [CustomerController::class, 'store']);
        Route::get('customers/{customer}', [CustomerController::class, 'show'])->whereNumber('customer');
        Route::put('customers/{customer}', [CustomerController::class, 'update'])->whereNumber('customer');
        Route::post('customers/{customer}/payments', [CustomerController::class, 'recordPayment'])->whereNumber('customer');

        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::put('orders/{order}/items', [OrderController::class, 'updateItems']);
        Route::post('orders/{order}/issue', [OrderController::class, 'issue']);
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
    });
});
