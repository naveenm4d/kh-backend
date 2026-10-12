<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Catalog\DeleteCatalogRecord;
use App\Actions\Catalog\SaveBrand;
use App\Actions\Catalog\SaveCategory;
use App\Actions\Catalog\SaveUnit;
use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\SupplierResource;
use App\Http\Resources\UnitResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\Unit;
use App\Support\Abilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/** Brands, categories, suppliers and units. */
class CatalogController extends Controller
{
    public function brands(): AnonymousResourceCollection
    {
        return BrandResource::collection(Brand::query()->orderBy('name')->get());
    }

    public function storeBrand(Request $request, SaveBrand $save): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120', $this->uniqueName('brands')]]);

        return BrandResource::make($save($request->user(), $data['name']))->response()->setStatusCode(201);
    }

    public function updateBrand(Request $request, Brand $brand, SaveBrand $save): BrandResource
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120', $this->uniqueName('brands', $brand->id)]]);

        return BrandResource::make($save($request->user(), $data['name'], $brand));
    }

    public function storeCategory(Request $request, SaveCategory $save): JsonResponse
    {
        return CategoryResource::make($save($request->user(), $this->categoryData($request)))->response()->setStatusCode(201);
    }

    public function updateCategory(Request $request, Category $category, SaveCategory $save): CategoryResource
    {
        return CategoryResource::make($save($request->user(), $this->categoryData($request, $category->id), $category));
    }

    public function units(): AnonymousResourceCollection
    {
        return UnitResource::collection(Unit::query()->withCount(['products' => fn ($q) => $q->withTrashed()])->orderBy('measured')->orderBy('name')->get());
    }

    public function storeUnit(Request $request, SaveUnit $save): JsonResponse
    {
        return UnitResource::make($save($request->user(), $this->unitData($request)))->response()->setStatusCode(201);
    }

    public function updateUnit(Request $request, Unit $unit, SaveUnit $save): UnitResource
    {
        return UnitResource::make($save($request->user(), $this->unitData($request, $unit->id), $unit)->loadCount(['products' => fn ($q) => $q->withTrashed()]));
    }

    public function destroyUnit(Request $request, Unit $unit, DeleteCatalogRecord $delete): Response
    {
        $delete($request->user(), $unit);

        return response()->noContent();
    }

    public function suppliers(): AnonymousResourceCollection
    {
        return SupplierResource::collection(Supplier::query()->orderBy('name')->get());
    }

    public function storeSupplier(Request $request): JsonResponse
    {
        Abilities::ensure($request->user(), Permission::PageCatalog);

        return SupplierResource::make(Supplier::create($this->supplierData($request)))->response()->setStatusCode(201);
    }

    public function updateSupplier(Request $request, Supplier $supplier): SupplierResource
    {
        Abilities::ensure($request->user(), Permission::PageCatalog);
        $supplier->update($this->supplierData($request));

        return SupplierResource::make($supplier);
    }

    public function destroyBrand(Request $request, Brand $brand, DeleteCatalogRecord $delete): Response
    {
        $delete($request->user(), $brand);

        return response()->noContent();
    }

    public function destroyCategory(Request $request, Category $category, DeleteCatalogRecord $delete): Response
    {
        $delete($request->user(), $category);

        return response()->noContent();
    }

    public function destroySupplier(Request $request, Supplier $supplier, DeleteCatalogRecord $delete): Response
    {
        $delete($request->user(), $supplier);

        return response()->noContent();
    }

    /** @return array{name: string, parent: string|null, group: string|null} */
    private function categoryData(Request $request, ?int $ignore = null): array
    {
        /** @var array{name: string, parent: string|null, group: string|null} */
        return $request->validate([
            'name' => ['required', 'string', 'max:120', $this->uniqueName('categories', $ignore)],
            'parent' => ['nullable', 'string', 'max:120'],
            'group' => ['nullable', 'string', 'max:64'],
        ]);
    }

    /** @return array{name: string, measured: bool, decimals: int} */
    private function unitData(Request $request, ?int $ignore = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:24', $this->uniqueName('units', $ignore)],
            'measured' => ['required', 'boolean'],
            'decimals' => ['nullable', 'integer', 'min:0', 'max:3'],
        ]);

        return ['name' => trim($data['name']), 'measured' => (bool) $data['measured'], 'decimals' => (int) ($data['decimals'] ?? 0)];
    }

    /** @return array{name: string, supplies: string, phone: string} */
    private function supplierData(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'supplies' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
        ]);

        return ['name' => trim($data['name']), 'supplies' => trim((string) ($data['supplies'] ?? '')), 'phone' => trim((string) ($data['phone'] ?? ''))];
    }

    private function uniqueName(string $table, ?int $ignore = null): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($table, $ignore) {
            $exists = DB::table($table)
                ->whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $value))])
                ->when($ignore, fn ($q) => $q->where('id', '!=', $ignore))
                ->exists();
            if ($exists) {
                $fail("There's already one called \"".trim((string) $value).'".');
            }
        };
    }
}
