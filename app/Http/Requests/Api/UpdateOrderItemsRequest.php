<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderItemsRequest extends FormRequest
{
    use OrderLinesRules;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return $this->lineRules();
    }
}
