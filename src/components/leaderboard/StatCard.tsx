interface StatCardProps {
  label: string;
  value: number | string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-cream rounded-xl p-4" style={{ border: '0.5px solid #E5DDD0' }}>
      <p className="text-2xl font-bold text-[#0D0D0D]">{value}</p>
      <p className="text-xs text-[#666] mt-0.5">{label}</p>
    </div>
  );
}
