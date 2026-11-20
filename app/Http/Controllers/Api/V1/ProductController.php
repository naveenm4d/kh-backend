<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\Paginated;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'group' => ['nullable', 'string', 'max:64'],
            'sort' => ['nullable', 'in:popular,name'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $query = Product::query()
            ->select('products.*')
            ->with(['brand:id,name', 'category:id,name', 'unit'])
            ->withSales()
            ->when(($data['group'] ?? '') !== '' && $data['group'] !== 'All', fn (Builder $q) => $q->where('group', $data['group']))
            ->when(trim($data['search'] ?? '') !== '', function (Builder $q) use ($data) {
                $term = mb_strtolower(trim($data['search']));
                $like = '%'.addcslashes($term, '%_\\').'%';
                $q->where(fn (Builder $w) => $w
                    ->whereRaw('lower(products.name) like ?', [$like])
                    ->orWhereHas('brand', fn (Builder $b) => $b->whereRaw('lower(name) like ?', [$like]))
                    ->orWhere('products.id', ctype_digit($term) ? (int) $term : 0));
            });

        if (($data['sort'] ?? '') === 'popular') {
            $query->orderByDesc('units_sold_week')->orderByDesc('units_sold_month');
        }
        $query->orderBy('products.name')->orderBy('products.id');

        return Paginated::response($query->paginate($data['pageSize'] ?? 100, page: $data['page'] ?? 1), ProductResource::class);
    }

    public function show(Product $product): ProductResource
    {
        $product = Product::query()->select('products.*')->withSales()->with(['brand:id,name', 'category:id,name', 'unit'])->findOrFail($product->id);

        return ProductResource::make($product);
    }
}
