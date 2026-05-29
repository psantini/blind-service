interface Sample {
  id: string;
  label: string;
  display_order: number;
}

interface FlightProgressBarProps {
  samples: Sample[];
  currentSampleId: string;
  revealedSampleIds: Set<string>;
  nosedSampleIds?: Set<string>;
  nosingEnabled?: boolean;
}

export function FlightProgressBar({
  samples,
  currentSampleId,
  revealedSampleIds,
  nosedSampleIds = new Set(),
  nosingEnabled = false,
}: FlightProgressBarProps) {
  const currentIdx = samples.findIndex(s => s.id === currentSampleId);

  return (
    <div className="flex items-center gap-0 mb-6">
      {samples.map((sample, idx) => {
        const isRevealed = revealedSampleIds.has(sample.id);
        const isNosed = nosingEnabled && nosedSampleIds.has(sample.id) && !isRevealed;
        const isCurrent = sample.id === currentSampleId;
        const isNext = idx === currentIdx + 1 && !isRevealed && !isNosed;

        let circleClass = '';
        let circleStyle: React.CSSProperties | undefined;

        if (isRevealed) {
          circleClass = 'bg-amber border-amber text-black';
        } else if (isNosed) {
          circleClass = 'border-amber text-parchment';
          circleStyle = { background: 'linear-gradient(to bottom, #C9973F 50%, #0D0D0D 50%)' };
        } else if (isCurrent) {
          circleClass = 'bg-[#0D0D0D] border-amber text-amber';
        } else {
          circleClass = 'bg-[#0D0D0D] border-[#333] text-muted';
        }

        const sublabel = isRevealed ? 'Done' : isNosed ? 'Nosed' : isCurrent ? 'Current' : isNext ? 'Next' : 'Locked';

        return (
          <div key={sample.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors overflow-hidden ${circleClass}`}
                style={circleStyle}
              >
                {isRevealed ? '✓' : sample.label}
              </div>
              <span className="text-[10px] text-muted mt-0.5">{sublabel}</span>
            </div>
            {idx < samples.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 transition-colors ${
                  isRevealed ? 'bg-amber' : 'bg-[#333]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
