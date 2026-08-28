import { Input } from '@/components/ui/Input';

interface FreeTextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function FreeTextQuestion({ value, onChange, placeholder, multiline }: FreeTextQuestionProps) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-[#E5DDD0] bg-[#EDE7D5] text-[#0D0D0D] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber resize-none"
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
