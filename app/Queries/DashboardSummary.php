<?php

namespace App\Queries;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShopSetting;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The admin dashboard. Every figure is computed from bills in the window its label names;
 * cancelled bills never count towards sales.
 */
final class DashboardSummary
{
    /** @return array<string, mixed> */
    public function __invoke(?CarbonImmutable $today = null): array
    {
        $today = ($today ?? CarbonImmutable::now())->startOfDay();
        $monthStart = $today->startOfMonth();
        $prevMonthStart = $monthStart->subMonthNoOverflow();
        $prevMonthCutoff = $prevMonthStart->setDay(min($today->day, $prevMonthStart->daysInMonth));
        $trendStart = $today->subDays(13);
        $thirtyDaysAgo = $today->subDays(29);

        $active = fn () => Order::query()->active();
        $sumCount = fn ($q) => $q->toBase()->selectRaw('coalesce(sum(amount), 0) as total, count(*) as bills')->first();

        $todayAgg = $sumCount($active()->whereDate('sold_on', $today));
        $yesterdayAgg = $sumCount($active()->whereDate('sold_on', $today->subDay()));
        $monthAgg = $sumCount($active()->whereBetween('sold_on', [$monthStart->toDateString(), $today->toDateString()]));
        $prevMonthAgg = $sumCount($active()->whereBetween('sold_on', [$prevMonthStart->toDateString(), $prevMonthCutoff->toDateString()]));

        $trendRows = $active()
            ->where('sold_on', '>=', $trendStart->toDateString())
            ->where('sold_on', '<=', $today->toDateString())
            ->groupBy('sold_on')
            ->selectRaw('sold_on, sum(amount) as total')
            ->pluck('total', 'sold_on');
        $dailyTrend = [];
        for ($d = $trendStart; $d->lte($today); $d = $d->addDay()) {
            $key = $d->toDateString();
            $dailyTrend[] = ['date' => $key, 'label' => $d->format('d M'), 'total' => (float) ($trendRows[$key] ?? 0)];
        }

        // Category and product revenue this month, from what was actually sold.
        $monthLines = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.status', '!=', OrderStatus::Cancelled->value)
            ->whereBetween('orders.sold_on', [$monthStart->toDateString(), $today->toDateString()]);

        $categoryBreakdown = (clone $monthLines)
            ->groupByRaw("coalesce(products.\"group\", 'Other')")
            ->selectRaw("coalesce(products.\"group\", 'Other') as grp, sum(order_items.total) as value")
            ->orderByDesc('value')
            ->get()
            ->map(fn ($r) => ['group' => $r->grp, 'value' => (float) $r->value])
            ->all();

        $topProducts = (clone $monthLines)
            ->groupBy('order_items.product_id', 'order_items.name', 'products.price')
            ->selectRaw('order_items.name, sum(order_items.qty) as units, coalesce(products.price, 0) as price, sum(order_items.total) as revenue')
            ->orderByDesc('revenue')
            ->limit(7)
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'units' => (float) $r->units, 'price' => (float) $r->price, 'revenue' => (float) $r->revenue])
            ->all();

        $credit = Customer::query()->toBase()->selectRaw('coalesce(sum(credit), 0) as total, count(*) filter (where credit > 0) as owing')->first();
        $topDebtors = Customer::query()
            ->where('credit', '>', 0)
            ->orderByDesc('credit')
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'name', 'phone', 'credit'])
            ->map(fn (Customer $c) => ['id' => (string) $c->id, 'name' => $c->name, 'phone' => $c->phone, 'credit' => (float) $c->credit])
            ->all();

        $lowStock = ShopSetting::current()->low_stock;
        $lowStockQuery = Product::query()->where('stock', '<=', $lowStock);
        $lowStockItems = (clone $lowStockQuery)
            ->orderBy('stock')
            ->orderBy('name')
            ->limit(6)
            ->with('unit')
            ->get(['id', 'name', 'group', 'unit_id', 'stock'])
            ->map(fn (Product $p) => ['id' => (string) $p->id, 'name' => $p->name, 'group' => $p->group, 'unit' => $p->unit->name, 'measured' => $p->unit->measured, 'stock' => (float) $p->stock])
            ->all();

        $recentOrders = Order::query()
            ->newestFirst()
            ->limit(7)
            ->get(['invoice', 'sold_on', 'customer_name', 'payment', 'status', 'amount'])
            ->map(fn (Order $o) => [
                'invoice' => $o->invoice,
                'date' => $o->sold_on->toDateString(),
                'customer' => $o->customer_name,
                'payment' => $o->payment->value,
                'status' => $o->status->value,
                'amount' => (float) $o->amount,
            ])
            ->all();

        return [
            'todaySales' => (float) $todayAgg->total,
            'todayOrders' => (int) $todayAgg->bills,
            'monthSales' => (float) $monthAgg->total,
            'monthOrders' => (int) $monthAgg->bills,
            'outstandingCredit' => (float) $credit->total,
            'customersWithBalance' => (int) $credit->owing,
            'lowStockCount' => $lowStockQuery->count(),
            'totalOrders30d' => $active()->where('sold_on', '>=', $thirtyDaysAgo->toDateString())->count(),
            'dailyTrend' => $dailyTrend,
            'categoryBreakdown' => $categoryBreakdown,
            'topProducts' => $topProducts,
            'yesterdaySales' => (float) $yesterdayAgg->total,
            'yesterdayOrders' => (int) $yesterdayAgg->bills,
            'prevMonthSalesToDate' => (float) $prevMonthAgg->total,
            'lowStockItems' => $lowStockItems,
            'topDebtors' => $topDebtors,
            'recentOrders' => $recentOrders,
        ];
    }
}
