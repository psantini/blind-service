import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DiscordLoginButton } from '@/components/auth/DiscordLoginButton';

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  const { error, next } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-4xl font-display italic font-bold text-parchment mb-2">Whiskey Blind</h1>
        <p className="text-smoke mb-10">Blind tasting for the group</p>

        {error === 'auth_failed' && (
          <p className="text-red-400 text-sm mb-6 bg-[#1A0A0A] border border-[#3A1A1A] rounded-lg px-4 py-3">
            Login failed. Please try again.
          </p>
        )}

        <DiscordLoginButton next={next} />
      </div>
    </div>
  );
}
