interface GroupBadgeProps {
  group: { name: string; icon_url: string | null };
}

export function GroupBadge({ group }: GroupBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#E5DDD0] text-[#444]" style={{ fontSize: '10px' }}>
      {group.icon_url ? (
        <img src={group.icon_url} alt={group.name} className="w-3 h-3 rounded-full object-cover" />
      ) : (
        <span className="w-3 h-3 rounded-full bg-[#C9B99A] flex items-center justify-center text-[8px] font-bold text-[#0D0D0D]">
          {group.name[0]?.toUpperCase()}
        </span>
      )}
      {group.name}
    </span>
  );
}
