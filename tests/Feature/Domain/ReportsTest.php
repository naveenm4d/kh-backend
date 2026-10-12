<?php

use App\Actions\Orders\CancelOrder;
use App\Actions\Orders\CreateOrder;
use App\Enums\ItemSource;
use App\Enums\PaymentMethod;
use App\Queries\DashboardSummary;
use App\Queries\ReportSummary;
use Carbon\CarbonImmutable;

function sell(object $test, $cashier, $product, int $qty, PaymentMethod $payment, ?int $customerId = null)
{
    return app(CreateOrder::class)($cashier, [[
        'productId' => $product->id, 'qty' => $qty, 'unitPrice' => (float) $product->price, 'discountPct' => 0.0, 'source' => ItemSource::Store,
    ]], $payment, $customerId);
}

it('summarises a period, leaving cancelled bills out of sales', function () {
    $cashier = $this->cashier(['name' => 'Kasun']);
    $cement = $this->product(['price' => 1000]);
    $tile = $this->product(['name' => 'Tile', 'price' => 500, 'group' => 'Tiles']);
    $customer = $this->customer();

    $this->travelTo(CarbonImmutable::parse('2026-09-01 10:00'));
    sell($this, $cashier, $cement, 2, PaymentMethod::Cash);
    $this->travelTo(CarbonImmutable::parse('2026-09-03 10:00'));
    sell($this, $cashier, $tile, 4, PaymentMethod::Credit, $customer->id);
    $cancelled = sell($this, $cashier, $cement, 1, PaymentMethod::Cash);
    app(CancelOrder::class)($this->admin(), $cancelled);

    $report = (new ReportSummary)(CarbonImmutable::parse('2026-09-01'), CarbonImmutable::parse('2026-09-03'), 'day');

    expect($report['totals'])->toBe(['revenue' => 4000.0, 'bills' => 2, 'avgBill' => 2000.0, 'creditSales' => 2000.0, 'cancelledBills' => 1])
        ->and(array_column($report['series'], 'revenue'))->toBe([2000.0, 0.0, 2000.0])
        ->and(array_column($report['byPayment'], 'key'))->toBe(['CASH', 'CREDIT'])
        ->and($report['byCashier'][0])->toBe(['key' => 'Kasun', 'revenue' => 4000.0, 'bills' => 2])
        ->and(array_column($report['byCategory'], 'key'))->toEqualCanonicalizing(['Cement', 'Tiles']);
});

it('buckets by month', function () {
    $cashier = $this->cashier();
    $cement = $this->product(['price' => 1000]);
    $this->travelTo(CarbonImmutable::parse('2026-08-15 10:00'));
    sell($this, $cashier, $cement, 1, PaymentMethod::Cash);

    $report = (new ReportSummary)(CarbonImmutable::parse('2026-07-20'), CarbonImmutable::parse('2026-09-02'), 'month');

    expect(array_column($report['series'], 'key'))->toBe(['2026-07', '2026-08', '2026-09'])
        ->and($report['series'][1]['revenue'])->toBe(1000.0);
});

it('builds the dashboard from bills in each window', function () {
    $cashier = $this->cashier();
    $cement = $this->product(['price' => 1000, 'stock' => 25]);
    $customer = $this->customer();

    $this->travelTo(CarbonImmutable::parse('2026-09-30 10:00'));
    sell($this, $cashier, $cement, 1, PaymentMethod::Cash);
    $this->travelTo(CarbonImmutable::parse('2026-10-08 10:00'));
    sell($this, $cashier, $cement, 2, PaymentMethod::Cash);
    $this->travelTo(CarbonImmutable::parse('2026-10-09 10:00'));
    sell($this, $cashier, $cement, 3, PaymentMethod::Credit, $customer->id);

    $summary = (new DashboardSummary)(CarbonImmutable::parse('2026-10-09'));

    expect($summary)
        ->todaySales->toBe(3000.0)
        ->todayOrders->toBe(1)
        ->yesterdaySales->toBe(2000.0)
        ->monthSales->toBe(5000.0)
        ->prevMonthSalesToDate->toBe(0.0)
        ->outstandingCredit->toBe(3000.0)
        ->customersWithBalance->toBe(1)
        ->totalOrders30d->toBe(3)
        ->lowStockCount->toBe(1)
        ->and($summary['dailyTrend'])->toHaveCount(14)
        ->and(end($summary['dailyTrend']))->toBe(['date' => '2026-10-09', 'label' => '09 Oct', 'total' => 3000.0])
        ->and($summary['topProducts'][0])->toMatchArray(['units' => 5, 'revenue' => 5000.0])
        ->and($summary['recentOrders'])->toHaveCount(3);
});
