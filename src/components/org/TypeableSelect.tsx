"use client";

import { kronis } from "@/lib/kronis";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  options: string[];
  placeholder?: string;
  allLabel?: string;
  onChange: (value: string) => void;
};

export function TypeableSelect({
  value,
  options,
  placeholder = "Type to search…",
  allLabel = "All",
  onChange,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const pick = (next: string) => {
    onChange(next);
    setQuery(next);
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className="flex items-center gap-1 rounded-xl border px-2.5 py-1.5"
        style={{ background: "#fff", borderColor: kronis.border }}
      >
        <input
          value={query}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          role="combobox"
          className="min-w-0 flex-1 bg-transparent py-0.5 text-[12px] font-semibold outline-none"
          style={{ color: kronis.ink }}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            onChange(next.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const exact = filtered.find((o) => o.toLowerCase() === query.trim().toLowerCase());
              if (exact) pick(exact);
              else if (filtered.length === 1) pick(filtered[0]);
            }
          }}
        />
        {value || query ? (
          <button
            type="button"
            aria-label="Clear"
            className="grid h-6 w-6 place-items-center rounded-full"
            style={{ color: kronis.inkMuted }}
            onClick={clear}
          >
            <X size={12} strokeWidth={2.6} />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open"
            className="grid h-6 w-6 place-items-center rounded-full"
            style={{ color: kronis.inkMuted }}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-44 overflow-y-auto rounded-xl border py-1 shadow-lg"
          style={{ background: "#fff", borderColor: kronis.border }}
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className="flex w-full px-3 py-2 text-left text-[12px] font-semibold"
            style={{ color: !value ? kronis.ink : kronis.inkMuted, background: !value ? kronis.limeSoft : "transparent" }}
            onClick={() => pick("")}
          >
            {allLabel}
          </button>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
              No matches
            </div>
          ) : (
            filtered.map((opt) => {
              const on = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={on}
                  className="flex w-full px-3 py-2 text-left text-[12px] font-semibold"
                  style={{
                    color: kronis.ink,
                    background: on ? kronis.limeSoft : "transparent",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                >
                  {opt}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
