"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  id?: string;
  onBlur?: () => void;
}

/**
 * Lightweight, free-text input with an inline suggestion dropdown.
 * Users may pick a suggestion or type anything. Filters case-insensitively
 * by substring.
 */
export function Combobox({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  inputMode,
  id,
  onBlur,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    const unique = Array.from(new Set(suggestions));
    if (!q) return unique.slice(0, 8);
    return unique
      .filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      .slice(0, 8);
  }, [suggestions, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      onChange(filtered[activeIndex]);
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.map((s, i) => (
            <li
              key={s}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                i === activeIndex && "bg-accent text-accent-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setOpen(false);
                setActiveIndex(-1);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
