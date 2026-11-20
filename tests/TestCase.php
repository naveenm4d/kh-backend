<?php

namespace Tests;

use App\Enums\Permission;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Role;
use App\Models\Terminal;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    /** Plain key of the till created by till(). */
    protected string $terminalKey = '';

    protected ?Terminal $terminal = null;

    /** Seeds roles, shop settings and the first admin; every domain test needs them. */
    protected bool $seed = true;

    protected string $seeder = DatabaseSeeder::class;

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    protected function admin(): User
    {
        return User::query()->where('code', 'admin')->firstOrFail();
    }

    protected function cashier(array $attributes = []): User
    {
        return User::factory()->withRole(Role::query()->where('slug', Role::CASHIER)->firstOrFail())->create($attributes);
    }

    /** @param  list<Permission>  $permissions */
    protected function staffWith(array $permissions): User
    {
        return User::factory()->withRole(Role::factory()->granting($permissions)->create())->create();
    }

    protected function till(string $name = 'Counter 1'): Terminal
    {
        [$this->terminal, $this->terminalKey] = Terminal::register($name);

        return $this->terminal;
    }

    /** Signs a staff member in on the till through the real login endpoint; returns the token. */
    protected function posLogin(User $user, string $password = 'password'): string
    {
        if ($this->terminal === null) {
            $this->till();
        }

        return $this->withHeader('X-Terminal-Key', $this->terminalKey)
            ->postJson('/api/v1/auth/login', ['userId' => (string) $user->id, 'password' => $password])
            ->assertOk()
            ->json('token');
    }

    /** A JSON request from the till, signed in as $user. */
    protected function pos(User $user): static
    {
        // Guards cache the resolved user between requests in one test; start fresh per user.
        app('auth')->forgetGuards();
        $token = $this->posLogin($user);
        app('auth')->forgetGuards();

        return $this->withHeaders(['X-Terminal-Key' => $this->terminalKey, 'Authorization' => 'Bearer '.$token]);
    }

    /** A product; `unit` may be given by name (Bag, kg, ...), from the units the migration creates. */
    protected function product(array $attributes = []): Product
    {
        $category = Category::query()->firstOrCreate(['name' => 'Cement'], ['group' => 'Cement']);
        $brand = Brand::query()->firstOrCreate(['name' => 'Tokyo']);
        $unit = Unit::query()->where('name', $attributes['unit'] ?? 'Bag')->firstOrFail();
        unset($attributes['unit']);

        return Product::query()->create([
            'name' => 'Tokyo Cement 50kg',
            'brand_id' => $brand->id,
            'category_id' => $category->id,
            'group' => $category->group,
            'unit_id' => $unit->id,
            'price' => 2750,
            'display_price' => 0,
            'stock' => 100,
            ...$attributes,
        ]);
    }

    protected function customer(array $attributes = []): Customer
    {
        return Customer::query()->create(['name' => 'Kasun Perera', 'phone' => '077 123-4567', ...$attributes]);
    }

    /** @param  array<string, mixed>  $overrides */
    protected function line(Product $product, int|float $qty = 1, array $overrides = []): array
    {
        return ['productId' => $product->id, 'qty' => $qty, 'unitPrice' => (float) $product->price, 'discountPct' => 0, 'source' => 'STORE', ...$overrides];
    }

    protected function assertMessage(TestResponse $response, string $contains): void
    {
        $this->assertStringContainsString($contains, (string) $response->json('message'));
    }
}
