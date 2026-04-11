import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-stone-900 hover:bg-stone-700 text-white': variant === 'primary',
          'bg-white hover:bg-stone-50 text-stone-900 border border-stone-300': variant === 'secondary',
          'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
          'hover:bg-stone-100 text-stone-700': variant === 'ghost',
        },
        {
          'text-sm px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-base px-5 py-2.5': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
