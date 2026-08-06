"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Minimal HTML editor for blog bodies. Deliberately dependency-free: the toolbar wraps
 * the current selection in plain semantic tags, and a Preview tab renders what will be
 * published. Editors can also drop into raw HTML when they need to.
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [rows, setRows] = useState(18);

  useEffect(() => {
    // Grow with the content so long articles do not need constant scrolling.
    const lines = value.split("\n").length;
    setRows(Math.min(46, Math.max(18, lines + 2)));
  }, [value]);

  function wrap(before: string, after: string, placeholder = "") {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);

    // Put the caret inside what we just inserted.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  const tools: { label: string; title: string; action: () => void }[] = [
    { label: "H2", title: "Heading", action: () => wrap("<h2>", "</h2>", "Heading") },
    { label: "H3", title: "Subheading", action: () => wrap("<h3>", "</h3>", "Subheading") },
    { label: "P", title: "Paragraph", action: () => wrap("<p>", "</p>", "Paragraph text") },
    { label: "B", title: "Bold", action: () => wrap("<strong>", "</strong>", "bold") },
    { label: "I", title: "Italic", action: () => wrap("<em>", "</em>", "italic") },
    {
      label: "• List",
      title: "Bullet list",
      action: () => wrap("<ul>\n  <li>", "</li>\n</ul>", "First item"),
    },
    {
      label: "Link",
      title: "Link",
      action: () => {
        const href = window.prompt("Link URL", "https://");
        if (href) wrap(`<a href="${href}">`, "</a>", "link text");
      },
    },
  ];

  return (
    <div className="rounded-lg border border-[var(--border)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] bg-[var(--surface-muted)] p-2">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.title}
            onClick={tool.action}
            disabled={tab === "preview"}
            className="rounded px-2.5 py-1 text-xs font-medium transition hover:bg-[var(--surface)] disabled:opacity-40"
          >
            {tool.label}
          </button>
        ))}

        <div className="ms-auto flex gap-1">
          {(["write", "preview"] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition ${
                tab === name ? "bg-brand-600 text-white" : "hover:bg-[var(--surface)]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          spellCheck
          placeholder="<p>Start writing…</p>"
          className="w-full resize-y bg-[var(--surface)] p-4 font-mono text-sm leading-relaxed outline-none"
        />
      ) : (
        <div
          className="prose-cms min-h-64 p-4"
          dangerouslySetInnerHTML={{ __html: value || "<p>Nothing to preview yet.</p>" }}
        />
      )}
    </div>
  );
}
