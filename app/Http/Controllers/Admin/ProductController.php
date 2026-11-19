<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Products\DeleteProduct;
use App\Actions\Products\ReceiveStock;
use App\Actions\Products\SaveProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    public function store(ProductRequest $request, SaveProduct $save): JsonResponse
    {
        return $this->resource($save($request->user(), $request->productData()))->response()->setStatusCode(201);
    }

    public function update(ProductRequest $request, Product $product, SaveProduct $save): ProductResource
    {
        return $this->resource($save($request->user(), $request->productData(), $product));
    }

    public function destroy(Request $request, Product $product, DeleteProduct $delete): Response
    {
        $delete($request->user(), $product);

        return response()->noContent();
    }

    /** Adds a delivery to one product's stock. */
    public function receive(Request $request, Product $product, ReceiveStock $receive): ProductResource
    {
        $data = $request->validate([
            'qty' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);
        $receive($request->user(), [$product->id => (float) $data['qty']], (string) ($data['note'] ?? ''));

        return $this->resource($product);
    }

    private function resource(Product $product): ProductResource
    {
        return ProductResource::make(
            Product::query()->select('products.*')->withSales()->with(['brand:id,name', 'category:id,name', 'unit'])->findOrFail($product->id),
        );
    }
}
