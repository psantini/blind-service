import { Input } from '@/components/ui/Input';

interface NumericQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NumericQuestion({ value, onChange, placeholder }: NumericQuestionProps) {
  return (
    <Input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      step="0.1"
      min="0"
    />
  );
}
