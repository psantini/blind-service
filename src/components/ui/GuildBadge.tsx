interface GuildBadgeProps {
  guild: { name: string; discord_guild_id: string; icon_hash: string | null };
}

export function GuildBadge({ guild }: GuildBadgeProps) {
  const iconUrl = guild.icon_hash
    ? `https://cdn.discordapp.com/icons/${guild.discord_guild_id}/${guild.icon_hash}.png?size=32`
    : null;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#E5DDD0] text-[#444]" style={{ fontSize: '10px' }}>
      {iconUrl ? (
        <img src={iconUrl} alt={guild.name} className="w-3 h-3 rounded-full object-cover" />
      ) : (
        <span className="w-3 h-3 rounded-full bg-[#C9B99A] flex items-center justify-center text-[8px] font-bold text-[#0D0D0D]">
          {guild.name[0]?.toUpperCase()}
        </span>
      )}
      {guild.name}
    </span>
  );
}
