import { Link } from '@admin/shared/lib/router';
import { HandCoins } from 'lucide-react';
import { CustomerAvatar } from '@admin/features/customers/components/CustomerAvatar';
import { formatCurrency } from '@admin/shared/utils/currency';
import { Panel, PanelEmpty, PanelMore } from '@admin/shared/components/Panel';
import type { DebtorItem } from '@admin/features/dashboard/types';

export function CreditList({
    data,
    total,
    count,
}: {
    data: DebtorItem[];
    total: number;
    count: number;
}) {
    return (
        <Panel
            title="Credit to collect"
            description={
                count > 0
                    ? `${formatCurrency(total)} across ${count} customer${count === 1 ? '' : 's'}`
                    : undefined
            }
            action={{ label: 'Customers', to: '/admin/customers' }}
        >
            {data.length === 0 ? (
                <PanelEmpty
                    icon={<HandCoins className="size-6" />}
                    title="No one owes you money"
                    description="Credit sales will be listed here until they're settled."
                />
            ) : (
                <ul className="px-2 pb-2">
                    {data.map((c) => (
                        <li key={c.id}>
                            <Link
                                to={`/admin/customers?id=${c.id}`}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-canvas/70"
                            >
                                <CustomerAvatar
                                    mono
                                    name={c.name}
                                    className="size-8 text-[11px] font-semibold"
                                />
                                <div className="min-w-0 flex-1 leading-tight">
                                    <div className="truncate text-[13px] font-medium text-ink">
                                        {c.name}
                                    </div>
                                    <div className="truncate text-xs text-ink-muted tabular-nums">
                                        {c.phone || 'No phone'}
                                    </div>
                                </div>
                                <div className="text-[13px] font-semibold text-ink tabular-nums">
                                    {formatCurrency(c.credit)}
                                </div>
                            </Link>
                        </li>
                    ))}
                    {count > data.length && (
                        <li className="px-3 py-2">
                            <PanelMore to="/admin/customers" total={count} />
                        </li>
                    )}
                </ul>
            )}
        </Panel>
    );
}
