import { Input } from '@/components/ui/Input';

interface FreeTextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FreeTextQuestion({ value, onChange, placeholder }: FreeTextQuestionProps) {
  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
