"use client";

/** Generic add/remove/reorder list used for features and spec-table rows. */
export function RepeaterField<T>({
  items,
  onChange,
  blank,
  render,
  addLabel = "+ Add",
  compact = false,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
  addLabel?: string;
  compact?: boolean;
}) {
  const update = (index: number, next: T) =>
    onChange(items.map((item, i) => (i === index ? next : item)));

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className={`rounded-lg border border-[var(--border)] ${compact ? "p-2" : "bg-[var(--surface-muted)] p-3"}`}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">{render(item, (next) => update(index, next))}</div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="rounded px-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="rounded px-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-30"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Remove"
                className="rounded px-1.5 text-xs text-red-600 hover:bg-red-500/10"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, structuredClone(blank)])}
        className="rounded-lg border border-dashed border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] transition hover:border-brand-400 hover:text-brand-600"
      >
        {addLabel}
      </button>
    </div>
  );
}
