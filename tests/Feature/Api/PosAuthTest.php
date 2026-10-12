<?php

use App\Enums\Permission;
use App\Models\Terminal;
use App\Models\User;

it('rejects requests without a registered till', function () {
    $this->getJson('/api/v1/auth/sign-in-accounts')->assertForbidden();
    $this->withHeader('X-Terminal-Key', 'khterm_unknown')->getJson('/api/v1/auth/sign-in-accounts')->assertForbidden();
});

it('rejects a revoked till', function () {
    $this->till()->revoke();

    $this->withHeader('X-Terminal-Key', $this->terminalKey)->getJson('/api/v1/ping')->assertForbidden();
});

it('lists only active cashier accounts on the sign-in screen', function () {
    $this->till();
    $kasun = $this->cashier(['name' => 'Kasun']);
    $this->cashier(['name' => 'Gone', 'active' => false]);
    $this->staffWith([Permission::PageReports]);

    $this->withHeader('X-Terminal-Key', $this->terminalKey)
        ->getJson('/api/v1/auth/sign-in-accounts')
        ->assertOk()
        ->assertExactJson([['id' => (string) $kasun->id, 'name' => 'Kasun', 'code' => $kasun->code, 'initials' => 'K']]);
});

it('signs a cashier in with a token bound to the till', function () {
    $cashier = $this->cashier();
    $token = $this->posLogin($cashier);

    expect($cashier->tokens()->sole()->terminal_id)->toBe($this->terminal->id);

    $this->withHeaders(['X-Terminal-Key' => $this->terminalKey, 'Authorization' => "Bearer $token"])
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('id', (string) $cashier->id)
        ->assertJsonPath('permissions', ['pos.access', 'pos.discount', 'pos.credit']);
});

it('refuses a token used from another till', function () {
    $token = $this->posLogin($this->cashier());
    [, $otherKey] = Terminal::register('Counter 2');

    $this->withHeaders(['X-Terminal-Key' => $otherKey, 'Authorization' => "Bearer $token"])
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

it('gives the same answer for an unknown account and a wrong password', function () {
    $this->till();
    $cashier = $this->cashier();

    $wrong = $this->withHeader('X-Terminal-Key', $this->terminalKey)
        ->postJson('/api/v1/auth/login', ['userId' => (string) $cashier->id, 'password' => 'nope'])->assertUnprocessable();
    $missing = $this->withHeader('X-Terminal-Key', $this->terminalKey)
        ->postJson('/api/v1/auth/login', ['email' => 'nobody@example.com', 'password' => 'nope'])->assertUnprocessable();

    expect($wrong->json('message'))->toBe($missing->json('message'));
});

it('throttles repeated failed sign-ins', function () {
    $this->till();
    $cashier = $this->cashier();
    foreach (range(1, 5) as $_) {
        $this->withHeader('X-Terminal-Key', $this->terminalKey)
            ->postJson('/api/v1/auth/login', ['userId' => (string) $cashier->id, 'password' => 'nope']);
    }

    $this->withHeader('X-Terminal-Key', $this->terminalKey)
        ->postJson('/api/v1/auth/login', ['userId' => (string) $cashier->id, 'password' => 'password'])
        ->assertStatus(429);
});

it('refuses deactivated staff and roles without the cashier screen', function () {
    $this->till();
    $inactive = $this->cashier(['active' => false]);
    $backOffice = $this->staffWith([Permission::PageReports]);

    $this->withHeader('X-Terminal-Key', $this->terminalKey)
        ->postJson('/api/v1/auth/login', ['userId' => (string) $inactive->id, 'password' => 'password'])
        ->assertUnprocessable();
    $this->withHeader('X-Terminal-Key', $this->terminalKey)
        ->postJson('/api/v1/auth/login', ['userId' => (string) $backOffice->id, 'password' => 'password'])
        ->assertUnprocessable();
});

it('ends the session when the account is deactivated or the till revoked', function () {
    $cashier = $this->cashier();
    $token = $this->posLogin($cashier);
    $headers = ['X-Terminal-Key' => $this->terminalKey, 'Authorization' => "Bearer $token"];

    $this->withHeaders($headers)->getJson('/api/v1/auth/me')->assertOk();

    User::query()->whereKey($cashier->id)->update(['active' => false]);
    app('auth')->forgetGuards();
    $this->withHeaders($headers)->getJson('/api/v1/auth/me')->assertUnauthorized();

    User::query()->whereKey($cashier->id)->update(['active' => true]);
    $this->terminal->revoke();
    app('auth')->forgetGuards();
    $this->withHeaders($headers)->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('expires tokens', function () {
    $token = $this->posLogin($this->cashier());

    $this->travel(config('sanctum.expiration') + 1)->minutes();

    $this->withHeaders(['X-Terminal-Key' => $this->terminalKey, 'Authorization' => "Bearer $token"])
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

it('requires a token for every data endpoint', function (string $method, string $uri) {
    $this->till();

    $this->withHeader('X-Terminal-Key', $this->terminalKey)->json($method, $uri)->assertUnauthorized();
})->with([
    ['GET', '/api/v1/products'],
    ['GET', '/api/v1/categories'],
    ['GET', '/api/v1/customers'],
    ['GET', '/api/v1/orders'],
    ['GET', '/api/v1/settings/shop'],
    ['GET', '/api/v1/sync/products'],
    ['GET', '/api/v1/sync/customers'],
    ['POST', '/api/v1/orders'],
]);

it('logs out by revoking the token', function () {
    $cashier = $this->cashier();
    $this->pos($cashier)->postJson('/api/v1/auth/logout')->assertOk();

    expect($cashier->tokens()->count())->toBe(0);
});

it('confirms the password before a till opens its settings, for roles that manage settings', function () {
    $admin = $this->staffWith([Permission::PosAccess, Permission::PageSettings]);

    $this->pos($admin)->postJson('/api/v1/auth/confirm-password', ['password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('password');
    $this->pos($admin)->postJson('/api/v1/auth/confirm-password', ['password' => 'password'])->assertNoContent();

    // A cashier can't, even with the right password.
    $this->pos($this->cashier())->postJson('/api/v1/auth/confirm-password', ['password' => 'password'])->assertForbidden();
});

it('throttles password confirmation', function () {
    $pos = $this->pos($this->staffWith([Permission::PosAccess, Permission::PageSettings]));
    foreach (range(1, 5) as $_) {
        $pos->postJson('/api/v1/auth/confirm-password', ['password' => 'wrong'])->assertUnprocessable();
    }
    $pos->postJson('/api/v1/auth/confirm-password', ['password' => 'password'])->assertStatus(429);
});
