<?php

use App\Actions\Products\SaveProduct;
use App\Actions\Staff\SaveRole;
use App\Actions\Staff\SaveStaff;
use App\Enums\ActivityAction;
use App\Enums\Permission;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use App\Support\Activity;
use Illuminate\Database\Eloquent\Collection;

function entries(ActivityAction $action): Collection
{
    return ActivityLog::query()->where('action', $action)->orderBy('id')->get();
}

it('logs a cancelled bill with who did it, on which till, from where', function () {
    $manager = $this->staffWith([Permission::PosAccess, Permission::OrdersCancel]);
    $cement = $this->product();
    $pos = $this->pos($manager);
    $invoice = $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement, 2)], 'payment' => 'CASH'])->json('invoice');

    $pos->postJson("/api/v1/orders/$invoice/cancel")->assertOk();

    $entry = entries(ActivityAction::OrderCancelled)->sole();
    expect($entry->user_id)->toBe($manager->id)
        ->and($entry->actor_name)->toBe($manager->name)
        ->and($entry->terminal_name)->toBe('Counter 1')
        ->and($entry->ip)->toBe('127.0.0.1')
        ->and($entry->subject_type)->toBe('order')
        ->and($entry->subject_label)->toBe($invoice)
        ->and($entry->summary)->toBe("Cancelled bill $invoice (Rs. 5,500)")
        ->and(collect($entry->changes)->firstWhere('field', 'status'))->toMatchArray(['from' => 'COMPLETED', 'to' => 'CANCELLED']);
});

it('does not log new sales', function () {
    $this->pos($this->cashier())->postJson('/api/v1/orders', ['items' => [$this->line($this->product())], 'payment' => 'CASH'])->assertCreated();

    expect(ActivityLog::query()->where('action', 'not like', 'auth.%')->count())->toBe(0);
});

it('leaves no entry when the change is refused', function () {
    $manager = $this->staffWith([Permission::PosAccess, Permission::OrdersCancel]);
    $pos = $this->pos($manager);
    $invoice = $pos->postJson('/api/v1/orders', ['items' => [$this->line($this->product())], 'payment' => 'CASH'])->json('invoice');
    $pos->postJson("/api/v1/orders/$invoice/cancel")->assertOk();

    $pos->postJson("/api/v1/orders/$invoice/cancel")->assertUnprocessable();

    expect(entries(ActivityAction::OrderCancelled))->toHaveCount(1);
});

it('logs the items changed on an edited bill', function () {
    $editor = $this->staffWith([Permission::PosAccess, Permission::OrdersEdit]);
    $cement = $this->product();
    $pos = $this->pos($editor);
    $invoice = $pos->postJson('/api/v1/orders', ['items' => [$this->line($cement, 2)], 'payment' => 'CASH'])->json('invoice');

    $pos->putJson("/api/v1/orders/$invoice/items", ['items' => [$this->line($cement, 3)]])->assertOk();

    $entry = entries(ActivityAction::OrderItemsUpdated)->sole();
    expect($entry->summary)->toBe("Edited the items on bill $invoice (Rs. 5,500 → Rs. 8,250)")
        ->and(collect($entry->changes)->firstWhere('label', 'Tokyo Cement 50kg'))->toMatchArray(['from' => '2 Bag × Rs. 2,750', 'to' => '3 Bag × Rs. 2,750']);
});

it('logs price and stock changes with before and after values', function () {
    $cement = $this->product(['stock' => 10]);

    app(SaveProduct::class)($this->admin(), ['name' => $cement->name, 'brand_id' => $cement->brand_id, 'category_id' => $cement->category_id, 'price' => 2900, 'stock' => 12], $cement);

    $entry = entries(ActivityAction::ProductUpdated)->sole();
    $changes = collect($entry->changes)->keyBy('field');
    expect($entry->summary)->toBe('Changed Tokyo Cement 50kg: selling price, stock')
        ->and($changes['price'])->toMatchArray(['label' => 'Selling price', 'from' => '2750.00', 'to' => '2900.00'])
        ->and($changes['stock'])->toMatchArray(['from' => '10 bags', 'to' => '12 bags']);
});

it('does not log a save that changes nothing', function () {
    $cement = $this->product();

    app(SaveProduct::class)($this->admin(), ['name' => $cement->name, 'brand_id' => $cement->brand_id, 'category_id' => $cement->category_id, 'price' => 2750], $cement);

    expect(entries(ActivityAction::ProductUpdated))->toHaveCount(0);
});

it('shows role names, not ids, when a staff member changes role', function () {
    $cashier = $this->cashier();
    $manager = Role::factory()->granting([Permission::PageOrders])->create(['name' => 'Manager']);

    app(SaveStaff::class)($this->admin(), ['name' => $cashier->name, 'code' => $cashier->code, 'email' => $cashier->email, 'role_id' => $manager->id], $cashier);

    expect(collect(entries(ActivityAction::StaffUpdated)->sole()->changes)->firstWhere('field', 'role_id'))
        ->toMatchArray(['label' => 'Role', 'from' => 'Cashier', 'to' => 'Manager']);
});

