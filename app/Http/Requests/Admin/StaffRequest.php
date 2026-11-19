<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StaffRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => mb_strtolower(trim((string) $this->input('code'))),
            'email' => mb_strtolower(trim((string) $this->input('email'))),
        ]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var User|null $staff */
        $staff = $this->route('staff');

        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'min:2', 'max:24', 'regex:/^[a-z]+(-[a-z]+)*$/', Rule::unique('users', 'code')->ignore($staff?->id)],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($staff?->id)],
            'phone' => ['nullable', 'string', 'max:32'],
            'role' => ['required', 'integer', 'exists:roles,id'],
            'active' => ['boolean'],
            'password' => [$staff === null ? 'required' : 'prohibited', 'string', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'The cashier code can only use lowercase letters, with single hyphens between words (e.g. kasun-f).',
            'code.unique' => 'Someone already uses that cashier code.',
            'email.unique' => 'Someone already uses that email.',
            'role.required' => 'Choose a role.',
        ];
    }

    /** @return array{name: string, code: string, email: string, phone: string|null, role_id: int, active: bool, password?: string} */
    public function staffData(): array
    {
        $data = [
            'name' => (string) $this->validated('name'),
            'code' => (string) $this->validated('code'),
            'email' => (string) $this->validated('email'),
            'phone' => $this->validated('phone'),
            'role_id' => (int) $this->validated('role'),
            'active' => (bool) $this->validated('active', true),
        ];
        if ($this->has('password')) {
            $data['password'] = (string) $this->validated('password');
        }

        return $data;
    }
}
