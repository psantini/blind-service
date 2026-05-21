interface YesNoQuestionProps {
  value: string;
  onChange: (value: 'yes' | 'no') => void;
}

export function YesNoQuestion({ value, onChange }: YesNoQuestionProps) {
  return (
    <div className="flex gap-2">
      {(['no', 'yes'] as const).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border-2 ${
            value === v
              ? 'bg-amber text-black border-amber'
              : 'bg-[#EDE7D5] text-[#666] border-[#E5DDD0] hover:border-[#C9B99A]'
          }`}
        >
          {v === 'yes' ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}
