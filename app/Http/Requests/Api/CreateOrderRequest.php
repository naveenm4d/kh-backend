<?php

namespace App\Http\Requests\Api;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateOrderRequest extends FormRequest
{
    use OrderLinesRules;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            ...$this->lineRules(),
            'customerId' => ['nullable', 'integer', 'min:1'],
            'payment' => ['required', Rule::enum(PaymentMethod::class)],
            'cashReceived' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'clientRef' => ['nullable', 'uuid'],
        ];
    }
}