it('logs permissions added to and removed from a role, by name', function () {
    $role = Role::factory()->granting([Permission::PageOrders])->create(['name' => 'Manager']);

    app(SaveRole::class)($this->admin(), ['name' => 'Manager', 'permissions' => [Permission::PageReports->value]], $role);

    $changes = collect(entries(ActivityAction::RoleSaved)->sole()->changes)->keyBy('field');
    expect($changes['permissions_added']['to'])->toBe('Reports')
        ->and($changes['permissions_removed']['from'])->toBe('Orders');
});

it('never stores passwords', function () {
    $cashier = $this->cashier();

    $this->actingAs($this->admin())->postJson("/admin/api/staff/{$cashier->id}/password", ['password' => 'brand-new-secret'])->assertNoContent();
    auth()->guard('web')->logout();
    $this->post('/login', ['email' => 'nobody@example.com', 'password' => 'typed-secret'])->assertSessionHasErrors('email');

    $reset = entries(ActivityAction::StaffPasswordReset)->sole();
    $failed = entries(ActivityAction::SignInFailed)->sole();
    expect($reset->summary)->toBe("Reset the password for {$cashier->name}")
        ->and($reset->changes)->toBeNull()
        ->and($failed->user_id)->toBeNull()
        ->and($failed->subject_label)->toBe('nobody@example.com')
        ->and(ActivityLog::query()->get()->toJson())->not->toContain('brand-new-secret')->not->toContain('typed-secret');
});

it('logs console sign-ins and till sign-ins', function () {
    $admin = User::factory()->admin()->create();
    $this->post('/login', ['email' => $admin->email, 'password' => 'password'])->assertSessionHasNoErrors();
    $this->posLogin($this->cashier());

    $signIns = entries(ActivityAction::SignedIn);
    expect($signIns)->toHaveCount(2)
        ->and($signIns[0]->summary)->toBe('Signed in to the admin console')
        ->and($signIns[1]->summary)->toBe('Signed in on till Counter 1')
        ->and($signIns[1]->terminal_name)->toBe('Counter 1');
});

it('shows the log only to roles with the activity permission', function () {
    $this->actingAs($this->staffWith([Permission::PageUsers]))->getJson('/admin/api/activity')->assertForbidden();
    $this->actingAs($this->staffWith([Permission::PageUsers]))->get('/admin/activity')->assertForbidden();

    $viewer = $this->staffWith([Permission::PageActivity]);
    $this->actingAs($viewer)->getJson('/admin/api/activity')->assertOk()->assertJsonStructure(['items', 'total', 'page', 'pageSize']);
    $this->actingAs($viewer)->getJson('/admin/api/activity/filters')->assertOk()->assertJsonPath('groups.0', ['key' => 'bills', 'label' => 'Bills']);
});

it('filters by person, group and date', function () {
    $admin = $this->admin();
    $other = $this->staffWith([Permission::PageCatalog]);
    $this->actingAs($admin)->postJson('/admin/api/brands', ['name' => 'Lanwa'])->assertCreated();
    $this->actingAs($other)->postJson('/admin/api/brands', ['name' => 'Melwa'])->assertCreated();
    Activity::record($admin, ActivityAction::SettingsUpdated, null, 'Shop settings', 'Changed shop settings');
    ActivityLog::query()->where('summary', 'Changed shop settings')->update(['created_at' => now()->subDays(3)]);

    $viewer = $this->staffWith([Permission::PageActivity]);
    $get = fn (string $query) => collect($this->actingAs($viewer)->getJson("/admin/api/activity?$query")->assertOk()->json('items'))->pluck('summary')->all();

    expect($get("userId={$other->id}"))->toBe(['Added brand Melwa'])
        ->and($get('group=catalog'))->toBe(['Added brand Melwa', 'Added brand Lanwa'])
        ->and($get('to='.now()->subDays(2)->toDateString()))->toBe(['Changed shop settings'])
        ->and($get('search=lanwa'))->toBe(['Added brand Lanwa']);
});

it('prunes entries older than 90 days', function () {
    Activity::record($this->admin(), ActivityAction::SettingsUpdated, null, 'Shop settings', 'old');
    Activity::record($this->admin(), ActivityAction::SettingsUpdated, null, 'Shop settings', 'recent');
    ActivityLog::query()->where('summary', 'old')->update(['created_at' => now()->subDays(91)]);
    ActivityLog::query()->where('summary', 'recent')->update(['created_at' => now()->subDays(89)]);

    $this->artisan('activity:prune')->assertSuccessful();

    expect(ActivityLog::query()->pluck('summary')->all())->toBe(['recent']);
});
