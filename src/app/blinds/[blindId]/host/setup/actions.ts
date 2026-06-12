'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_AGE_BRACKETS, DEFAULT_PROOF_BRACKETS } from '@/lib/constants/defaultBrackets';
import { rescoreSample } from '@/lib/scoring';

export interface AttributeInput {
  name: string;
  value: string;
  inputType: 'text' | 'dropdown' | 'numeric' | 'boolean';
  scoringType: 'exact' | 'bracket';
  brackets: Array<{ max_delta: number; points: number }> | null;
  rounds: Array<'nose' | 'taste'>;
}

export async function saveSample(
  blindId: string,
  sampleId: string | null,
  data: {
    label: string;
    displayOrder: number;
    bottleImageUrl?: string | null;
    attributes: AttributeInput[];
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (sampleId) {
    // Update sample metadata
    await supabase
      .from('samples')
      .update({
        label: data.label,
        display_order: data.displayOrder,
        bottle_image_url: data.bottleImageUrl ?? null,
      })
      .eq('id', sampleId);

    // Fetch existing attributes and their questions
    const { data: existingAttrs } = await supabase
      .from('attributes')
      .select('id, name, questions(id, round)')
      .eq('sample_id', sampleId);

    const existingByName: Record<string, { id: string; questions: Array<{ id: string; round: string }> }> =
      Object.fromEntries((existingAttrs ?? []).map((a: any) => [a.name, { id: a.id, questions: a.questions ?? [] }]));

    const newNames = new Set(data.attributes.map(a => a.name));

    // Remove attributes that are no longer in the new set (cascades to questions + answers)
    for (const [name, existing] of Object.entries(existingByName)) {
      if (!newNames.has(name)) {
        await supabase.from('attributes').delete().eq('id', existing.id);
      }
    }

    // Upsert each attribute
    for (const attr of data.attributes) {
      let attrId: string;

      if (existingByName[attr.name]) {
        // Update existing attribute in place — preserves question/answer rows
        attrId = existingByName[attr.name].id;
        await supabase
          .from('attributes')
          .update({
            value: attr.value,
            input_type: attr.inputType,
            scoring_type: attr.scoringType,
            brackets: attr.brackets,
          })
          .eq('id', attrId);

        // Sync rounds: add new, remove dropped
        const existingQuestions = existingByName[attr.name].questions;
        const existingRounds = new Set(existingQuestions.map(q => q.round));
        const newRounds = new Set<string>(attr.rounds);

        for (const q of existingQuestions) {
          if (!newRounds.has(q.round)) {
            await supabase.from('questions').delete().eq('id', q.id);
          }
        }
        for (const round of attr.rounds) {
          if (!existingRounds.has(round)) {
            await supabase.from('questions').insert({ attribute_id: attrId, round });
          }
        }
      } else {
        // New attribute — insert with questions
        const { data: newAttr } = await supabase
          .from('attributes')
          .insert({
            sample_id: sampleId,
            name: attr.name,
            value: attr.value,
            input_type: attr.inputType,
            scoring_type: attr.scoringType,
            brackets: attr.brackets,
          })
          .select('id')
          .single();

        if (!newAttr) throw new Error('Failed to create attribute');
        attrId = newAttr.id;

        if (attr.rounds.length > 0) {
          await supabase
            .from('questions')
            .insert(attr.rounds.map(round => ({ attribute_id: attrId, round })));
        }
      }
    }

    // Rescore all submitted answers with the updated attribute values
    await rescoreSample(sampleId);
    revalidatePath('/stats');
  } else {
    // Insert new sample
    const { data: sample } = await supabase
      .from('samples')
      .insert({
        blind_id: blindId,
        label: data.label,
        display_order: data.displayOrder,
        bottle_image_url: data.bottleImageUrl ?? null,
      })
      .select('id')
      .single();

    if (!sample) throw new Error('Failed to create sample');
    sampleId = sample.id;

    // Insert attributes + questions
    for (const attr of data.attributes) {
      const { data: attribute } = await supabase
        .from('attributes')
        .insert({
          sample_id: sampleId,
          name: attr.name,
          value: attr.value,
          input_type: attr.inputType,
          scoring_type: attr.scoringType,
          brackets: attr.brackets,
        })
        .select('id')
        .single();

      if (!attribute) throw new Error('Failed to create attribute');

      if (attr.rounds.length > 0) {
        await supabase
          .from('questions')
          .insert(attr.rounds.map(round => ({ attribute_id: attribute.id, round })));
      }
    }
  }

  revalidatePath(`/blinds/${blindId}/host/setup`);
  return sampleId;
}

export async function deleteSample(blindId: string, sampleId: string) {
  const supabase = await createClient();
  await supabase.from('samples').delete().eq('id', sampleId);
  revalidatePath(`/blinds/${blindId}/host/setup`);
}

export async function activateBlind(blindId: string): Promise<{ redirectTo: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase
    .from('blinds')
    .update({ status: 'active' })
    .eq('id', blindId);

  return { redirectTo: `/blinds/${blindId}/host` };
}
