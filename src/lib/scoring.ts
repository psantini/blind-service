import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Scores all unscored submitted answers for one user on one sample.
// Must be called with an admin client — scoring updates submitted answers,
// which RLS restricts to host-only for session clients.
export async function scoreSampleAnswers(
  supabase: SupabaseClient,
  sampleId: string,
  userId: string,
): Promise<void> {
  const { data: finishedAttr } = await supabase
    .from('attributes')
    .select('value')
    .eq('sample_id', sampleId)
    .eq('name', 'finished')
    .maybeSingle();

  const hostFinished = finishedAttr?.value?.trim().toLowerCase() ?? null;

  const { data: attrRows } = await supabase
    .from('attributes')
    .select('id, name, value, input_type, scoring_type, brackets')
    .eq('sample_id', sampleId);

  if (!attrRows || attrRows.length === 0) return;

  const { data: questionRows } = await supabase
    .from('questions')
    .select('id, attribute_id')
    .in('attribute_id', attrRows.map(a => a.id));

  if (!questionRows || questionRows.length === 0) return;

  const attrById = Object.fromEntries(attrRows.map(a => [a.id, a]));
  const questionAttrMap = Object.fromEntries(
    questionRows.map(q => [q.id, attrById[(q as any).attribute_id]])
  );

  const { data: answers } = await supabase
    .from('answers')
    .select('id, question_id, value')
    .eq('user_id', userId)
    .not('submitted_at', 'is', null)
    .eq('fuzzy_flagged', false)
    .is('points_earned', null)
    .in('question_id', Object.keys(questionAttrMap));

  if (!answers || answers.length === 0) return;

  await Promise.all(answers.map(async answer => {
    const attr = questionAttrMap[(answer as any).question_id];
    if (!attr) return;

    const guess = answer.value?.trim().toLowerCase() ?? null;
    const actual = attr.value?.trim().toLowerCase() ?? '';

    // finish_type only scores if the host confirmed this whiskey was finished
    if (attr.name === 'finish_type' && hostFinished !== 'yes') {
      await supabase.from('answers').update({ points_earned: 0, fuzzy_flagged: false }).eq('id', answer.id);
      return;
    }

    if (attr.scoring_type === 'exact') {
      const brackets = attr.brackets as Array<{ max_delta: number; points: number }> | null;
      const exactPts = brackets && brackets.length > 0 ? brackets[0].points : 3;

      if (!guess) {
        await supabase.from('answers').update({ points_earned: 0, fuzzy_flagged: false }).eq('id', answer.id);
      } else if (guess === actual) {
        await supabase.from('answers').update({ points_earned: exactPts, fuzzy_flagged: false }).eq('id', answer.id);
      } else if (attr.input_type !== 'boolean' && levenshtein(guess, actual) <= 3) {
        await supabase.from('answers').update({ fuzzy_flagged: true, points_earned: null }).eq('id', answer.id);
      } else {
        await supabase.from('answers').update({ points_earned: 0, fuzzy_flagged: false }).eq('id', answer.id);
      }
    } else if (attr.scoring_type === 'bracket') {
      if (!guess) {
        await supabase.from('answers').update({ points_earned: 0, fuzzy_flagged: false }).eq('id', answer.id);
      } else {
        const brackets = attr.brackets as Array<{ max_delta: number; points: number }> | null;
        const delta = Math.abs(parseFloat(guess) - parseFloat(actual));
        let points = 0;
        for (const bracket of brackets ?? []) {
          if (delta <= bracket.max_delta) { points = bracket.points; break; }
        }
        await supabase.from('answers').update({ points_earned: points, fuzzy_flagged: false }).eq('id', answer.id);
      }
    }
  }));
}

// Resets scores for all submitted answers on a sample then rescores per user.
// Used by the host setup flow when sample attribute values are updated.
export async function rescoreSample(sampleId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: attrRows } = await supabase
    .from('attributes')
    .select('id')
    .eq('sample_id', sampleId);

  if (!attrRows || attrRows.length === 0) return;

  const { data: questionRows } = await supabase
    .from('questions')
    .select('id')
    .in('attribute_id', attrRows.map(a => a.id));

  if (!questionRows || questionRows.length === 0) return;

  const questionIds = questionRows.map(q => q.id);

  // Reset all submitted answers — clears previous scores and any pending host review
  await supabase
    .from('answers')
    .update({ points_earned: null, fuzzy_flagged: false, host_approved: null })
    .in('question_id', questionIds)
    .not('submitted_at', 'is', null);

  const { data: submittedAnswers } = await supabase
    .from('answers')
    .select('user_id')
    .in('question_id', questionIds)
    .not('submitted_at', 'is', null);

  const userIds = [...new Set((submittedAnswers ?? []).map((a: any) => a.user_id as string))];

  for (const userId of userIds) {
    await scoreSampleAnswers(supabase, sampleId, userId);
  }
}
