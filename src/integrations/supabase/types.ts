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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      assigned_habits: {
        Row: {
          assigned_at: string
          assigned_by: string
          habit_template_id: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          habit_template_id: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          habit_template_id?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_habits_habit_template_id_fkey"
            columns: ["habit_template_id"]
            isOneToOne: false
            referencedRelation: "habit_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_calls: {
        Row: {
          call_date: string
          conducted_by: string
          created_at: string
          decision_style: string | null
          emotional_baseline: number | null
          goals: string | null
          id: string
          key_challenges: string | null
          leadership_score: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          call_date?: string
          conducted_by: string
          created_at?: string
          decision_style?: string | null
          emotional_baseline?: number | null
          goals?: string | null
          id?: string
          key_challenges?: string | null
          leadership_score?: number | null
          notes?: string | null
          user_id: string
        }
        Update: {
          call_date?: string
          conducted_by?: string
          created_at?: string
          decision_style?: string | null
          emotional_baseline?: number | null
          goals?: string | null
          id?: string
          key_challenges?: string | null
          leadership_score?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          country: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      daily_actions: {
        Row: {
          action_index: number
          completed_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_index: number
          completed_date?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_index?: number
          completed_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_scoreboards: {
        Row: {
          breakdown: Json
          created_at: string
          id: string
          max_score: number
          score_date: string
          total_score: number
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          id?: string
          max_score?: number
          score_date: string
          total_score?: number
          user_id: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          id?: string
          max_score?: number
          score_date?: string
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      decisions: {
        Row: {
          created_at: string
          decided_at: string | null
          deferred_until: string | null
          id: string
          name: string
          priority: number
          responsibility: number
          status: string
          time_to_decide: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          deferred_until?: string | null
          id?: string
          name: string
          priority: number
          responsibility: number
          status?: string
          time_to_decide?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          deferred_until?: string | null
          id?: string
          name?: string
          priority?: number
          responsibility?: number
          status?: string
          time_to_decide?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          assigned_habit_id: string
          completed_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_habit_id: string
          completed_date?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_habit_id?: string
          completed_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_assigned_habit_id_fkey"
            columns: ["assigned_habit_id"]
            isOneToOne: false
            referencedRelation: "assigned_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      input_hesitations: {
        Row: {
          created_at: string
          hesitation_ms: number
          id: string
          input_name: string
          page: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hesitation_ms: number
          id?: string
          input_name: string
          page: string
          user_id: string
        }
        Update: {
          created_at?: string
          hesitation_ms?: number
          id?: string
          input_name?: string
          page?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          mood_score: number | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mood_score?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mood_score?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_prompts: {
        Row: {
          assigned_by: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          prompt_text: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          prompt_text: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          prompt_text?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          id: string
          logged_at: string
          meals: Json | null
          meals_count: number | null
          sleep: number | null
          stress: number | null
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          logged_at?: string
          meals?: Json | null
          meals_count?: number | null
          sleep?: number | null
          stress?: number | null
          user_id: string
          value: number
        }
        Update: {
          id?: string
          logged_at?: string
          meals?: Json | null
          meals_count?: number | null
          sleep?: number | null
          stress?: number | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      native_fcm_tokens: {
        Row: {
          id: string
          platform: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          platform?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          platform?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      people_contacts: {
        Row: {
          created_at: string
          id: string
          insight: string | null
          name: string
          proximity: string
          quality: number
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insight?: string | null
          name: string
          proximity?: string
          quality?: number
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insight?: string | null
          name?: string
          proximity?: string
          quality?: number
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      place_tag_definitions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          label_en: string
          label_fr: string
          risk_level: number
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          label_en: string
          label_fr: string
          risk_level?: number
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          label_en?: string
          label_fr?: string
          risk_level?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          is_disabled: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_disabled?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_disabled?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      relation_quality_history: {
        Row: {
          contact_id: string
          id: string
          note: string | null
          quality: number
          recorded_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          id?: string
          note?: string | null
          quality: number
          recorded_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          id?: string
          note?: string | null
          quality?: number
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relation_quality_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "people_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      scoreboard_criteria: {
        Row: {
          created_at: string
          created_by: string
          criteria_label: string
          criteria_type: string
          id: string
          is_active: boolean
          points: number
          target_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          criteria_label: string
          criteria_type: string
          id?: string
          is_active?: boolean
          points?: number
          target_value?: number
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          criteria_label?: string
          criteria_type?: string
          id?: string
          is_active?: boolean
          points?: number
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      toolbox_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          content_type: string
          description: string | null
          duration: string | null
          external_url: string | null
          id: string
          title: string
          user_id: string
          widget_config: Json | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          content_type: string
          description?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          title: string
          user_id: string
          widget_config?: Json | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          content_type?: string
          description?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          title?: string
          user_id?: string
          widget_config?: Json | null
        }
        Relationships: []
      }
      toolbox_completions: {
        Row: {
          assignment_id: string
          completed_at: string
          feedback: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string
          feedback?: string | null
          id?: string
          status: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string
          feedback?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "toolbox_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          description: string | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          description?: string | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          description?: string | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_location_admin_consent: {
        Row: {
          consent_version: string
          hide_consent_modal: boolean
          responded_at: string | null
          share_places_with_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_version?: string
          hide_consent_modal?: boolean
          responded_at?: string | null
          share_places_with_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_version?: string
          hide_consent_modal?: boolean
          responded_at?: string | null
          share_places_with_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_place_contact_links: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          note: string | null
          user_id: string
          user_place_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          note?: string | null
          user_id: string
          user_place_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id?: string
          user_place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_place_contact_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "people_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_place_contact_links_user_place_id_fkey"
            columns: ["user_place_id"]
            isOneToOne: false
            referencedRelation: "user_places"
            referencedColumns: ["id"]
          },
        ]
      }
      user_place_tag_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          tag_id: string
          user_place_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          tag_id: string
          user_place_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          tag_id?: string
          user_place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_place_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "place_tag_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_place_tag_assignments_user_place_id_fkey"
            columns: ["user_place_id"]
            isOneToOne: false
            referencedRelation: "user_places"
            referencedColumns: ["id"]
          },
        ]
      }
      user_places: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          maps_parsed_at: string | null
          maps_url: string
          name: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          maps_parsed_at?: string | null
          maps_url: string
          name: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          maps_parsed_at?: string | null
          maps_url?: string
          name?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          id: string
          last_heartbeat: string
          page: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          last_heartbeat?: string
          page?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          last_heartbeat?: string
          page?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_all_admins: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      send_admin_push: {
        Args: {
          p_message: string
          p_tag?: string
          p_title: string
          p_url?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
