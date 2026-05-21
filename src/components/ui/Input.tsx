import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 bg-pitch text-parchment text-sm placeholder:text-smoke focus:outline-none focus:border-amber transition-colors',
        className
      )}
      style={{ border: '0.5px solid #222', borderRadius: 6 }}
      {...props}
    />
  );
}
