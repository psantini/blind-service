'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { DEFAULT_AGE_BRACKETS, DEFAULT_PROOF_BRACKETS } from '@/lib/constants/defaultBrackets';

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
    // Delete existing attributes (cascade deletes questions too)
    await supabase.from('attributes').delete().eq('sample_id', sampleId);

    // Update sample
    await supabase
      .from('samples')
      .update({
        label: data.label,
        display_order: data.displayOrder,
        bottle_image_url: data.bottleImageUrl ?? null,
      })
      .eq('id', sampleId);
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
  }

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

  revalidatePath(`/blinds/${blindId}/host/setup`);
  return sampleId;
}

export async function deleteSample(blindId: string, sampleId: string) {
  const supabase = await createClient();
  await supabase.from('samples').delete().eq('id', sampleId);
  revalidatePath(`/blinds/${blindId}/host/setup`);
}

export async function activateBlind(blindId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase
    .from('blinds')
    .update({ status: 'active' })
    .eq('id', blindId);

  redirect(`/blinds/${blindId}/host`);
}

export async function uploadBottleImage(blindId: string, file: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const imageFile = file.get('file') as File;
  const ext = imageFile.name.split('.').pop();
  const path = `${blindId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('bottle-images')
    .upload(path, imageFile, { upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('bottle-images')
    .getPublicUrl(path);

  return publicUrl;
}
