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
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
          }`}
        >
          {v === 'yes' ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}
