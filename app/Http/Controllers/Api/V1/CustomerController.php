<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Customers\DeleteCustomer;
use App\Actions\Customers\RecordPayment;
use App\Actions\Customers\SaveCustomer;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CustomerRequest;
use App\Http\Requests\Api\RecordPaymentRequest;
use App\Http\Resources\CustomerDetailResource;
use App\Http\Resources\CustomerPaymentResource;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Support\Paginated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'owing' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);
        $owing = (bool) ($data['owing'] ?? false);

        $query = Customer::query()
            ->select('customers.*')
            ->withStats()
            ->search($data['search'] ?? null)
            ->when($owing, fn ($q) => $q->where('credit', '>', 0)->orderByDesc('credit'))
            ->orderBy('name')
            ->orderBy('id');

        return Paginated::response($query->paginate($data['pageSize'] ?? 100, page: $data['page'] ?? 1), CustomerResource::class);
    }

    public function show(Customer $customer): CustomerDetailResource
    {
        return CustomerDetailResource::make($this->withStats($customer));
    }

    public function store(CustomerRequest $request, SaveCustomer $save): JsonResponse
    {
        $customer = $save($request->user(), $request->customerData());

        return CustomerResource::make($this->withStats($customer))->response()->setStatusCode(201);
    }

    public function update(CustomerRequest $request, Customer $customer, SaveCustomer $save): CustomerResource
    {
        $customer = $save($request->user(), $request->customerData(), $customer);

        return CustomerResource::make($this->withStats($customer));
    }

    public function recordPayment(RecordPaymentRequest $request, Customer $customer, RecordPayment $record): JsonResponse
    {
        $payment = $record(
            $request->user(),
            $customer,
            (float) $request->validated('amount'),
            PaymentMethod::from($request->validated('method')),
            (string) $request->validated('note', ''),
        );

        return CustomerPaymentResource::make($payment)->response()->setStatusCode(201);
    }

    public function destroy(Request $request, Customer $customer, DeleteCustomer $delete): Response
    {
        $delete($request->user(), $customer);

        return response()->noContent();
    }

    private function withStats(Customer $customer): Customer
    {
        return Customer::query()->select('customers.*')->withStats()->findOrFail($customer->id);
    }
}
