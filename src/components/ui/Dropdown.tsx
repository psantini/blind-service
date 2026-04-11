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
        'w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
