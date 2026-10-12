<?php

namespace Database\Seeders;

use App\Actions\Customers\RecordPayment;
use App\Actions\Orders\CancelOrder;
use App\Actions\Orders\CreateOrder;
use App\Actions\Orders\IssueOrder;
use App\Enums\ItemSource;
use App\Enums\PaymentMethod;
use App\Enums\StockMovementReason;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Role;
use App\Models\ShopSetting;
use App\Models\Supplier;
use App\Models\Terminal;
use App\Models\Unit;
use App\Models\User;
use App\Support\Qty;
use App\Support\Stock;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Local demo data: the original mock catalogue plus ~4 months of sales rung up through the real
 * order actions, so stock, credit, the dashboard and reports all agree with each other.
 *
 *   php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    private const DAYS = 120;

    public function run(CreateOrder $createOrder, CancelOrder $cancelOrder, IssueOrder $issueOrder, RecordPayment $recordPayment): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('DemoSeeder is for local development only.');
        }
        if (Product::query()->exists()) {
            $this->command->warn('Demo data already present; run migrate:fresh --seed first.');

            return;
        }

        $this->call(DatabaseSeeder::class);
        ShopSetting::query()->firstOrFail()->update(['phone' => '047 2237711', 'reg_no' => 'BR/2014/0417']);

        /** @var array{categories: list<array<string, string>>, brands: list<string>, suppliers: list<array<string, string>>, customers: list<array<string, string>>, products: list<array<string, mixed>>} $data */
        $data = require __DIR__.'/data/catalog.php';
        mt_srand(20261009);

        $categories = collect($data['categories'])->mapWithKeys(fn ($c) => [$c['name'] => Category::create($c)]);
        $brands = collect($data['brands'])->mapWithKeys(fn ($name) => [$name => Brand::create(['name' => $name])]);
        foreach ($data['suppliers'] as $supplier) {
            Supplier::create($supplier);
        }
        $customers = collect($data['customers'])->map(fn ($c) => Customer::create($c))->values();

        $cashierRole = Role::query()->where('slug', Role::CASHIER)->firstOrFail();
        $admin = User::query()->where('code', 'admin')->firstOrFail();
        $cashiers = collect([
            ['name' => 'Kasun Fernando', 'code' => 'kasun', 'email' => 'kasun@kulatissahardware.lk', 'phone' => '0771234567'],
            ['name' => 'Nuwan Silva', 'code' => 'nuwan', 'email' => 'nuwan@kulatissahardware.lk', 'phone' => '0719988001'],
        ])->map(fn ($u) => User::create([...$u, 'role_id' => $cashierRole->id, 'password' => 'password123']))->values();

        // The units list comes from the migration.
        $units = Unit::query()->get()->keyBy('name');
        $products = collect($data['products'])->map(function (array $p) use ($categories, $brands, $units) {
            $unit = $units[$p['unit']];
            $category = $categories[$p['category']];

            return [
                'model' => Product::create([
                    'name' => $p['name'],
                    'brand_id' => $brands[$p['brand']]->id,
                    'category_id' => $category->id,
                    'group' => $category->group,
                    'unit_id' => $unit->id,
                    'price' => $p['price'],
                    'display_price' => $p['display_price'],
                    'stock' => 0,
                ]),
                'target' => $p['stock'],
                'measured' => $unit->decimals > 0,
                'popularity' => max(1, (int) $p['popularity']),
                'bulk' => in_array($category->group, ['Cement', 'Steel'], true) || $p['price'] < 100,
            ];
        })->values();

        $plan = $this->planSales($products->all(), $customers->count());

        // Opening stock covers the planned sales and leaves each product at its catalogue count.
        $sold = [];
        foreach ($plan as $sale) {
            foreach ($sale['lines'] as [$index, $qty]) {
                $sold[$index] = ($sold[$index] ?? 0) + Qty::toMilli($qty);
            }
        }
        $start = CarbonImmutable::now()->subDays(self::DAYS)->setTime(8, 0);
        Date::setTestNow($start);
        foreach ($products as $index => $p) {
            DB::transaction(fn () => Stock::move($p['model'], Qty::toMilli($p['target']) + ($sold[$index] ?? 0), StockMovementReason::Opening, $admin));
        }

        foreach ($plan as $n => $sale) {
            Date::setTestNow($sale['at']);
            $cashier = $cashiers[$n % 2];
            $customer = $sale['customer'] === null ? null : $customers[$sale['customer']];

            $lines = array_map(function (array $line) use ($products) {
                $product = $products[$line[0]]['model'];
                $display = (float) $product->display_price;
                $price = (float) $product->price;
                $marked = $display > $price;

                return [
                    'productId' => $product->id,
                    'qty' => $line[1],
                    'unitPrice' => $marked ? $display : $price,
                    'discountPct' => $marked ? round((1 - $price / $display) * 100, 4) : 0.0,
                    'source' => $line[2],
                ];
            }, $sale['lines']);

            $order = $createOrder($cashier, $lines, $sale['payment'], $customer?->id);

            if ($sale['payment'] === PaymentMethod::Credit && mt_rand(1, 100) <= 60) {
                $issueOrder($cashier, $order);
            }
            if (mt_rand(1, 100) <= 2) {
                $cancelOrder($admin, $order);
            } elseif ($customer !== null && $sale['payment'] === PaymentMethod::Credit && mt_rand(1, 100) <= 45) {
                Date::setTestNow($sale['at']->addDays(mt_rand(3, 20))->min(CarbonImmutable::now()));
                $owed = (float) $customer->refresh()->credit;
                if ($owed > 0) {
                    $recordPayment($admin, $customer, round($owed * mt_rand(30, 100) / 100), PaymentMethod::Cash, 'Part payment');
                }
            }
        }
        Date::setTestNow();

        [, $key] = Terminal::register('Counter 1');
        $this->command->info('Demo till registered. Terminal key (shown once):');
        $this->command->line("  $key");
        $this->command->info('Sign in: admin@kulatissahardware.lk / password123 (web) · Kasun or Nuwan / password123 (till)');
    }

    /**
     * Deterministic sales history: 2–7 bills a day (fewer on Sundays), popular items more often.
     *
     * @param  array<int, array{model: Product, target: int|float, measured: bool, popularity: int, bulk: bool}>  $products
     * @return list<array{at: CarbonImmutable, customer: int|null, payment: PaymentMethod, lines: list<array{0: int, 1: int|float, 2: ItemSource}>}>
     */
    private function planSales(array $products, int $customerCount): array
    {
        $weights = array_column($products, 'popularity');
        $totalWeight = array_sum($weights);
        $pick = function () use ($weights, $totalWeight): int {
            $r = mt_rand(1, $totalWeight);
            foreach ($weights as $i => $w) {
                if (($r -= $w) <= 0) {
                    return $i;
                }
            }

            return 0;
        };

        $plan = [];
        $today = CarbonImmutable::now()->startOfDay();
        for ($d = self::DAYS; $d >= 0; $d--) {
            $day = $today->subDays($d);
            $bills = $day->isSunday() ? mt_rand(0, 2) : mt_rand(2, 7);
            for ($b = 0; $b < $bills; $b++) {
                $at = $day->setTime(8 + mt_rand(0, 9), mt_rand(0, 59));
                if ($at->isFuture()) {
                    continue;
                }
                $roll = mt_rand(1, 100);
                $payment = match (true) {
                    $roll <= 55 => PaymentMethod::Cash,
                    $roll <= 70 => PaymentMethod::Card,
                    $roll <= 78 => PaymentMethod::BankTransfer,
                    $roll <= 83 => PaymentMethod::Cheque,
                    default => PaymentMethod::Credit,
                };
                $customer = $payment === PaymentMethod::Credit || mt_rand(1, 100) <= 55 ? mt_rand(0, $customerCount - 1) : null;

                $lines = [];
                $used = [];
                for ($l = mt_rand(1, 4); $l > 0; $l--) {
                    $i = $pick();
                    if (isset($used[$i])) {
                        continue;
                    }
                    $used[$i] = true;
                    $bulk = $products[$i]['bulk'];
                    $qty = match (true) {
                        $products[$i]['measured'] => mt_rand(5, 150) / 10, // 0.5 to 15 m / ft / kg
                        $bulk => mt_rand(2, 20),
                        default => mt_rand(1, 4),
                    };
                    $lines[] = [$i, $qty, $bulk ? ItemSource::Warehouse : ItemSource::Store];
                }
                $plan[] = ['at' => $at, 'customer' => $customer, 'payment' => $payment, 'lines' => $lines];
            }
        }
        usort($plan, fn ($a, $b) => $a['at'] <=> $b['at']);

        return $plan;
    }
}
