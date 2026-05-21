import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Dropdown({ options, placeholder, className, ...props }: DropdownProps) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 bg-pitch text-parchment text-sm focus:outline-none focus:border-amber transition-colors',
        className
      )}
      style={{ border: '0.5px solid #222', borderRadius: 6 }}
      {...props}
    >
      {placeholder && (
        <option value="" disabled style={{ color: '#555' }}>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: '#0D0D0D' }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
