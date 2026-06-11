import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DestructiveButton } from '@/components/admin/DestructiveButton';
import { InviteLink } from '@/components/admin/InviteLink';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createGroup, deleteGroup, createInvite, revokeInvite, removeMember, updateMemberRole, addMember } from './actions';

export default async function GroupsPage() {
  const adminClient = createAdminClient();

  const { data: groups } = await adminClient
    .from('groups')
    .select('id, name, discord_guild_id, icon_url')
    .order('name');

  const groupIds = (groups ?? []).map(g => g.id);

  const [{ data: members }, { data: invites }] = await Promise.all([
    groupIds.length > 0
      ? adminClient
          .from('group_members')
          .select('group_id, user_id, role, profile:profiles!user_id(discord_username)')
          .in('group_id', groupIds)
      : Promise.resolve({ data: [] }),
    groupIds.length > 0
      ? adminClient
          .from('group_invites')
          .select('id, group_id, token, max_uses, use_count, expires_at')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  type MemberRow = NonNullable<typeof members>[number];
  type InviteRow = NonNullable<typeof invites>[number];

  const membersByGroup = (members ?? []).reduce<Record<string, MemberRow[]>>((acc, m) => {
    if (!acc[m!.group_id]) acc[m!.group_id] = [];
    acc[m!.group_id]!.push(m!);
    return acc;
  }, {});

  const invitesByGroup = (invites ?? []).reduce<Record<string, InviteRow[]>>((acc, i) => {
    if (!acc[i!.group_id]) acc[i!.group_id] = [];
    acc[i!.group_id]!.push(i!);
    return acc;
  }, {});

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: allProfiles } = await adminClient
    .from('profiles')
    .select('id, discord_username')
    .order('discord_username');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display italic font-bold text-parchment">Groups</h1>
      </div>

      <div className="space-y-6">
        {(groups ?? []).length === 0 && (
          <p className="text-sm text-muted">No groups yet.</p>
        )}

        {(groups ?? []).map(group => {
          const groupMembers = membersByGroup[group.id] ?? [];
          const groupInvites = invitesByGroup[group.id] ?? [];
          const activeInvites = groupInvites.filter(i => new Date(i!.expires_at) > new Date());
          const memberUserIds = new Set(groupMembers.map(m => m!.user_id));
          const nonMembers = (allProfiles ?? []).filter(p => !memberUserIds.has(p.id));

          return (
            <div key={group.id} className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
              {/* Group header */}
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '0.5px solid #E5DDD0' }}>
                <div className="flex items-center gap-3">
                  {group.icon_url && (
                    <img src={group.icon_url} alt={group.name} className="w-7 h-7 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#0D0D0D]">{group.name}</p>
                    {group.discord_guild_id && (
                      <p className="text-xs text-muted font-mono">{group.discord_guild_id}</p>
                    )}
                  </div>
                </div>
                <DestructiveButton
                  label="Delete group"
                  confirmLabel="Confirm delete"
                  action={deleteGroup.bind(null, group.id)}
                />
              </div>

              {/* Members */}
              <div style={{ borderBottom: '0.5px solid #E5DDD0' }}>
                <p className="px-5 pt-3 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">
                  Members ({groupMembers.length})
                </p>
                {groupMembers.length === 0 ? (
                  <p className="px-5 pb-3 text-xs text-muted">No members yet.</p>
                ) : (
                  <div className="divide-y divide-[#E5DDD0]">
                    {groupMembers.map(m => {
                      const profile = (m as any).profile;
                      const isSelf = m!.user_id === user?.id;
                      const isAdmin = m!.role === 'admin';
                      return (
                        <div key={m!.user_id} className="flex items-center justify-between px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#E5DDD0] flex items-center justify-center text-xs font-bold text-[#0D0D0D] shrink-0">
                              {profile?.discord_username?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm text-[#0D0D0D]">{profile?.discord_username}</span>
                            {isAdmin && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber text-black font-semibold">admin</span>
                            )}
                          </div>
                          {!isSelf && (
                            <div className="flex items-center gap-2">
                              <form action={updateMemberRole.bind(null, group.id, m!.user_id, isAdmin ? 'member' : 'admin')}>
                                <button
                                  type="submit"
                                  className="text-xs px-2 py-0.5 rounded border border-[#444] text-muted hover:text-parchment transition-colors"
                                >
                                  {isAdmin ? 'Remove admin' : 'Make admin'}
                                </button>
                              </form>
                              <DestructiveButton
                                label="Remove"
                                confirmLabel="Confirm remove"
                                action={removeMember.bind(null, group.id, m!.user_id)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add existing user */}
                {nonMembers.length > 0 && (
                  <form action={addMember} className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '0.5px solid #E5DDD0' }}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <select
                      name="user_id"
                      className="flex-1 text-xs rounded border border-[#E5DDD0] bg-[#EDE7D5] text-[#0D0D0D] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber"
                    >
                      {nonMembers.map(p => (
                        <option key={p.id} value={p.id}>{p.discord_username}</option>
                      ))}
                    </select>
                    <Button type="submit" className="text-xs py-1 px-3 shrink-0">Add member →</Button>
                  </form>
                )}
              </div>

              {/* Invite links */}
              <div style={{ borderBottom: '0.5px solid #E5DDD0' }}>
                <p className="px-5 pt-3 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">
                  Active invite links ({activeInvites.length})
                </p>
                {activeInvites.length === 0 ? (
                  <p className="px-5 pb-3 text-xs text-muted">No active invite links.</p>
                ) : (
                  <div className="divide-y divide-[#E5DDD0]">
                    {activeInvites.map(invite => {
                      const expires = new Date(invite!.expires_at);
                      const daysLeft = Math.ceil((expires.getTime() - Date.now()) / 86_400_000);
                      return (
                        <div key={invite!.id} className="flex items-center justify-between px-5 py-2.5 gap-4">
                          <InviteLink token={invite!.token} />
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-muted">
                              {invite!.use_count}{invite!.max_uses !== null ? `/${invite!.max_uses}` : ''} uses · {daysLeft}d left
                            </span>
                            <DestructiveButton
                              label="Revoke"
                              confirmLabel="Confirm revoke"
                              action={revokeInvite.bind(null, invite!.id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Generate invite */}
              <form action={createInvite} className="px-5 py-4 space-y-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Generate invite link</p>
                <input type="hidden" name="group_id" value={group.id} />
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#666]">Expires in</label>
                    <select
                      name="expires_days"
                      defaultValue="7"
                      className="text-xs rounded border border-[#E5DDD0] bg-[#EDE7D5] text-[#0D0D0D] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber"
                    >
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#666]">Max uses</label>
                    <Input
                      name="max_uses"
                      type="number"
                      placeholder="Unlimited"
                      min="1"
                      className="w-28 text-xs py-1"
                    />
                  </div>
                  <Button type="submit" className="text-xs py-1 px-3">Generate →</Button>
                </div>
              </form>
            </div>
          );
        })}
      </div>

      {/* Create group */}
      <div>
        <h2 className="text-lg font-semibold text-parchment mb-3">Create group</h2>
        <form action={createGroup} className="bg-cream rounded-xl p-6 space-y-4" style={{ border: '0.5px solid #E5DDD0' }}>
          <div>
            <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Group name</label>
            <Input name="name" placeholder="e.g. BBC" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">
              Discord server ID <span className="text-[#999] font-normal">(optional — enables auto-sync)</span>
            </label>
            <Input name="discord_guild_id" placeholder="e.g. 1299537647202734163" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Create group →</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
