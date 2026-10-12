import { QRCodeSVG } from 'qrcode.react';
import { Scissors } from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';

export interface ReceiptItemData {
    name: string;
    qtyLabel: string;
    subtotalFmt: string;
    hasDiscount: boolean;
    discountPct?: number;
    discountAmtFmt?: string;
    /** Quantity, for the warehouse part. */
    qty?: number;
    /** The quantity's unit, shown with measured quantities ("x2.5 kg"). */
    unit?: string;
    /** Sold by length or weight: left out of the warehouse part's unit count. */
    measured?: boolean;
    /** Where the customer collects it; warehouse items also go on the tear-off warehouse part. */
    source?: 'STORE' | 'WAREHOUSE';
}

export interface ReceiptCustomerData {
    name: string;
    phone?: string;
}

export interface ReceiptData {
    invoice: string;
    dateLabel: string;
    timeLabel?: string;
    cashier: string;
    payment: string;
    customer?: ReceiptCustomerData;
    items: ReceiptItemData[];
    subtotalFmt: string;
    hasDiscount: boolean;
    discountFmt: string;
    grandTotalFmt: string;
    paidFmt: string;
    changeFmt: string;
}

/** Shop details printed on the receipt (from shared shop settings). */
export interface ReceiptShop {
    storeName: string;
    address: string;
    phone: string;
    regNo: string;
    receiptFooter: string;
}

/** True when the bill has items to collect from the warehouse, so a tear-off warehouse part applies. */
export function hasWarehouseItems(data: ReceiptData): boolean {
    return data.items.some((i) => i.source === 'WAREHOUSE');
}

