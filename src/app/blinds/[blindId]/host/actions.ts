'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function reviewFuzzyAnswer(blindId: string, answerId: string, approved: boolean) {
  const supabase = await createClient();

  // Look up the attribute's exact points (stored in brackets[0].points, default 3)
  let exactPts = 3;
  if (approved) {
    const { data: answer } = await supabase
      .from('answers')
      .select(`question:questions!question_id ( attribute:attributes!attribute_id ( brackets ) )`)
      .eq('id', answerId)
      .single();

    const brackets = (answer?.question as any)?.attribute?.brackets;
    if (Array.isArray(brackets) && brackets.length > 0) {
      exactPts = brackets[0].points ?? 3;
    }
  }

  await supabase
    .from('answers')
    .update({
      host_approved: approved,
      points_earned: approved ? exactPts : 0,
    })
    .eq('id', answerId);

  revalidatePath(`/blinds/${blindId}/host`);
  revalidatePath('/stats');
}

export async function completeBlind(blindId: string): Promise<{ redirectTo: string }> {
  const supabase = await createClient();

  await supabase
    .from('blinds')
    .update({ status: 'complete' })
    .eq('id', blindId);

  revalidatePath('/stats');
  return { redirectTo: `/blinds/${blindId}/leaderboard` };
}
