<?php

use App\Enums\Permission;
use App\Models\Role;
use App\Models\User;

it('keeps cashier-only accounts out of the web console', function () {
    $cashier = $this->cashier();

    $this->post('/login', ['email' => $cashier->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('refuses deactivated staff at the web console', function () {
    $admin = User::factory()->admin()->inactive()->create();

    $this->post('/login', ['email' => $admin->email, 'password' => 'password'])->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('sends guests to the sign-in page', function () {
    $this->get('/admin/dashboard')->assertRedirect('/login');
    $this->getJson('/admin/api/dashboard')->assertUnauthorized();
});

it('opens only the pages a role allows', function () {
    $reports = $this->staffWith([Permission::PageReports]);

    $this->actingAs($reports)->get('/admin')->assertRedirect('/admin/reports');
    $this->actingAs($reports)->get('/admin/reports')->assertOk();
    $this->actingAs($reports)->get('/admin/dashboard')->assertForbidden();
    $this->actingAs($reports)->getJson('/admin/api/dashboard')->assertForbidden();
    $this->actingAs($reports)->getJson('/admin/api/staff')->assertForbidden();
});

it('keeps customer balances and bills from roles that do not work with sales', function () {
    $catalog = $this->staffWith([Permission::PageCatalog]);
    $sales = $this->staffWith([Permission::PageOrders]);

    $this->actingAs($catalog)->getJson('/admin/api/customers')->assertForbidden();
    $this->actingAs($catalog)->getJson('/admin/api/orders')->assertForbidden();
    $this->actingAs($catalog)->getJson('/admin/api/products')->assertOk();
    $this->actingAs($sales)->getJson('/admin/api/customers')->assertOk();
    $this->actingAs($sales)->getJson('/admin/api/orders')->assertOk();
});

it('renders every admin page for an admin', function (string $page) {
    $this->actingAs($this->admin())->get("/admin/$page")
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia->component("admin/$page")->where('auth.user.code', 'admin'));
})->with(['dashboard', 'reports', 'orders', 'customers', 'inventory', 'catalog', 'users', 'settings']);

it('never shares secrets with the browser', function () {
    $this->actingAs($this->admin())->get('/admin/dashboard')
        ->assertInertia(fn ($inertia) => $inertia->missing('auth.user.password')->missing('auth.user.two_factor_secret'));
});

it('runs console data routes in the session + CSRF protected web group', function () {
    // (Laravel skips the CSRF check itself while running tests, so assert the route's stack.)
    $route = app('router')->getRoutes()->match(request()->create('/admin/api/brands', 'POST'));

    expect($route->gatherMiddleware())->toContain('web', 'auth', 'admin');
});

it('serves the console data endpoints', function () {
    $admin = $this->admin();
    $product = $this->product();

    $this->actingAs($admin)->getJson('/admin/api/dashboard')->assertOk()->assertJsonStructure(['todaySales', 'dailyTrend', 'lowStockItems']);
    $this->actingAs($admin)->getJson('/admin/api/reports/summary?from=2026-01-01&to=2026-01-31')->assertOk()->assertJsonCount(31, 'series');
    $this->actingAs($admin)->getJson('/admin/api/products?pageSize=10')->assertOk()->assertJsonPath('total', 1);
    $this->actingAs($admin)->postJson("/admin/api/products/{$product->id}/receive", ['qty' => 5])->assertOk()->assertJsonPath('stock', 105);
    $this->actingAs($admin)->postJson('/admin/api/brands', ['name' => 'Bosch'])->assertCreated();
    $this->actingAs($admin)->postJson('/admin/api/brands', ['name' => 'bosch'])->assertUnprocessable();
    $this->actingAs($admin)->postJson('/admin/api/products', ['name' => 'Drill', 'brand' => 'Bosch', 'category' => 'Cement', 'price' => 100, 'stock' => 3])
        ->assertCreated()
        ->assertJsonPath('brand', 'Bosch')
        ->assertJsonPath('group', 'Cement');
    $this->actingAs($admin)->postJson('/admin/api/products', ['name' => 'Drill', 'brand' => 'Nope', 'price' => 100])->assertUnprocessable();
});

it('registers a till and shows its key only once', function () {
    $admin = $this->admin();

    $created = $this->actingAs($admin)->postJson('/admin/api/terminals', ['name' => 'Counter 2'])->assertCreated();
    expect($created->json('key'))->toStartWith('khterm_');

    $listed = $this->actingAs($admin)->getJson('/admin/api/terminals')->assertOk();
    expect(json_encode($listed->json()))->not->toContain($created->json('key'));

    $this->actingAs($admin)->deleteJson('/admin/api/terminals/'.$created->json('id'))->assertNoContent();
    $this->actingAs($admin)->getJson('/admin/api/terminals')->assertJsonMissing(['id' => (string) $created->json('id')]);
    $this->withHeader('X-Terminal-Key', $created->json('key'))->getJson('/api/v1/ping')->assertForbidden();
});

it('manages staff through the console with server-side validation', function () {
    $admin = $this->admin();
    $cashierRole = Role::query()->where('slug', 'cashier')->value('id');

    $this->actingAs($admin)->postJson('/admin/api/staff', ['name' => 'Kasun', 'code' => 'Kasun F', 'email' => 'k@example.com', 'role' => $cashierRole, 'password' => 'secret-pass'])
        ->assertUnprocessable()->assertJsonValidationErrors('code');
    $id = $this->actingAs($admin)->postJson('/admin/api/staff', ['name' => 'Kasun', 'code' => 'kasun-f', 'email' => 'K@Example.com', 'role' => $cashierRole, 'password' => 'secret-pass'])
        ->assertCreated()->assertJsonPath('email', 'k@example.com')->json('id');
    $this->actingAs($admin)->postJson("/admin/api/staff/$id/password", ['password' => 'short'])->assertUnprocessable();
    $this->actingAs($admin)->postJson("/admin/api/staff/$id/password", ['password' => 'another-pass'])->assertNoContent();
});

it('refuses a second terminal with the same name', function () {
    $admin = $this->admin();

    $this->actingAs($admin)->postJson('/admin/api/terminals', ['name' => 'Counter 3'])->assertCreated();
    $this->actingAs($admin)->postJson('/admin/api/terminals', ['name' => ' counter 3 '])
        ->assertUnprocessable()->assertJsonValidationErrors('name');
});
