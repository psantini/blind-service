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
        'inline-flex items-center px-2 uppercase tracking-[0.06em] font-medium border-[0.5px]',
        {
          'bg-[#1A1200] text-amber border-[#3A2900]': variant === 'default' || variant === 'amber',
          'bg-[#0A1A0A] text-[#4A9A4A] border-[#1E3A1E]': variant === 'green',
          'bg-[#111] text-smoke border-[#333]': variant === 'grey',
          'bg-[#0A0F1A] text-[#4A7A9A] border-[#1A2E3A]': variant === 'blue',
        },
        className
      )}
      style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '4px' }}
    >
      {children}
    </span>
  );
}
