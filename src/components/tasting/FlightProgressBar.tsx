interface Sample {
  id: string;
  label: string;
  display_order: number;
}

interface FlightProgressBarProps {
  samples: Sample[];
  currentSampleId: string;
  revealedSampleIds: Set<string>;
}

export function FlightProgressBar({ samples, currentSampleId, revealedSampleIds }: FlightProgressBarProps) {
  const currentIdx = samples.findIndex(s => s.id === currentSampleId);

  return (
    <div className="flex items-center gap-0 mb-6">
      {samples.map((sample, idx) => {
        const isDone = revealedSampleIds.has(sample.id);
        const isCurrent = sample.id === currentSampleId;
        const isNext = idx === currentIdx + 1 && !isDone;

        return (
          <div key={sample.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  isDone
                    ? 'bg-stone-900 border-stone-900 text-white'
                    : isCurrent
                    ? 'bg-white border-stone-900 text-stone-900'
                    : 'bg-white border-stone-300 text-stone-400'
                }`}
              >
                {isDone ? '✓' : sample.label}
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5">
                {isDone ? 'Done' : isCurrent ? 'Current' : isNext ? 'Next' : 'Locked'}
              </span>
            </div>
            {idx < samples.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 transition-colors ${
                  revealedSampleIds.has(sample.id) ? 'bg-stone-900' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
