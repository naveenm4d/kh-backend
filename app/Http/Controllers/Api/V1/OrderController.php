<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Orders\CancelOrder;
use App\Actions\Orders\CreateOrder;
use App\Actions\Orders\IssueOrder;
use App\Actions\Orders\UpdateOrderItems;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreateOrderRequest;
use App\Http\Requests\Api\UpdateOrderItemsRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\Paginated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'customerId' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'payment' => ['nullable', Rule::enum(PaymentMethod::class)],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $query = Order::query()
            ->with('items')
            ->search($data['search'] ?? null)
            ->when($data['customerId'] ?? null, fn ($q, $id) => $q->where('customer_id', $id))
            ->when($data['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($data['payment'] ?? null, fn ($q, $p) => $q->where('payment', $p))
            ->when($data['date'] ?? null, fn ($q, $d) => $q->whereDate('sold_on', $d))
            ->newestFirst();

        return Paginated::response($query->paginate($data['pageSize'] ?? 100, page: $data['page'] ?? 1), OrderResource::class);
    }

    public function show(Order $order): OrderResource
    {
        return OrderResource::make($order->load('items'));
    }

    public function store(CreateOrderRequest $request, CreateOrder $create): JsonResponse
    {
        $order = $create(
            $request->user(),
            $request->lines(),
            PaymentMethod::from($request->validated('payment')),
            $request->validated('customerId') === null ? null : (int) $request->validated('customerId'),
            $request->validated('cashReceived') === null ? null : (float) $request->validated('cashReceived'),
            $request->validated('clientRef'),
            $request->attributes->get('terminal'),
        );

        return OrderResource::make($order)->response()->setStatusCode($order->wasRecentlyCreated ? 201 : 200);
    }

    public function updateItems(UpdateOrderItemsRequest $request, Order $order, UpdateOrderItems $update): OrderResource
    {
        return OrderResource::make($update($request->user(), $order, $request->lines()));
    }

    public function issue(Request $request, Order $order, IssueOrder $issue): OrderResource
    {
        return OrderResource::make($issue($request->user(), $order));
    }

    public function cancel(Request $request, Order $order, CancelOrder $cancel): OrderResource
    {
        return OrderResource::make($cancel($request->user(), $order));
    }
}
