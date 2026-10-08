import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  /** Disabled rows render grayed and unclickable (honest "coming soon"). */
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  'data-testid'?: string;
}

/**
 * Form select — reference style: jiaoyizhushou shared/ui/Select (boss 10/08).
 * Centered value + chevron trigger; panel = bordered dropdown with plain
 * rows; click-outside closes. Tokens only (no hardcoded colors).
 */
export const Select: React.FC<SelectProps> = ({
  value,
  options,
  onChange,
  placeholder = '请选择',
  className = '',
  size = 'md',
  'data-testid': testId,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const triggerSize = size === 'sm' ? 'h-7 px-2 text-xs gap-1.5' : 'h-9 px-3 text-sm gap-2';
  const rowSize = size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center w-full rounded-md border bg-[var(--bg-tertiary)] transition-colors ${triggerSize} ${
          open ? 'border-[var(--text-primary)]' : 'border-[var(--border-primary)]'
        }`}
      >
        <span className={`flex-1 text-center truncate ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${open ? 'rotate-180' : ''} ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden"
          style={{ boxShadow: '0 8px 20px -6px rgba(0,0,0,0.22)' }}
        >
          <div className="overflow-y-auto max-h-56">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-center transition-colors ${rowSize} ${
                  opt.disabled
                    ? 'text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                    : opt.value === value
                      ? 'text-[var(--text-primary)] font-medium bg-[var(--bg-tertiary)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
