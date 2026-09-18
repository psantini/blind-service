export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advent_assignments: {
        Row: {
          advent_calendar_id: string
          contributor_user_id: string
          day: number | null
          id: string
          letter: string
          sample_id: string
        }
        Insert: {
          advent_calendar_id: string
          contributor_user_id: string
          day?: number | null
          id?: string
          letter: string
          sample_id: string
        }
        Update: {
          advent_calendar_id?: string
          contributor_user_id?: string
          day?: number | null
          id?: string
          letter?: string
          sample_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advent_assignments_advent_calendar_id_fkey"
            columns: ["advent_calendar_id"]
            isOneToOne: false
            referencedRelation: "advent_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advent_assignments_contributor_user_id_fkey"
            columns: ["contributor_user_id"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "advent_assignments_contributor_user_id_fkey"
            columns: ["contributor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advent_assignments_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: true
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      advent_calendars: {
        Row: {
          blind_id: string
          created_at: string
          id: string
          invite_token: string
          question_templates: Json
          status: string
        }
        Insert: {
          blind_id: string
          created_at?: string
          id?: string
          invite_token?: string
          question_templates?: Json
          status?: string
        }
        Update: {
          blind_id?: string
          created_at?: string
          id?: string
          invite_token?: string
          question_templates?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "advent_calendars_blind_id_fkey"
            columns: ["blind_id"]
            isOneToOne: true
            referencedRelation: "blinds"
            referencedColumns: ["id"]
          },
        ]
      }
      advent_contributor_manifest: {
        Row: {
          advent_calendar_id: string
          bottles_expected: number
          has_submitted: boolean
          id: string
          user_id: string
        }
        Insert: {
          advent_calendar_id: string
          bottles_expected: number
          has_submitted?: boolean
          id?: string
          user_id: string
        }
        Update: {
          advent_calendar_id?: string
          bottles_expected?: number
          has_submitted?: boolean
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advent_contributor_manifest_advent_calendar_id_fkey"
            columns: ["advent_calendar_id"]
            isOneToOne: false
            referencedRelation: "advent_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advent_contributor_manifest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "advent_contributor_manifest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          fuzzy_flagged: boolean
          host_approved: boolean | null
          id: string
          points_earned: number | null
          question_id: string
          submitted_at: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          fuzzy_flagged?: boolean
          host_approved?: boolean | null
          id?: string
          points_earned?: number | null
          question_id: string
          submitted_at?: string | null
          user_id: string
          value?: string | null
        }
        Update: {
          fuzzy_flagged?: boolean
          host_approved?: boolean | null
          id?: string
          points_earned?: number | null
          question_id?: string
          submitted_at?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attributes: {
        Row: {
          brackets: Json | null
          id: string
          input_type: string
          name: string
          sample_id: string
          scoring_type: string
          value: string
        }
        Insert: {
          brackets?: Json | null
          id?: string
          input_type: string
          name: string
          sample_id: string
          scoring_type: string
          value: string
        }
        Update: {
          brackets?: Json | null
          id?: string
          input_type?: string
          name?: string
          sample_id?: string
          scoring_type?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "attributes_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      blind_members: {
        Row: {
          blind_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          blind_id: string
          id?: string
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          blind_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blind_members_blind_id_fkey"
            columns: ["blind_id"]
            isOneToOne: false
            referencedRelation: "blinds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blind_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blind_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blinds: {
        Row: {
          created_at: string
          group_id: string | null
          host_id: string
          id: string
          name: string
          nosing_enabled: boolean
          round_order: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          host_id: string
          id?: string
          name: string
          nosing_enabled?: boolean
          round_order?: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          host_id?: string
          id?: string
          name?: string
          nosing_enabled?: boolean
          round_order?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "blinds_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blinds_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blinds_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          group_id: string
          id: string
          max_uses: number | null
          token: string
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          group_id: string
          id?: string
          max_uses?: number | null
          token?: string
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          group_id?: string
          id?: string
          max_uses?: number | null
          token?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "group_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          discord_guild_id: string | null
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          discord_guild_id?: string | null
          icon_url?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          discord_guild_id?: string | null
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      guilds: {
        Row: {
          created_at: string
          discord_guild_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          discord_guild_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          discord_guild_id?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          discord_avatar_url: string | null
          discord_username: string
          id: string
          is_super_admin: boolean
        }
        Insert: {
          created_at?: string
          discord_avatar_url?: string | null
          discord_username: string
          id: string
          is_super_admin?: boolean
        }
        Update: {
          created_at?: string
          discord_avatar_url?: string | null
          discord_username?: string
          id?: string
          is_super_admin?: boolean
        }
        Relationships: []
      }
      questions: {
        Row: {
          attribute_id: string
          id: string
          round: string
        }
        Insert: {
          attribute_id: string
          id?: string
          round: string
        }
        Update: {
          attribute_id?: string
          id?: string
          round?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_nosing_submissions: {
        Row: {
          sample_id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          sample_id: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          sample_id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_nosing_submissions_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_reveals: {
        Row: {
          id: string
          revealed_at: string
          sample_id: string
          user_id: string
        }
        Insert: {
          id?: string
          revealed_at?: string
          sample_id: string
          user_id: string
        }
        Update: {
          id?: string
          revealed_at?: string
          sample_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_reveals_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_reveals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "all_time_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sample_reveals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          blind_id: string
          bottle_image_url: string | null
          display_order: number | null
          id: string
          label: string
        }
        Insert: {
          blind_id: string
          bottle_image_url?: string | null
          display_order?: number | null
          id?: string
          label: string
        }
        Update: {
          blind_id?: string
          bottle_image_url?: string | null
          display_order?: number | null
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_blind_id_fkey"
            columns: ["blind_id"]
            isOneToOne: false
            referencedRelation: "blinds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      all_time_stats: {
        Row: {
          avg_points_per_answer: number | null
          blinds_hosted: number | null
          blinds_participated: number | null
          discord_avatar_url: string | null
          discord_username: string | null
          total_nose_points: number | null
          total_points: number | null
          total_taste_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      blind_id_for_advent: { Args: { p_advent_id: string }; Returns: string }
      blind_id_for_attribute: {
        Args: { p_attribute_id: string }
        Returns: string
      }
      blind_id_for_question: {
        Args: { p_question_id: string }
        Returns: string
      }
      blind_id_for_sample: { Args: { p_sample_id: string }; Returns: string }
      daitch_mokotoff: { Args: { "": string }; Returns: string[] }
      dmetaphone: { Args: { "": string }; Returns: string }
      dmetaphone_alt: { Args: { "": string }; Returns: string }
      has_user_revealed_sample: {
        Args: { p_sample_id: string }
        Returns: boolean
      }
      is_blind_host: { Args: { p_blind_id: string }; Returns: boolean }
      is_blind_member: { Args: { p_blind_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      lock_and_reveal_sample: {
        Args: { p_sample_id: string; p_user_id: string }
        Returns: undefined
      }
      lock_and_submit_nosing: {
        Args: { p_sample_id: string; p_user_id: string }
        Returns: undefined
      }
      sample_id_for_question: {
        Args: { p_question_id: string }
        Returns: string
      }
      score_sample_answers: {
        Args: { p_sample_id: string; p_user_id: string }
        Returns: undefined
      }
      soundex: { Args: { "": string }; Returns: string }
      text_soundex: { Args: { "": string }; Returns: string }
      user_in_group: { Args: { p_group_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
