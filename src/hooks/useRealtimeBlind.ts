'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UseHostRealtimeOptions {
  blindId: string;
  sampleIds: string[];
  onSubmission?: (userId: string, sampleId: string) => void;
  onFuzzyFlag?: (answer: any) => void;
}

export function useHostRealtime({ blindId, sampleIds, onSubmission, onFuzzyFlag }: UseHostRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient();

    const broadcastChannel = supabase
      .channel(`blind:${blindId}`)
      .on('broadcast', { event: 'MEMBER_SUBMITTED' }, ({ payload }) => {
        onSubmission?.(payload.userId, payload.sampleId);
      })
      .subscribe();

    const dbChannel = supabase
      .channel(`blind:${blindId}:host`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sample_reveals',
          filter: sampleIds.length > 0 ? `sample_id=in.(${sampleIds.join(',')})` : undefined,
        },
        (payload: any) => {
          onSubmission?.(payload.new.user_id, payload.new.sample_id);
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'answers',
        },
        (payload: any) => {
          if (payload.new.fuzzy_flagged && payload.new.host_approved === null) {
            onFuzzyFlag?.(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(broadcastChannel);
      void supabase.removeChannel(dbChannel);
    };
  }, [blindId, sampleIds.join(',')]);
}

interface UseParticipantRealtimeOptions {
  blindId: string;
  currentUserId: string;
  submittedSampleIds: Set<string>;
  onPendingScoreResolved?: (answerId: string, pointsEarned: number) => void;
  onMemberSubmitted?: (userId: string, sampleLabel: string) => void;
}

export function useParticipantRealtime({
  blindId,
  currentUserId,
  submittedSampleIds,
  onPendingScoreResolved,
  onMemberSubmitted,
}: UseParticipantRealtimeOptions) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`blind:${blindId}`)
      .on('broadcast', { event: 'ADVANCE_TO_SAMPLE' }, ({ payload }) => {
        if (!submittedSampleIds.has(payload.sampleId)) {
          router.push(`/blinds/${blindId}/taste/${payload.sampleId}`);
        }
      })
      .on('broadcast', { event: 'BLIND_COMPLETE' }, () => {
        router.push(`/blinds/${blindId}/leaderboard`);
      })
      .on('broadcast', { event: 'FUZZY_REVIEWED' }, ({ payload }) => {
        if (payload.userId === currentUserId) {
          onPendingScoreResolved?.(payload.answerId, payload.pointsEarned);
        }
      })
      .on('broadcast', { event: 'MEMBER_SUBMITTED' }, ({ payload }) => {
        if (payload.userId !== currentUserId) {
          onMemberSubmitted?.(payload.userId, payload.sampleLabel);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [blindId, currentUserId]);
}
