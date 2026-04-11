import { Dropdown } from '@/components/ui/Dropdown';

interface DropdownQuestionProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function DropdownQuestion({ value, options, onChange }: DropdownQuestionProps) {
  return (
    <Dropdown
      value={value}
      options={options}
      onChange={e => onChange(e.target.value)}
      placeholder="Select..."
    />
  );
}
