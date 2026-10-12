<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\ProductResource;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Delta sync for the tills' local catalogue. Without `since` it returns everything; with it, only
 * rows changed since then plus the ids removed. The returned cursor is the clock at the start of
 * the read minus an overlap, so rows committed while we were reading aren't skipped
 * (clients upsert by id, so seeing a row twice is harmless).
 */
class SyncController extends Controller
{
    private const OVERLAP_SECONDS = 5;

    /** Enough to say "something changed"; the till refetches its lists either way. */
    private const MAX_ORDER_CHANGES = 100;

    public function products(Request $request): JsonResponse
    {
        return $this->delta($request, Product::query()
            ->select('products.*')
            ->withTrashed()
            ->with(['brand:id,name', 'category:id,name', 'unit'])
            ->withSales(), ProductResource::class, 'products');
    }

    public function customers(Request $request): JsonResponse
    {
        return $this->delta($request, Customer::query()
            ->select('customers.*')
            ->withTrashed()
            ->withStats(), CustomerResource::class, 'customers');
    }

    /**
     * Bills aren't cached on the tills, so this only says which ones changed (sold, edited, issued or
     * cancelled, here or in the admin console) for the till to refetch what it shows. Without `since`
     * it just starts the cursor.
     */
    public function orders(Request $request): JsonResponse
    {
        $data = $request->validate(['since' => ['nullable', 'date']]);
        $since = isset($data['since']) ? CarbonImmutable::parse($data['since']) : null;
        $cursor = CarbonImmutable::now()->subSeconds(self::OVERLAP_SECONDS);

        $invoices = $since === null ? [] : Order::query()
            ->where('updated_at', '>=', $since)
            ->orderByDesc('updated_at')
            ->limit(self::MAX_ORDER_CHANGES)
            ->pluck('invoice')
            ->all();

        return response()->json(['invoices' => $invoices, 'cursor' => $cursor->toIso8601String()]);
    }

    /**
     * @param  Builder<Product>|Builder<Customer>  $query
     * @param  class-string<JsonResource>  $resource
     */
    private function delta(Request $request, Builder $query, string $resource, string $table): JsonResponse
    {
        $data = $request->validate(['since' => ['nullable', 'date']]);
        $since = isset($data['since']) ? CarbonImmutable::parse($data['since']) : null;

        // updated_at is stamped by the app clock, so the cursor uses it too.
        $cursor = CarbonImmutable::now()->subSeconds(self::OVERLAP_SECONDS);

        $rows = $query
            ->when($since, fn (Builder $q) => $q->where("$table.updated_at", '>=', $since))
            ->when($since === null, fn (Builder $q) => $q->whereNull("$table.deleted_at"))
            ->orderBy("$table.id")
            ->get();

        [$deleted, $live] = $rows->partition(fn ($row) => $row->deleted_at !== null);

        return response()->json([
            'items' => $resource::collection($live->values())->resolve($request),
            'deletedIds' => $deleted->map(fn ($row) => (string) $row->id)->values()->all(),
            'cursor' => $cursor->toIso8601String(),
            'full' => $since === null,
        ]);
    }
}
