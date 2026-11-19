import { useToast } from '@admin/shared/components/Toast';
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { useCan } from '@admin/features/auth/hooks';
import { useCancelOrder, useIssueOrder } from '@admin/features/orders/hooks';
import { buildReceiptData } from '@admin/features/orders/receipt';
import { usePrintReceipt } from '@admin/features/orders/printReceipt';
import type { Order } from '@admin/features/orders/types';

/** Print / issue / cancel for one order, with the permission rules in one place: anyone can print or issue; editing and cancelling follow the role. */
export function useOrderActions(order: Order | undefined) {
    const canEditItems = useCan('orders.edit');
    const canCancelBills = useCan('orders.cancel');
    const isAdmin = canEditItems || canCancelBills;
    const cancelOrder = useCancelOrder();
    const issueOrder = useIssueOrder();
    const toast = useToast();
    const confirm = useConfirm();
    const { print: printReceipt, isPrinting } = usePrintReceipt();

    const isLive = !!order && order.status !== 'CANCELLED';

    // Reprints ask whether to include the tear-off warehouse part (the sale itself prints it automatically).
    // Dismissing the question prints the main bill only.
    const print = async () => {
        if (!order) return;
        const data = buildReceiptData(order);
        const warehouseCount = order.items.filter(
            (i) => i.source === 'WAREHOUSE',
        ).length;
        let warehouseSlip = false;
        if (warehouseCount > 0) {
            warehouseSlip = await confirm({
                title: 'Include the warehouse part?',
                description: `This bill has ${warehouseCount} ${warehouseCount === 1 ? 'item' : 'items'} to collect from the warehouse. The warehouse part prints under the bill, ready to tear off.`,
                confirmLabel: 'Include warehouse part',
                cancelLabel: 'Main bill only',
            });
        }
        await printReceipt(data, { warehouseSlip });
    };

    const issue = async () => {
        if (!order) return;
        const ok = await confirm({
            title: `Mark ${order.invoice} as issued?`,
            description:
                'Confirm the goods have been handed over to the customer from the warehouse.',
            confirmLabel: 'Mark as issued',
        });
        if (!ok) return;
        try {
            await issueOrder.mutateAsync(order.invoice);
            toast.success('Order marked as issued');
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Failed to update order status',
            );
        }
    };

    const cancel = async () => {
        if (!order) return;
        const ok = await confirm({
            title: `Cancel ${order.invoice}?`,
            description:
                'This cannot be undone. Any outstanding credit for this order will be reversed.',
            confirmLabel: 'Cancel order',
            danger: true,
        });
        if (!ok) return;
        try {
            await cancelOrder.mutateAsync(order.invoice);
            toast.success('Order cancelled');
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Failed to cancel order',
            );
        }
    };

    return {
        isAdmin,
        canIssue: order?.status === 'PENDING',
        canEdit: canEditItems && isLive,
        canCancel: canCancelBills && isLive,
        print,
        issue,
        cancel,
        isPrinting,
        isIssuing: issueOrder.isPending,
        isCancelling: cancelOrder.isPending,
    };
}
