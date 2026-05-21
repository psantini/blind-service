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
        'inline-flex items-center justify-center font-ui uppercase tracking-[0.12em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        {
          'bg-amber text-black hover:opacity-90': variant === 'primary',
          'text-parchment hover:text-amber': variant === 'secondary',
          'text-red-400 hover:text-red-300': variant === 'danger',
          'text-smoke hover:text-parchment': variant === 'ghost',
        },
        variant === 'secondary' && 'border-[0.5px] border-smoke',
        variant === 'danger' && 'border-[0.5px] border-red-900',
        {
          'text-[11px] px-3 py-1.5': size === 'sm',
          'text-[12px] px-4 py-2': size === 'md',
          'text-[13px] px-5 py-2.5': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
