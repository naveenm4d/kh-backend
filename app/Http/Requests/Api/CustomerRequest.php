<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:255'],
            'credit' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
        ];
    }

    /** @return array{name: string, phone: string|null, address: string|null, credit?: float|null} */
    public function customerData(): array
    {
        /** @var array{name: string, phone: string|null, address: string|null, credit?: float|null} */
        return $this->safe()->only(['name', 'phone', 'address', ...($this->has('credit') ? ['credit'] : [])]);
    }
}
