import { createClient } from '@/lib/supabase/client';

export type BlindEvent =
  | { type: 'ADVANCE_TO_SAMPLE'; sampleId: string; sampleLabel: string }
  | { type: 'BLIND_COMPLETE'; blindId: string }
  | { type: 'MEMBER_SUBMITTED'; userId: string; sampleId: string; sampleLabel: string; username: string }
  | { type: 'FUZZY_REVIEWED'; answerId: string; userId: string; approved: boolean; pointsEarned: number };

export function getBlindChannel(blindId: string) {
  const supabase = createClient();
  return supabase.channel(`blind:${blindId}`);
}

export function getHostChannel(blindId: string) {
  const supabase = createClient();
  return supabase.channel(`blind:${blindId}:host`);
}
