import { useToast } from '@admin/shared/components/Toast';
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { useCan } from '@admin/features/auth/hooks';
import {
    useCancelOrder,
    useIssueOrder,
    useSettleOrder,
} from '@admin/features/orders/hooks';
import { buildReceiptData } from '@admin/features/orders/receipt';
import { usePrintReceipt } from '@admin/features/orders/printReceipt';
import type { Order } from '@admin/features/orders/types';

/** Print / collect / settle / cancel for one order, with the permission rules in one place: anyone can print or mark goods collected; settling, editing and cancelling follow the role. Cancelled bills can't be printed, so a void sale never leaves the shop as a receipt. */
export function useOrderActions(order: Order | undefined) {
    const canEditItems = useCan('orders.edit');
    const canCancelBills = useCan('orders.cancel');
    const canSettleBills = useCan('orders.settle');
    const isAdmin = canEditItems || canCancelBills;
    const cancelOrder = useCancelOrder();
    const issueOrder = useIssueOrder();
    const settleOrder = useSettleOrder();
    const toast = useToast();
    const confirm = useConfirm();
    const { print: printReceipt, isPrinting } = usePrintReceipt();

    const isLive = !!order && order.status !== 'CANCELLED';

    // Reprints ask whether to include the tear-off warehouse part (the sale itself prints it automatically).
    // Dismissing the question prints the main bill only.
    const print = async () => {
        if (!order || !isLive) return;
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
            title: `Mark ${order.invoice} as collected?`,
            description:
                'Confirm the goods have been handed over to the customer from the warehouse.',
            confirmLabel: 'Mark as collected',
        });
        if (!ok) return;
        try {
            await issueOrder.mutateAsync(order.invoice);
            toast.success('Order marked as collected');
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Failed to update order status',
            );
        }
    };

    const settle = async () => {
        if (!order) return;
        const ok = await confirm({
            title: `Mark ${order.invoice} as paid?`,
            description:
                'Confirm the customer has settled this bill. Record the money itself as a payment on the customer.',
            confirmLabel: 'Mark as paid',
        });
        if (!ok) return;
        try {
            await settleOrder.mutateAsync(order.invoice);
            toast.success('Order marked as paid');
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
        canIssue: order?.status === 'READY_TO_COLLECT',
        canSettle: canSettleBills && order?.status === 'PAYMENT_PENDING',
        canPrint: isLive,
        canEdit: canEditItems && isLive,
        canCancel: canCancelBills && isLive,
        print,
        issue,
        settle,
        cancel,
        isPrinting,
        isIssuing: issueOrder.isPending,
        isSettling: settleOrder.isPending,
        isCancelling: cancelOrder.isPending,
    };
}
