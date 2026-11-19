import { Search } from 'lucide-react';
import { Input } from '@admin/shared/components/Input';
import type { InputProps } from '@admin/shared/components/Input';

export function SearchBar(props: InputProps) {
    return (
        <Input
            type="text"
            leftIcon={<Search className="size-4" />}
            {...props}
        />
    );
}
