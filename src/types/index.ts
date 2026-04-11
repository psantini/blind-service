export type BlindStatus = 'setup' | 'active' | 'complete';
export type MemberRole = 'host' | 'participant';
export type Round = 'nose' | 'taste';
export type InputType = 'text' | 'dropdown' | 'numeric' | 'boolean';
export type ScoringType = 'exact' | 'bracket';

export type Bracket = { max_delta: number; points: number };

export interface Profile {
  id: string;
  discord_username: string;
  discord_avatar_url: string | null;
  created_at: string;
}

export interface Blind {
  id: string;
  name: string;
  host_id: string;
  nosing_enabled: boolean;
  status: BlindStatus;
  created_at: string;
}

export interface BlindMember {
  id: string;
  blind_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Sample {
  id: string;
  blind_id: string;
  label: string;
  display_order: number;
  bottle_image_url: string | null;
}

export interface Attribute {
  id: string;
  sample_id: string;
  name: string;
  value: string;
  input_type: InputType;
  scoring_type: ScoringType;
  brackets: Bracket[] | null;
}

export interface Question {
  id: string;
  attribute_id: string;
  round: Round;
}

export interface SampleReveal {
  id: string;
  sample_id: string;
  user_id: string;
  revealed_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  value: string | null;
  submitted_at: string | null;
  fuzzy_flagged: boolean;
  host_approved: boolean | null;
  points_earned: number | null;
}

export interface AllTimeStats {
  user_id: string;
  discord_username: string;
  discord_avatar_url: string | null;
  blinds_participated: number;
  blinds_hosted: number;
  total_points: number;
  avg_points_per_answer: number;
  total_nose_points: number;
  total_taste_points: number;
}
