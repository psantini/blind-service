interface StatCardProps {
  label: string;
  value: number | string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{label}</p>
    </div>
  );
}
