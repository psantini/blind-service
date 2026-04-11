interface ScoreBreakdownProps {
  items: Array<{
    name: string;
    correct: string;
    guessed: string | null;
    points: number | null;
    fuzzyPending: boolean;
  }>;
}

export function ScoreBreakdown({ items }: ScoreBreakdownProps) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-stone-600 capitalize">{item.name}</span>
          <span className="text-stone-400 mx-2">{item.correct}</span>
          <span className={
            item.fuzzyPending ? 'text-amber-600 italic' :
            (item.points ?? 0) > 0 ? 'text-green-700' : 'text-stone-400'
          }>
            {item.fuzzyPending ? '? pts' : `${item.points ?? 0} pts`}
          </span>
        </div>
      ))}
    </div>
  );
}
