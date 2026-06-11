import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { LoginButtons } from '@/components/auth/LoginButtons';
import { redeemInvite } from './actions';

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect('/');

  const adminClient = createAdminClient();

  const { data: invite } = await adminClient
    .from('group_invites')
    .select('id, group_id, max_uses, use_count, expires_at, group:groups(name)')
    .eq('token', token)
    .single();

  if (!invite) {
    return <JoinError message="This invite link is invalid." />;
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <JoinError message="This invite link has expired." />;
  }

  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return <JoinError message="This invite link has reached its maximum uses." />;
  }

  const groupName = (invite.group as any)?.name ?? 'a group';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div
            className="w-12 h-12 rounded-full bg-amber flex items-center justify-center mx-auto mb-4 font-display italic font-bold text-black"
            style={{ fontSize: 16 }}
          >
            BBC
          </div>
          <h1 className="text-2xl font-display italic font-bold text-parchment mb-2">
            Join {groupName}
          </h1>
          <p className="text-smoke text-sm mb-8">Sign in to accept your invitation.</p>
          <LoginButtons next={`/join?token=${token}`} />
        </div>
      </div>
    );
  }

  // User is logged in — show confirmation and redeem on click
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-display italic font-bold text-parchment mb-2">
          Join {groupName}
        </h1>
        <p className="text-smoke text-sm mb-8">
          You&apos;ve been invited to join <span className="text-parchment font-medium">{groupName}</span>.
        </p>
        <form action={redeemInvite.bind(null, token)}>
          <button
            type="submit"
            className="bg-amber hover:bg-amber/80 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Accept invitation →
          </button>
        </form>
      </div>
    </div>
  );
}

function JoinError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-display italic font-bold text-parchment mb-2">Invalid invite</h1>
        <p className="text-smoke text-sm">{message}</p>
      </div>
    </div>
  );
}
