import { useEffect, useState } from 'react';
import { Dialog } from '@admin/shared/components/Dialog';
import { Input } from '@admin/shared/components/Input';
import { Select } from '@admin/shared/components/Select';
import { Button } from '@admin/shared/components/Button';
import { useToast } from '@admin/shared/components/Toast';
import { useCreateUnit, useUpdateUnit } from '@admin/features/units/hooks';
import type { Unit } from '@admin/features/units/types';

export interface UnitFormModalProps {
    open: boolean;
    onClose: () => void;
    unit?: Unit | null;
}

const DECIMAL_OPTIONS = [
    { value: '0', label: 'Whole numbers (5 g)' },
    { value: '1', label: '1 decimal place (2.5)' },
    { value: '2', label: '2 decimal places (1.25 m)' },
    { value: '3', label: '3 decimal places (0.375 kg)' },
];

export function UnitFormModal({ open, onClose, unit }: UnitFormModalProps) {
    const isEdit = !!unit;
    const createUnit = useCreateUnit();
    const updateUnit = useUpdateUnit();
    const toast = useToast();

    const [name, setName] = useState('');
    const [measured, setMeasured] = useState(false);
    const [decimals, setDecimals] = useState(0);
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (!open) return;
        setName(unit?.name ?? '');
        setMeasured(unit?.measured ?? false);
        setDecimals(unit?.decimals ?? 0);
        setNameError('');
    }, [open, unit]);

    const isPending = createUnit.isPending || updateUnit.isPending;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setNameError('Unit name is required');
            return;
        }
        const input = {
            name: name.trim(),
            measured,
            decimals: measured ? decimals : 0,
        };
        try {
            if (isEdit && unit) {
                await updateUnit.mutateAsync({ id: unit.id, input });
                toast.success('Unit updated');
            } else {
                await createUnit.mutateAsync(input);
                toast.success('Unit added');
            }
            onClose();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Something went wrong',
            );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit unit' : 'New unit'}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                <Input
                    label="Unit name (e.g. Bag, Coil, kg, L)"
                    value={name}
                    maxLength={24}
                    error={nameError}
                    onChange={(e) => {
                        setName(e.target.value);
                        setNameError('');
                    }}
                />
                <Select
                    label="Sold by"
                    value={measured ? 'measured' : 'count'}
                    onChange={(e) => setMeasured(e.target.value === 'measured')}
                    options={[
                        { value: 'count', label: 'Count (whole items)' },
                        {
                            value: 'measured',
                            label: 'Measure (length, weight, volume)',
                        },
                    ]}
                />
                {measured && (
                    <Select
                        label="Quantities allowed"
                        value={String(decimals)}
                        onChange={(e) => setDecimals(Number(e.target.value))}
                        options={DECIMAL_OPTIONS}
                    />
                )}
                <p className="text-xs text-ink-muted">
                    {measured
                        ? `Bills show "2.5 ${name.trim() || 'kg'}" and prices read "per ${name.trim() || 'kg'}".`
                        : `Bills show "3 × Rs. 2,750"; stock reads "3 ${(name.trim() || 'bag').toLowerCase()}s".`}
                    {isEdit &&
                        unit.productCount > 0 &&
                        ` Changes apply to its ${unit.productCount} product${unit.productCount === 1 ? '' : 's'}.`}
                </p>
                <div className="mt-1.5 flex gap-2.5">
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isPending}
                    >
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
