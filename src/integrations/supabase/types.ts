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
      decisions: {
        Row: {
          created_at: string
          decided_at: string | null
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
          quality?: number
          role?: string | null
          updated_at?: string
          user_id?: string
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
      relation_quality_history: {
        Row: {
          contact_id: string
          id: string
          quality: number
          recorded_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          id?: string
          quality: number
          recorded_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          id?: string
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
