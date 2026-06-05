import { createClient } from '@/lib/supabase/server';
import { DestructiveButton } from '@/components/admin/DestructiveButton';
import { addGuild, deleteGuild } from './actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default async function GuildsPage() {
  const supabase = await createClient();
  const { data: guilds } = await supabase
    .from('guilds')
    .select('*')
    .order('name');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display italic font-bold text-parchment mb-4">Discord Servers</h1>
        <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
          <div className="divide-y divide-[#E5DDD0]">
            {(guilds ?? []).length === 0 && (
              <p className="px-5 py-4 text-sm text-muted">No servers registered. All authenticated users can log in.</p>
            )}
            {(guilds ?? []).map(g => (
              <div key={g.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0D0D0D]">{g.name}</p>
                  <p className="text-xs text-muted font-mono">{g.discord_guild_id}</p>
                </div>
                <DestructiveButton
                  label="Remove"
                  confirmLabel="Confirm remove"
                  action={deleteGuild.bind(null, g.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-parchment mb-3">Add server</h2>
        <form action={addGuild} className="bg-cream rounded-xl p-6 space-y-4" style={{ border: '0.5px solid #E5DDD0' }}>
          <div>
            <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Server name</label>
            <Input name="name" placeholder="e.g. BBC" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Discord server ID</label>
            <Input name="discord_guild_id" placeholder="e.g. 1299537647202734163" required />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Add server →</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
