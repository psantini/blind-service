import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DiscordLoginButton } from '@/components/auth/DiscordLoginButton';

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-4xl font-bold text-stone-900 mb-2">Whiskey Blind</h1>
        <p className="text-stone-500 mb-10">Blind tasting for the group</p>

        {error === 'auth_failed' && (
          <p className="text-red-600 text-sm mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Login failed. Please try again.
          </p>
        )}

        <DiscordLoginButton />
      </div>
    </div>
  );
}
