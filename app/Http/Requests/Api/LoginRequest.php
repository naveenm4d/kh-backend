<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'userId' => ['nullable', 'string', 'max:20'],
            'email' => ['required_without:userId', 'nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required_without' => 'Enter your email address.',
            'password.required' => 'Enter your password.',
        ];
    }

    /** Throttle key: the account being tried, on this till. */
    public function throttleKey(): string
    {
        $account = $this->filled('userId') ? 'id:'.$this->input('userId') : 'email:'.mb_strtolower(trim((string) $this->input('email')));

        return 'pos-login|'.$this->ip().'|'.$account;
    }
}
