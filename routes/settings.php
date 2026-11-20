<?php

use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

/*
| The signed-in person's own account: password, two-factor and passkeys. Names, codes, emails and
| roles are managed by admins on the Users page, so there's no self-service profile or deletion.
*/
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('settings', fn () => redirect()->route('security.edit'));

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
