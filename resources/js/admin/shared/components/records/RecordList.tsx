import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Card } from '@admin/shared/components/Card';
import { cn } from '@admin/shared/lib/cn';

export interface RecordColumn<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    align?: 'left' | 'right';
    className?: string;
    /**
     * Hide on narrower windows, where the panel leaves the list little room:
     * true / 'xl' hides below 1280px, 'wide' hides below 1440px.
     */
    optional?: boolean | 'xl' | 'wide';
}

const cell = 'px-3 first:pl-5 last:pr-5 whitespace-nowrap';

function hideClass(o: RecordColumn<unknown>['optional']) {
    if (!o) return undefined;
    return o === 'wide'
        ? 'hidden min-[1440px]:table-cell'
        : 'hidden xl:table-cell';
}

/**
 * Dense, selectable list. Click a row or move with ↑/↓ (focus the list first); the selection is
 * owned by the page (usually the URL) and the panel beside it follows.
 */
export function RecordList<T>({
    columns,
    rows,
    rowKey,
    selected,
    onSelect,
    isLoading,
    empty,
    footer,
    label,
    rowTone,
}: {
    columns: RecordColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    selected: string | null;
    onSelect: (key: string) => void;
    isLoading?: boolean;
    empty: ReactNode;
    footer?: ReactNode;
    label: string;
    /** Muted rows (e.g. cancelled orders). */
    rowTone?: (row: T) => 'muted' | undefined;
}) {
    const bodyRef = useRef<HTMLTableSectionElement>(null);
    const index = rows.findIndex((r) => rowKey(r) === selected);

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // Vertical only: scrollIntoView would also scroll a wide table sideways and hide its first column.
        const row = bodyRef.current?.children[index] as HTMLElement | undefined;
        const box = scrollRef.current;
        if (!row || !box) return;
        const head = 37;
        if (row.offsetTop - head < box.scrollTop)
            box.scrollTop = row.offsetTop - head;
        else if (
            row.offsetTop + row.offsetHeight >
            box.scrollTop + box.clientHeight
        )
            box.scrollTop = row.offsetTop + row.offsetHeight - box.clientHeight;
    }, [index]);

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        if (!rows.length) return;
        e.preventDefault();
        const next =
            index < 0
                ? 0
                : Math.min(
                      rows.length - 1,
                      Math.max(0, index + (e.key === 'ArrowDown' ? 1 : -1)),
                  );
        onSelect(rowKey(rows[next]));
    };

    return (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
                ref={scrollRef}
                className="relative min-h-0 flex-1 overflow-auto rounded-card outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
                tabIndex={0}
                onKeyDown={onKeyDown}
                aria-label={`${label}. Use the up and down arrow keys to move between rows.`}
            >
                <table className="w-full text-[13px]">
                    {/* No header over an empty result: columns sized by nothing would jump around. */}
                    <thead
                        className={cn(
                            'sticky top-0 z-[1] bg-canvas-card',
                            !isLoading && rows.length === 0 && 'hidden',
                        )}
                    >
                        <tr className="shadow-[inset_0_-1px_0_rgb(var(--c-line))]">
                            {columns.map((c) => (
                                <th
                                    key={c.key}
                                    scope="col"
                                    className={cn(
                                        cell,
                                        'bg-canvas/50 py-2 text-xs font-medium text-ink-muted',
                                        c.align === 'right'
                                            ? 'text-right'
                                            : 'text-left',
                                        hideClass(c.optional),
                                        c.className,
                                    )}
                                >
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody ref={bodyRef}>
                        {isLoading
                            ? Array.from({ length: 8 }, (_, i) => (
                                  <tr
                                      key={i}
                                      className="border-b border-line/70"
                                  >
                                      {columns.map((c) => (
                                          <td
                                              key={c.key}
                                              className={cn(
                                                  cell,
                                                  'py-3',
                                                  hideClass(c.optional),
                                              )}
                                          >
                                              <div
                                                  className="h-3.5 animate-pulse rounded-md bg-line/60"
                                                  style={{
                                                      width: `${50 + ((i * 17 + c.key.length * 7) % 40)}%`,
                                                  }}
                                              />
                                          </td>
                                      ))}
                                  </tr>
                              ))
                            : rows.map((row) => {
                                  const key = rowKey(row);
                                  const on = key === selected;
                                  return (
                                      <tr
                                          key={key}
                                          onClick={() => onSelect(key)}
                                          aria-selected={on}
                                          className={cn(
                                              'cursor-pointer border-b border-line/70 transition-colors last:border-0',
                                              on
                                                  ? 'bg-brand-50 shadow-[inset_2px_0_0_rgb(var(--c-brand-500))]'
                                                  : 'hover:bg-canvas/60',
                                              rowTone?.(row) === 'muted' &&
                                                  !on &&
                                                  'text-ink-muted',
                                          )}
                                      >
                                          {columns.map((c) => (
                                              <td
                                                  key={c.key}
                                                  className={cn(
                                                      cell,
                                                      'py-2.5',
                                                      c.align === 'right' &&
                                                          'text-right',
                                                      hideClass(c.optional),
                                                      c.className,
                                                  )}
                                              >
                                                  {c.render(row)}
                                              </td>
                                          ))}
                                      </tr>
                                  );
                              })}
                    </tbody>
                </table>
                {!isLoading && rows.length === 0 && (
                    <div className="py-6">{empty}</div>
                )}
            </div>
            {footer && <div className="border-t border-line">{footer}</div>}
        </Card>
    );
}