/** An 80mm thermal receipt. The tills print it natively over ESC/POS; the admin console prints this rendering through the browser. */
export function ThermalReceipt({
    data,
    shop,
    showQr = true,
    warehouseSlip = false,
}: {
    data: ReceiptData;
    shop: ReceiptShop;
    showQr?: boolean;
    /** Show the tear-off warehouse part under the bill (only when there are warehouse items), as the printer does. */
    warehouseSlip?: boolean;
}) {
    const warehouse = data.items.filter((i) => i.source === 'WAREHOUSE');
    const footer = shop.receiptFooter.split('\n').map((l) => l.trim());
    const [first, ...rest] = footer[0] === '' ? footer.slice(1) : footer;
    return (
        <div className="mx-auto w-[80mm] max-w-full [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.08))_drop-shadow(0_12px_24px_rgba(0,0,0,0.12))]">
            <TornEdge side="top" />
            <div
                className="px-[4mm] py-[4mm] font-mono text-[12.5px] leading-normal text-black tabular-nums"
                style={{ background: PAPER }}
            >
                <div className="flex flex-col items-center gap-[0.5mm] text-center leading-tight">
                    <div className="text-[16px] font-extrabold tracking-wide">
                        {shop.storeName}
                    </div>
                    {shop.address && (
                        <div className="text-[12px] text-neutral-700">
                            {shop.address}
                        </div>
                    )}
                    {shop.phone && (
                        <div className="text-[12px] text-neutral-700">
                            {shop.phone}
                        </div>
                    )}
                    {shop.regNo && (
                        <div className="text-[11px] text-neutral-500">
                            Reg No: {shop.regNo}
                        </div>
                    )}
                </div>

                <Divider />

                <div className="flex flex-col gap-[1.2mm]">
                    <Row label="Invoice" value={data.invoice} bold />
                    <Row label="Date" value={data.dateLabel} />
                    {data.timeLabel && (
                        <Row label="Time" value={data.timeLabel} />
                    )}
                </div>

                <div className="h-[2.5mm]" />

                <div className="flex flex-col gap-[1.2mm]">
                    <Row label="Cashier" value={data.cashier} />
                    <Row label="Payment" value={data.payment} />
                </div>

                {data.customer && (
                    <>
                        <div className="h-[2.5mm]" />
                        <div className="flex flex-col gap-[1.2mm]">
                            <Row
                                label="Customer"
                                value={data.customer.name}
                                bold
                            />
                            {data.customer.phone && (
                                <Row
                                    label="Phone"
                                    value={data.customer.phone}
                                />
                            )}
                        </div>
                    </>
                )}

                <Divider />

                <div className="flex flex-col gap-[3mm]">
                    {data.items.map((item, i) => (
                        <div key={i}>
                            <div className="text-[12.5px] font-bold">
                                {item.name}
                            </div>
                            <div className="flex justify-between text-neutral-800">
                                <span>{item.qtyLabel}</span>
                                <span className="font-semibold">
                                    {item.subtotalFmt}
                                </span>
                            </div>
                            {item.hasDiscount && (
                                <div className="flex justify-between text-[11px] text-neutral-500">
                                    <span>Discount ({item.discountPct}%)</span>
                                    <span>-{item.discountAmtFmt}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <Divider />

                <div className="flex flex-col gap-[1.4mm]">
                    <Row label="Subtotal" value={data.subtotalFmt} />
                    {data.hasDiscount && (
                        <Row label="Discount" value={`-${data.discountFmt}`} />
                    )}
                </div>

                <div className="my-[3mm] flex items-baseline justify-between border-t-[1.5px] border-b-[1.5px] border-black py-[2.2mm]">
                    <span className="text-[14px] font-extrabold tracking-widest">
                        TOTAL
                    </span>
                    <span className="text-[19px] font-extrabold">
                        {data.grandTotalFmt}
                    </span>
                </div>

                <div className="mt-[2mm] flex flex-col gap-[1.4mm]">
                    <Row label="Paid" value={data.paidFmt} />
                    <Row label="Change" value={data.changeFmt} />
                </div>

                <Divider className="my-[5mm]" />

                {showQr && (
                    <>
                        <div className="flex flex-col items-center gap-[2mm]">
                            <QRCodeSVG value={data.invoice} size={90} />
                        </div>
                        <div className="h-[5mm]" />
                    </>
                )}

                {/* Same rule as the printer: first footer line bold, the rest plain. */}
                <div className="flex flex-col items-center gap-[1mm] text-center text-neutral-700">
                    {first && (
                        <div className="text-[12.5px] font-bold">{first}</div>
                    )}
                    {rest.map((line, i) => (
                        <div
                            key={i}
                            className="min-h-[1em] text-[11px] leading-normal"
                        >
                            {line}
                        </div>
                    ))}
                </div>
            </div>

            {warehouseSlip && warehouse.length > 0 && (
                <>
                    {/* Mirrors the printer: TEAR HERE, a scissors tear line, a partial cut, then the keeper's part. */}
                    <div
                        className="px-[4mm] pt-[3mm] pb-[1mm] font-mono text-black"
                        style={{ background: PAPER }}
                    >
                        <div className="text-center text-[11px]">TEAR HERE</div>
                        <div
                            className="mt-[1mm] flex items-center gap-[2mm]"
                            aria-hidden
                        >
                            <Scissors
                                className="size-[5mm] shrink-0"
                                strokeWidth={2.25}
                            />
                            <div className="flex-1 border-t-2 border-dashed border-black" />
                        </div>
                    </div>
                    <div
                        className="h-[3px] bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.25)_0_6px,transparent_6px_10px)]"
                        title="Partial cut"
                    />
                    <div
                        className="px-[4mm] py-[4mm] font-mono text-[12.5px] leading-normal text-black tabular-nums"
                        style={{ background: PAPER }}
                    >
                        <div className="flex flex-col items-center gap-[0.5mm] text-center leading-tight">
                            <div className="font-bold">
                                WAREHOUSE COLLECTION
                            </div>
                            <div className="text-[12px] text-neutral-700">
                                {shop.storeName}
                            </div>
                            <div className="mt-[1mm] text-[20px] font-extrabold">
                                {data.invoice}
                            </div>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-[1.2mm]">
                            <Row
                                label="Date"
                                value={[data.dateLabel, data.timeLabel]
                                    .filter(Boolean)
                                    .join(' ')}
                            />
                            <Row
                                label="Customer"
                                value={
                                    data.customer?.name ?? 'Walk-in customer'
                                }
                            />
                            {data.customer?.phone && (
                                <Row
                                    label="Phone"
                                    value={data.customer.phone}
                                />
                            )}
                            <Row label="Cashier" value={data.cashier} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-[1.5mm]">
                            {warehouse.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between gap-[2mm] font-bold"
                                >
                                    <span className="min-w-0 truncate">
                                        {item.name}
                                    </span>
                                    <span className="shrink-0">
                                        {item.qty
                                            ? `x${item.qty}${item.measured && item.unit ? ` ${item.unit}` : ''}`
                                            : item.qtyLabel}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Divider />
                        <div className="flex justify-between">
                            <span>Items: {warehouse.length}</span>
                            <span>
                                Units:{' '}
                                {warehouse.reduce(
                                    (n, i) =>
                                        n + (i.measured ? 1 : (i.qty ?? 0)),
                                    0,
                                )}
                            </span>
                        </div>
                        <div className="mt-[4mm]">
                            Issued by: ____________________
                        </div>
                        {showQr && (
                            <div className="mt-[4mm] flex justify-center">
                                <QRCodeSVG value={data.invoice} size={80} />
                            </div>
                        )}
                    </div>
                </>
            )}
            <TornEdge side="bottom" />
        </div>
    );
}

const PAPER = '#fffefb';

/** Scalloped strip that makes the preview read as a strip of torn-off thermal paper. */
function TornEdge({ side }: { side: 'top' | 'bottom' }) {
    const y = side === 'top' ? '0' : '6px';
    return (
        <div
            className="h-[6px]"
            style={{
                background: `radial-gradient(circle at 5px ${y}, transparent 4px, ${PAPER} 4.5px) 0 0 / 10px 6px repeat-x`,
            }}
        />
    );
}

function Row({
    label,
    value,
    bold,
}: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <div className="flex justify-between">
            <span className="text-neutral-600">{label}</span>
            <span className={bold ? 'font-bold' : undefined}>{value}</span>
        </div>
    );
}

function Divider({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'my-[4mm] border-t border-dashed border-neutral-400',
                className,
            )}
        />
    );
}
