import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'amber' | 'grey' | 'blue';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        {
          'bg-stone-100 text-stone-700': variant === 'default',
          'bg-green-100 text-green-800': variant === 'green',
          'bg-amber-100 text-amber-800': variant === 'amber',
          'bg-stone-100 text-stone-500': variant === 'grey',
          'bg-blue-100 text-blue-800': variant === 'blue',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
