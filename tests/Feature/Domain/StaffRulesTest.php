<?php

use App\Actions\Staff\DeleteRole;
use App\Actions\Staff\DeleteStaff;
use App\Actions\Staff\SaveRole;
use App\Actions\Staff\SaveStaff;
use App\Enums\Permission;
use App\Models\Role;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

function adminRole(): Role
{
    return Role::query()->where('slug', Role::ADMIN)->firstOrFail();
}

function cashierRole(): Role
{
    return Role::query()->where('slug', Role::CASHIER)->firstOrFail();
}

function staffData(array $overrides = []): array
{
    return ['name' => 'Kasun Fernando', 'code' => 'kasun', 'email' => 'kasun@example.com', 'phone' => '', 'role_id' => cashierRole()->id, 'active' => true, 'password' => 'secret-pass', ...$overrides];
}

it('gives a locked role every permission whatever it stores', function () {
    $role = adminRole();
    $role->forceFill(['permissions' => []])->save();

    expect($role->refresh()->effectivePermissions())->toBe(Permission::values())
        ->and($this->admin()->hasPermission(Permission::RecordsDelete))->toBeTrue();
});

it('keeps a locked role on every permission when edited', function () {
    $role = app(SaveRole::class)($this->admin(), ['name' => 'Admin', 'permissions' => ['pos.access']], adminRole());

    expect($role->permissions)->toBe(Permission::values());
});

it('stores role permissions de-duplicated in catalog order', function () {
    $role = app(SaveRole::class)($this->admin(), ['name' => 'Storekeeper', 'permissions' => ['stock.adjust', 'page.inventory', 'stock.adjust']]);

    expect($role->permissions)->toBe(['page.inventory', 'stock.adjust']);
});

it('refuses to delete system roles or roles still in use', function () {
    $custom = app(SaveRole::class)($this->admin(), ['name' => 'Storekeeper', 'permissions' => []]);
    $this->cashier()->update(['role_id' => $custom->id]);

    expect(fn () => app(DeleteRole::class)($this->admin(), cashierRole()))->toThrow(ValidationException::class)
        ->and(fn () => app(DeleteRole::class)($this->admin(), $custom))->toThrow(ValidationException::class, '1 staff member still has this role');
});

it('creates staff with a normalised code and email', function () {
    $user = app(SaveStaff::class)($this->admin(), staffData(['code' => ' Kasun-F ', 'email' => ' Kasun@Example.com ']));

    expect($user->code)->toBe('kasun-f')
        ->and($user->email)->toBe('kasun@example.com')
        ->and($user->initials)->toBe('KF')
        ->and($user->active)->toBeTrue();
});

it('stops admins deactivating themselves or changing their own role', function () {
    $admin = $this->admin();
    $data = ['name' => $admin->name, 'code' => $admin->code, 'email' => $admin->email, 'role_id' => $admin->role_id];

    expect(fn () => app(SaveStaff::class)($admin, [...$data, 'active' => false], $admin))->toThrow(ValidationException::class, 'deactivate your own')
        ->and(fn () => app(SaveStaff::class)($admin, [...$data, 'role_id' => cashierRole()->id], $admin))->toThrow(ValidationException::class, 'own role');
});

it('protects the last active admin', function () {
    $admin = $this->admin();
    $second = app(SaveStaff::class)($admin, staffData(['role_id' => adminRole()->id, 'code' => 'second', 'email' => 'second@example.com']));

    // With two admins, the second can be demoted...
    app(SaveStaff::class)($admin, staffData(['code' => 'second', 'email' => 'second@example.com']), $second);

    // ...but then the only admin left can't be deleted, even by someone with users access.
    $manager = $this->staffWith([Permission::PageUsers, Permission::RecordsDelete]);
    expect(fn () => app(DeleteStaff::class)($manager, $admin))->toThrow(ValidationException::class, 'last active admin');
});

it('stops staff deleting themselves', function () {
    $admin = $this->admin();

    expect(fn () => app(DeleteStaff::class)($admin, $admin))->toThrow(ValidationException::class, 'your own account');
});

it('signs staff out everywhere when their role changes', function () {
    $cashier = $this->cashier();
    $this->posLogin($cashier);
    expect($cashier->tokens()->count())->toBe(1);

    app(SaveStaff::class)($this->admin(), [...staffData(), 'name' => $cashier->name, 'code' => $cashier->code, 'email' => $cashier->email, 'role_id' => app(SaveRole::class)($this->admin(), ['name' => 'Other', 'permissions' => ['pos.access']])->id], $cashier);

    expect($cashier->tokens()->count())->toBe(0);
});

it('needs the users page permission to manage staff', function () {
    expect(fn () => app(SaveStaff::class)($this->cashier(), staffData()))->toThrow(AuthorizationException::class);
});
