<?php

namespace App\Queries;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Order;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Sales between two dates (inclusive), bucketed by day or month. Cancelled bills only count
 * towards cancelledBills. Category revenue sums line totals by the product's current group, and a
 * bill counts once per group it touches.
 */
final class ReportSummary
{
    /** @return array<string, mixed> */
    public function __invoke(CarbonImmutable $from, CarbonImmutable $to, string $granularity): array
    {
        $granularity = $granularity === 'month' ? 'month' : 'day';
        $fromIso = $from->toDateString();
        $toIso = $to->toDateString();

        $inRange = fn () => Order::query()->whereBetween('sold_on', [$fromIso, $toIso]);
        $active = fn () => $inRange()->active();

        $totals = $active()->toBase()->selectRaw(
            'coalesce(sum(amount), 0) as revenue, count(*) as bills, coalesce(sum(amount) filter (where payment = ?), 0) as credit',
            [PaymentMethod::Credit->value],
        )->first();
        $cancelled = $inRange()->where('status', OrderStatus::Cancelled->value)->count();
        $revenue = (float) $totals->revenue;
        $bills = (int) $totals->bills;

        $byBucket = $active()
            ->toBase()
            ->when(
                $granularity === 'month',
                fn ($q) => $q->groupByRaw("to_char(sold_on, 'YYYY-MM')")->selectRaw("to_char(sold_on, 'YYYY-MM') as key, sum(amount) as revenue, count(*) as bills"),
                fn ($q) => $q->groupByRaw("to_char(sold_on, 'YYYY-MM-DD')")->selectRaw("to_char(sold_on, 'YYYY-MM-DD') as key, sum(amount) as revenue, count(*) as bills"),
            )
            ->get()
            ->keyBy('key');

        $series = [];
        if ($granularity === 'month') {
            for ($m = $from->startOfMonth(); $m->lte($to); $m = $m->addMonthNoOverflow()) {
                $series[] = $this->point($m->format('Y-m'), $byBucket);
            }
        } else {
            for ($d = $from; $d->lte($to); $d = $d->addDay()) {
                $series[] = $this->point($d->toDateString(), $byBucket);
            }
        }

        $breakdown = fn (string $column) => $active()
            ->toBase()
            ->groupBy($column)
            ->select([$column.' as key'])
            ->selectRaw('sum(amount) as revenue, count(*) as bills')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => ['key' => (string) $r->key, 'revenue' => (float) $r->revenue, 'bills' => (int) $r->bills])
            ->all();

        $byCategory = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.status', '!=', OrderStatus::Cancelled->value)
            ->whereBetween('orders.sold_on', [$fromIso, $toIso])
            ->groupByRaw("coalesce(products.\"group\", 'Other')")
            ->selectRaw("coalesce(products.\"group\", 'Other') as key, sum(order_items.total) as revenue, count(distinct orders.id) as bills")
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => ['key' => $r->key, 'revenue' => (float) $r->revenue, 'bills' => (int) $r->bills])
            ->all();

        return [
            'from' => $fromIso,
            'to' => $toIso,
            'granularity' => $granularity,
            'totals' => [
                'revenue' => $revenue,
                'bills' => $bills,
                'avgBill' => $bills > 0 ? $revenue / $bills : 0,
                'creditSales' => (float) $totals->credit,
                'cancelledBills' => $cancelled,
            ],
            'series' => $series,
            'byPayment' => $breakdown('payment'),
            'byCategory' => $byCategory,
            'byCashier' => $breakdown('cashier_name'),
        ];
    }

    /**
     * @param  Collection<string, mixed>  $byBucket
     * @return array{key: string, revenue: float, bills: int}
     */
    private function point(string $key, $byBucket): array
    {
        $row = $byBucket->get($key);

        return ['key' => $key, 'revenue' => (float) ($row->revenue ?? 0), 'bills' => (int) ($row->bills ?? 0)];
    }
}
