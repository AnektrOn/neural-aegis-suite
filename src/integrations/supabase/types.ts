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
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string
          detail: Json
          id: string
          is_resolved: boolean
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title_en: string
          title_fr: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          detail?: Json
          id?: string
          is_resolved?: boolean
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title_en: string
          title_fr: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          detail?: Json
          id?: string
          is_resolved?: boolean
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title_en?: string
          title_fr?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_import_runs: {
        Row: {
          created_at: string
          created_by: string
          dry_run: boolean
          id: string
          payload: Json
          status: string
          summary: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          dry_run?: boolean
          id?: string
          payload?: Json
          status?: string
          summary?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          dry_run?: boolean
          id?: string
          payload?: Json
          status?: string
          summary?: Json
        }
        Relationships: []
      }
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
      aegis_health_scores: {
        Row: {
          archetype_coherence: number
          computed_at: string
          decision_score: number
          habit_score: number
          id: string
          journal_score: number
          log_regularity: number
          mood_score: number
          overall_score: number
          relation_score: number
          score_date: string
          user_id: string
        }
        Insert: {
          archetype_coherence?: number
          computed_at?: string
          decision_score?: number
          habit_score?: number
          id?: string
          journal_score?: number
          log_regularity?: number
          mood_score?: number
          overall_score?: number
          relation_score?: number
          score_date: string
          user_id: string
        }
        Update: {
          archetype_coherence?: number
          computed_at?: string
          decision_score?: number
          habit_score?: number
          id?: string
          journal_score?: number
          log_regularity?: number
          mood_score?: number
          overall_score?: number
          relation_score?: number
          score_date?: string
          user_id?: string
        }
        Relationships: []
      }
      aegis_rune_collections: {
        Row: {
          code: string
          created_at: string
          description_i18n: Json
          icon_key: string
          id: string
          is_active: boolean
          name_i18n: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description_i18n?: Json
          icon_key?: string
          id?: string
          is_active?: boolean
          name_i18n?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_i18n?: Json
          icon_key?: string
          id?: string
          is_active?: boolean
          name_i18n?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      aegis_rune_principles: {
        Row: {
          bg_class: string
          code: string
          collection_id: string | null
          created_at: string
          description_i18n: Json
          glyph_svg: string | null
          icon_key: string
          id: string
          is_active: boolean
          name_i18n: Json
          pulses_to_unlock: number
          quote_i18n: Json
          sort_order: number
          text_class: string
          updated_at: string
        }
        Insert: {
          bg_class?: string
          code: string
          collection_id?: string | null
          created_at?: string
          description_i18n?: Json
          glyph_svg?: string | null
          icon_key?: string
          id?: string
          is_active?: boolean
          name_i18n?: Json
          pulses_to_unlock?: number
          quote_i18n?: Json
          sort_order?: number
          text_class?: string
          updated_at?: string
        }
        Update: {
          bg_class?: string
          code?: string
          collection_id?: string | null
          created_at?: string
          description_i18n?: Json
          glyph_svg?: string | null
          icon_key?: string
          id?: string
          is_active?: boolean
          name_i18n?: Json
          pulses_to_unlock?: number
          quote_i18n?: Json
          sort_order?: number
          text_class?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aegis_rune_principles_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "aegis_rune_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      aegis_synapse_cards: {
        Row: {
          archetype_targets: string[]
          bullets_i18n: Json
          content_type: string
          course_content_i18n: Json
          course_id: string | null
          created_at: string
          external_key: string | null
          format_i18n: Json
          id: string
          is_active: boolean
          principle_id: string
          problem_i18n: Json
          sort_order: number
          target_user_ids: string[]
          time_label: string
          title_i18n: Json
          updated_at: string
        }
        Insert: {
          archetype_targets?: string[]
          bullets_i18n?: Json
          content_type?: string
          course_content_i18n?: Json
          course_id?: string | null
          created_at?: string
          external_key?: string | null
          format_i18n?: Json
          id?: string
          is_active?: boolean
          principle_id: string
          problem_i18n?: Json
          sort_order?: number
          target_user_ids?: string[]
          time_label?: string
          title_i18n?: Json
          updated_at?: string
        }
        Update: {
          archetype_targets?: string[]
          bullets_i18n?: Json
          content_type?: string
          course_content_i18n?: Json
          course_id?: string | null
          created_at?: string
          external_key?: string | null
          format_i18n?: Json
          id?: string
          is_active?: boolean
          principle_id?: string
          problem_i18n?: Json
          sort_order?: number
          target_user_ids?: string[]
          time_label?: string
          title_i18n?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aegis_synapse_cards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "pulse_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aegis_synapse_cards_principle_id_fkey"
            columns: ["principle_id"]
            isOneToOne: false
            referencedRelation: "aegis_rune_principles"
            referencedColumns: ["id"]
          },
        ]
      }
      aegis_user_card_interactions: {
        Row: {
          action: Database["public"]["Enums"]["aegis_swipe_action"]
          card_id: string
          completed_at: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["aegis_swipe_action"]
          card_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["aegis_swipe_action"]
          card_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aegis_user_card_interactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "aegis_synapse_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      aegis_user_rune_progress: {
        Row: {
          principle_id: string
          pulses_count: number
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          principle_id: string
          pulses_count?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          principle_id?: string
          pulses_count?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aegis_user_rune_progress_principle_id_fkey"
            columns: ["principle_id"]
            isOneToOne: false
            referencedRelation: "aegis_rune_principles"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          created_at: string
          description_en: string | null
          description_fr: string | null
          id: string
          is_active: boolean
          rule_key: string
          severity: string
          threshold_days: number | null
          threshold_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          rule_key: string
          severity: string
          threshold_days?: number | null
          threshold_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          rule_key?: string
          severity?: string
          threshold_days?: number | null
          threshold_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      analysis_results: {
        Row: {
          admin_notes: string | null
          created_at: string
          dimension_scores: Json
          id: string
          session_id: string
          shadow_signals: Json
          strengths_en: string[]
          strengths_fr: string[]
          summary_en: string | null
          summary_fr: string | null
          top_archetypes: string[]
          user_id: string
          watchouts_en: string[]
          watchouts_fr: string[]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          dimension_scores?: Json
          id?: string
          session_id: string
          shadow_signals?: Json
          strengths_en?: string[]
          strengths_fr?: string[]
          summary_en?: string | null
          summary_fr?: string | null
          top_archetypes?: string[]
          user_id: string
          watchouts_en?: string[]
          watchouts_fr?: string[]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          dimension_scores?: Json
          id?: string
          session_id?: string
          shadow_signals?: Json
          strengths_en?: string[]
          strengths_fr?: string[]
          summary_en?: string | null
          summary_fr?: string | null
          top_archetypes?: string[]
          user_id?: string
          watchouts_en?: string[]
          watchouts_fr?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_releases: {
        Row: {
          apk_public_url: string
          apk_storage_path: string
          created_at: string
          created_by: string | null
          file_size_bytes: number | null
          force_update: boolean
          id: string
          is_published: boolean
          min_version_code: number | null
          platform: string
          published_at: string | null
          release_notes: string | null
          sha256: string | null
          updated_at: string
          version_code: number
          version_name: string
        }
        Insert: {
          apk_public_url: string
          apk_storage_path: string
          created_at?: string
          created_by?: string | null
          file_size_bytes?: number | null
          force_update?: boolean
          id?: string
          is_published?: boolean
          min_version_code?: number | null
          platform?: string
          published_at?: string | null
          release_notes?: string | null
          sha256?: string | null
          updated_at?: string
          version_code: number
          version_name: string
        }
        Update: {
          apk_public_url?: string
          apk_storage_path?: string
          created_at?: string
          created_by?: string | null
          file_size_bytes?: number | null
          force_update?: boolean
          id?: string
          is_published?: boolean
          min_version_code?: number | null
          platform?: string
          published_at?: string | null
          release_notes?: string | null
          sha256?: string | null
          updated_at?: string
          version_code?: number
          version_name?: string
        }
        Relationships: []
      }
      app_update_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          release_id: string | null
          user_id: string | null
          version_code: number | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          release_id?: string | null
          user_id?: string | null
          version_code?: number | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          release_id?: string | null
          user_id?: string | null
          version_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_update_events_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "app_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      archetype_profile_snapshots: {
        Row: {
          active_principle: string | null
          admin_notes: string | null
          all_scores: Json
          computed_at: string
          dimension_scores: Json
          dominant_body: string | null
          email: string | null
          id: string
          session_id: string | null
          shadow_scores: Json
          snapshot_version: number
          top_archetypes: Json
          trigger_event: string
          user_id: string
        }
        Insert: {
          active_principle?: string | null
          admin_notes?: string | null
          all_scores?: Json
          computed_at?: string
          dimension_scores?: Json
          dominant_body?: string | null
          email?: string | null
          id?: string
          session_id?: string | null
          shadow_scores?: Json
          snapshot_version?: number
          top_archetypes?: Json
          trigger_event: string
          user_id: string
        }
        Update: {
          active_principle?: string | null
          admin_notes?: string | null
          all_scores?: Json
          computed_at?: string
          dimension_scores?: Json
          dominant_body?: string | null
          email?: string | null
          id?: string
          session_id?: string | null
          shadow_scores?: Json
          snapshot_version?: number
          top_archetypes?: Json
          trigger_event?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archetype_profile_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      archetype_scores: {
        Row: {
          archetype_key: string
          created_at: string
          id: string
          normalized_score: number
          rank: number
          raw_score: number
          session_id: string
          user_id: string
        }
        Insert: {
          archetype_key: string
          created_at?: string
          id?: string
          normalized_score?: number
          rank?: number
          raw_score?: number
          session_id: string
          user_id: string
        }
        Update: {
          archetype_key?: string
          created_at?: string
          id?: string
          normalized_score?: number
          rank?: number
          raw_score?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archetype_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_options: {
        Row: {
          archetype_weights: Json
          created_at: string
          id: string
          label_en: string
          label_fr: string
          polarity_weights: Json
          position: number
          question_id: string
          shadow_weights: Json
          value: number | null
        }
        Insert: {
          archetype_weights?: Json
          created_at?: string
          id?: string
          label_en: string
          label_fr: string
          polarity_weights?: Json
          position: number
          question_id: string
          shadow_weights?: Json
          value?: number | null
        }
        Update: {
          archetype_weights?: Json
          created_at?: string
          id?: string
          label_en?: string
          label_fr?: string
          polarity_weights?: Json
          position?: number
          question_id?: string
          shadow_weights?: Json
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          created_at: string
          dimension: string | null
          helper_en: string | null
          helper_fr: string | null
          house: number | null
          id: string
          is_required: boolean
          meta: Json
          position: number
          prompt_en: string
          prompt_fr: string
          question_type: Database["public"]["Enums"]["assessment_question_type"]
          template_id: string
        }
        Insert: {
          created_at?: string
          dimension?: string | null
          helper_en?: string | null
          helper_fr?: string | null
          house?: number | null
          id?: string
          is_required?: boolean
          meta?: Json
          position: number
          prompt_en: string
          prompt_fr: string
          question_type: Database["public"]["Enums"]["assessment_question_type"]
          template_id: string
        }
        Update: {
          created_at?: string
          dimension?: string | null
          helper_en?: string | null
          helper_fr?: string | null
          house?: number | null
          id?: string
          is_required?: boolean
          meta?: Json
          position?: number
          prompt_en?: string
          prompt_fr?: string
          question_type?: Database["public"]["Enums"]["assessment_question_type"]
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          created_at: string
          id: string
          numeric_value: number | null
          question_id: string
          raw_payload: Json
          selected_option_ids: string[]
          session_id: string
          text_value: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          numeric_value?: number | null
          question_id: string
          raw_payload?: Json
          selected_option_ids?: string[]
          session_id: string
          text_value?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          numeric_value?: number | null
          question_id?: string
          raw_payload?: Json
          selected_option_ids?: string[]
          session_id?: string
          text_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          client_meta: Json
          confidence_score: number | null
          created_at: string
          duration_seconds: number | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["assessment_session_status"]
          submitted_at: string | null
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_meta?: Json
          confidence_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_session_status"]
          submitted_at?: string | null
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_meta?: Json
          confidence_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_session_status"]
          submitted_at?: string | null
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          created_at: string
          description_en: string | null
          description_fr: string | null
          id: string
          is_active: boolean
          slug: string
          title_en: string
          title_fr: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          slug: string
          title_en: string
          title_fr: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          title_en?: string
          title_fr?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      assigned_habits: {
        Row: {
          assigned_at: string
          assigned_by: string
          duration_override_min: number | null
          habit_template_id: string | null
          id: string
          is_active: boolean
          toolbox_assignment_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          duration_override_min?: number | null
          habit_template_id?: string | null
          id?: string
          is_active?: boolean
          toolbox_assignment_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          duration_override_min?: number | null
          habit_template_id?: string | null
          id?: string
          is_active?: boolean
          toolbox_assignment_id?: string | null
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
          {
            foreignKeyName: "assigned_habits_toolbox_assignment_id_fkey"
            columns: ["toolbox_assignment_id"]
            isOneToOne: false
            referencedRelation: "toolbox_assignments"
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
      cartography_bundle_sections: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          markdown: string
          report_code: string
          section_key: string
          sort_order: number
          source_path: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          markdown: string
          report_code?: string
          section_key: string
          sort_order?: number
          source_path?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          markdown?: string
          report_code?: string
          section_key?: string
          sort_order?: number
          source_path?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartography_bundle_sections_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "cartography_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      cartography_bundles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          meta: Json
          mode: string
          pole: string
          published_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          meta?: Json
          mode: string
          pole: string
          published_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          meta?: Json
          mode?: string
          pole?: string
          published_at?: string | null
          status?: string
          updated_at?: string
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
      content_type_definitions: {
        Row: {
          category: string
          config_schema: Json
          created_at: string
          created_by: string | null
          default_title_en: string
          default_title_fr: string
          description_en: string | null
          description_fr: string | null
          icon: string
          id: string
          label_en: string
          label_fr: string
          renderer_kind: string
          sample_config: Json
          slug: string
          status: string
          ui_blueprint: Json
          updated_at: string
        }
        Insert: {
          category?: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          default_title_en?: string
          default_title_fr?: string
          description_en?: string | null
          description_fr?: string | null
          icon?: string
          id?: string
          label_en: string
          label_fr: string
          renderer_kind?: string
          sample_config?: Json
          slug: string
          status?: string
          ui_blueprint?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          default_title_en?: string
          default_title_fr?: string
          description_en?: string | null
          description_fr?: string | null
          icon?: string
          id?: string
          label_en?: string
          label_fr?: string
          renderer_kind?: string
          sample_config?: Json
          slug?: string
          status?: string
          ui_blueprint?: Json
          updated_at?: string
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
      deepdive_responses: {
        Row: {
          created_at: string
          id: string
          numeric_value: number | null
          option_codes: string[]
          question_code: string
          text_value: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          numeric_value?: number | null
          option_codes?: string[]
          question_code: string
          text_value?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          numeric_value?: number | null
          option_codes?: string[]
          question_code?: string
          text_value?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drive_folder_cache: {
        Row: {
          created_at: string
          drive_id: string
          name: string
          parent_id: string
        }
        Insert: {
          created_at?: string
          drive_id: string
          name: string
          parent_id: string
        }
        Update: {
          created_at?: string
          drive_id?: string
          name?: string
          parent_id?: string
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
          archetype_targets: string[]
          category: string
          created_at: string
          created_by: string
          description: string | null
          description_i18n: Json
          external_key: string | null
          id: string
          is_active: boolean
          name: string
          name_i18n: Json
          shadow_targets: string[]
        }
        Insert: {
          archetype_targets?: string[]
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          description_i18n?: Json
          external_key?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_i18n?: Json
          shadow_targets?: string[]
        }
        Update: {
          archetype_targets?: string[]
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          description_i18n?: Json
          external_key?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_i18n?: Json
          shadow_targets?: string[]
        }
        Relationships: []
      }
      houses72_responses: {
        Row: {
          answered_at: string
          house: number
          id: string
          intensity: number
          question_position: number
          selected_option_position: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          house: number
          id?: string
          intensity?: number
          question_position: number
          selected_option_position: number
          user_id: string
        }
        Update: {
          answered_at?: string
          house?: number
          id?: string
          intensity?: number
          question_position?: number
          selected_option_position?: number
          user_id?: string
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
      journal_prompt_templates: {
        Row: {
          archetype_targets: string[]
          created_at: string
          created_by: string
          duration: string | null
          external_key: string | null
          id: string
          is_active: boolean
          prompt_text: string
          prompt_text_i18n: Json
          shadow_targets: string[]
          title: string
          title_i18n: Json
          updated_at: string
        }
        Insert: {
          archetype_targets?: string[]
          created_at?: string
          created_by: string
          duration?: string | null
          external_key?: string | null
          id?: string
          is_active?: boolean
          prompt_text: string
          prompt_text_i18n?: Json
          shadow_targets?: string[]
          title: string
          title_i18n?: Json
          updated_at?: string
        }
        Update: {
          archetype_targets?: string[]
          created_at?: string
          created_by?: string
          duration?: string | null
          external_key?: string | null
          id?: string
          is_active?: boolean
          prompt_text?: string
          prompt_text_i18n?: Json
          shadow_targets?: string[]
          title?: string
          title_i18n?: Json
          updated_at?: string
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
          prompt_text_i18n: Json
          template_id: string | null
          user_id: string
        }
        Insert: {
          assigned_by: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          prompt_text: string
          prompt_text_i18n?: Json
          template_id?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          prompt_text?: string
          prompt_text_i18n?: Json
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_prompts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "journal_prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      library_video_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_video_assignments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "library_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      library_videos: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          description_i18n: Json
          drive_file_id: string | null
          external_url: string
          id: string
          library_scope: string
          meta: Json
          provider: string
          title: string
          title_i18n: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          description_i18n?: Json
          drive_file_id?: string | null
          external_url: string
          id?: string
          library_scope: string
          meta?: Json
          provider?: string
          title: string
          title_i18n?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          description_i18n?: Json
          drive_file_id?: string | null
          external_url?: string
          id?: string
          library_scope?: string
          meta?: Json
          provider?: string
          title?: string
          title_i18n?: Json
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
      newsletter_editions: {
        Row: {
          body_en: string
          body_fr: string
          created_at: string
          created_by: string | null
          email_sent_at: string | null
          excerpt_en: string
          excerpt_fr: string
          id: string
          published_at: string | null
          slug: string
          status: string
          title_en: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          body_en?: string
          body_fr?: string
          created_at?: string
          created_by?: string | null
          email_sent_at?: string | null
          excerpt_en?: string
          excerpt_fr?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_fr?: string
          created_at?: string
          created_by?: string | null
          email_sent_at?: string | null
          excerpt_en?: string
          excerpt_fr?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_email_queue: {
        Row: {
          created_at: string
          edition_id: string | null
          error_message: string | null
          id: string
          kind: string
          locale: string
          recipient_email: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          edition_id?: string | null
          error_message?: string | null
          id?: string
          kind: string
          locale?: string
          recipient_email: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          edition_id?: string | null
          error_message?: string | null
          id?: string
          kind?: string
          locale?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_email_queue_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "newsletter_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string
          source: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
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
          account_type: string
          avatar_url: string | null
          company_id: string | null
          country: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          instagram: string | null
          is_disabled: boolean
          last_name: string | null
          linkedin: string | null
          mobile_radial_menu: Json | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          instagram?: string | null
          is_disabled?: boolean
          last_name?: string | null
          linkedin?: string | null
          mobile_radial_menu?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          instagram?: string | null
          is_disabled?: boolean
          last_name?: string | null
          linkedin?: string | null
          mobile_radial_menu?: Json | null
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
      program_events: {
        Row: {
          actor_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      pulse_courses: {
        Row: {
          archetype_targets: string[]
          created_at: string
          description_i18n: Json
          difficulty: string
          estimated_minutes: number
          external_key: string | null
          id: string
          is_active: boolean
          principle_id: string | null
          sort_order: number
          title_i18n: Json
          updated_at: string
        }
        Insert: {
          archetype_targets?: string[]
          created_at?: string
          description_i18n?: Json
          difficulty?: string
          estimated_minutes?: number
          external_key?: string | null
          id?: string
          is_active?: boolean
          principle_id?: string | null
          sort_order?: number
          title_i18n?: Json
          updated_at?: string
        }
        Update: {
          archetype_targets?: string[]
          created_at?: string
          description_i18n?: Json
          difficulty?: string
          estimated_minutes?: number
          external_key?: string | null
          id?: string
          is_active?: boolean
          principle_id?: string | null
          sort_order?: number
          title_i18n?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_courses_principle_id_fkey"
            columns: ["principle_id"]
            isOneToOne: false
            referencedRelation: "aegis_rune_principles"
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
      recommendation_tools: {
        Row: {
          created_at: string
          duration_en: string | null
          duration_fr: string | null
          id: string
          meta: Json
          rank: number
          rationale_en: string
          rationale_fr: string
          rule_key: string | null
          session_id: string
          title_en: string
          title_fr: string
          tool_key: string
          tool_type: Database["public"]["Enums"]["assessment_tool_type"]
          user_id: string
          widget_key: string | null
        }
        Insert: {
          created_at?: string
          duration_en?: string | null
          duration_fr?: string | null
          id?: string
          meta?: Json
          rank?: number
          rationale_en: string
          rationale_fr: string
          rule_key?: string | null
          session_id: string
          title_en: string
          title_fr: string
          tool_key: string
          tool_type: Database["public"]["Enums"]["assessment_tool_type"]
          user_id: string
          widget_key?: string | null
        }
        Update: {
          created_at?: string
          duration_en?: string | null
          duration_fr?: string | null
          id?: string
          meta?: Json
          rank?: number
          rationale_en?: string
          rationale_fr?: string
          rule_key?: string | null
          session_id?: string
          title_en?: string
          title_fr?: string
          tool_key?: string
          tool_type?: Database["public"]["Enums"]["assessment_tool_type"]
          user_id?: string
          widget_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_tools_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      toolbox_assignment_stats: {
        Row: {
          abandoned_count: number
          assignment_id: string
          completed_count: number
          ignored_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          abandoned_count?: number
          assignment_id: string
          completed_count?: number
          ignored_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          abandoned_count?: number
          assignment_id?: string
          completed_count?: number
          ignored_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_assignment_stats_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "toolbox_assignments"
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
          description_i18n: Json
          duration: string | null
          external_url: string | null
          id: string
          template_id: string | null
          title: string
          title_i18n: Json
          user_delivery_status: string
          user_id: string
          widget_config: Json | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          content_type: string
          description?: string | null
          description_i18n?: Json
          duration?: string | null
          external_url?: string | null
          id?: string
          template_id?: string | null
          title: string
          title_i18n?: Json
          user_delivery_status?: string
          user_id: string
          widget_config?: Json | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          content_type?: string
          description?: string | null
          description_i18n?: Json
          duration?: string | null
          external_url?: string | null
          id?: string
          template_id?: string | null
          title?: string
          title_i18n?: Json
          user_delivery_status?: string
          user_id?: string
          widget_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "toolbox_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      toolbox_completions: {
        Row: {
          assignment_id: string
          completed_at: string
          completion_count: number
          duration_budget_min: number | null
          elapsed_sec: number | null
          feedback: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string
          completion_count?: number
          duration_budget_min?: number | null
          elapsed_sec?: number | null
          feedback?: string | null
          id?: string
          status: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string
          completion_count?: number
          duration_budget_min?: number | null
          elapsed_sec?: number | null
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
      toolbox_templates: {
        Row: {
          archetype_targets: string[]
          content_type: string
          created_at: string
          created_by: string
          description: string | null
          description_i18n: Json
          duration: string | null
          external_key: string | null
          external_url: string | null
          id: string
          is_active: boolean
          shadow_targets: string[]
          title: string
          title_i18n: Json
          updated_at: string
          widget_config: Json
        }
        Insert: {
          archetype_targets?: string[]
          content_type: string
          created_at?: string
          created_by: string
          description?: string | null
          description_i18n?: Json
          duration?: string | null
          external_key?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          shadow_targets?: string[]
          title: string
          title_i18n?: Json
          updated_at?: string
          widget_config?: Json
        }
        Update: {
          archetype_targets?: string[]
          content_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          description_i18n?: Json
          duration?: string | null
          external_key?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          shadow_targets?: string[]
          title?: string
          title_i18n?: Json
          updated_at?: string
          widget_config?: Json
        }
        Relationships: []
      }
      tracking_daily_batches: {
        Row: {
          answered_at: string | null
          created_at: string
          id: string
          perspective_id: string
          question_ids: string[]
          scheduled_date: string
          status: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          created_at?: string
          id?: string
          perspective_id: string
          question_ids?: string[]
          scheduled_date: string
          status?: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          created_at?: string
          id?: string
          perspective_id?: string
          question_ids?: string[]
          scheduled_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_daily_batches_perspective_id_fkey"
            columns: ["perspective_id"]
            isOneToOne: false
            referencedRelation: "tracking_perspectives"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_daily_responses: {
        Row: {
          batch_id: string
          choice_value: string | null
          id: string
          numeric_value: number | null
          question_id: string
          responded_at: string
          response_date: string
          text_value: string | null
          user_id: string
          weights_applied: Json | null
        }
        Insert: {
          batch_id: string
          choice_value?: string | null
          id?: string
          numeric_value?: number | null
          question_id: string
          responded_at?: string
          response_date: string
          text_value?: string | null
          user_id: string
          weights_applied?: Json | null
        }
        Update: {
          batch_id?: string
          choice_value?: string | null
          id?: string
          numeric_value?: number | null
          question_id?: string
          responded_at?: string
          response_date?: string
          text_value?: string | null
          user_id?: string
          weights_applied?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_daily_responses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "tracking_daily_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_daily_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "tracking_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_perspectives: {
        Row: {
          baseline_source: string
          created_at: string
          daily_popup_enabled: boolean
          description_en: string | null
          description_fr: string | null
          id: string
          is_active: boolean
          name_en: string
          name_fr: string
          slug: string
          sort_order: number
        }
        Insert: {
          baseline_source?: string
          created_at?: string
          daily_popup_enabled?: boolean
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          name_en: string
          name_fr: string
          slug: string
          sort_order?: number
        }
        Update: {
          baseline_source?: string
          created_at?: string
          daily_popup_enabled?: boolean
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          name_en?: string
          name_fr?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      tracking_progress_snapshots: {
        Row: {
          baseline_scores: Json
          delta: Json
          generated_at: string
          generated_by: string | null
          id: string
          narrative_en: string | null
          narrative_fr: string | null
          period_end: string
          period_start: string
          perspective_id: string
          response_count: number
          strongest_shift: string | null
          tracking_scores: Json
          user_id: string
        }
        Insert: {
          baseline_scores?: Json
          delta?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          narrative_en?: string | null
          narrative_fr?: string | null
          period_end: string
          period_start: string
          perspective_id: string
          response_count?: number
          strongest_shift?: string | null
          tracking_scores?: Json
          user_id: string
        }
        Update: {
          baseline_scores?: Json
          delta?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          narrative_en?: string | null
          narrative_fr?: string | null
          period_end?: string
          period_start?: string
          perspective_id?: string
          response_count?: number
          strongest_shift?: string | null
          tracking_scores?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_progress_snapshots_perspective_id_fkey"
            columns: ["perspective_id"]
            isOneToOne: false
            referencedRelation: "tracking_perspectives"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_questions: {
        Row: {
          archetype_target: string | null
          created_at: string
          dimension_target: string | null
          external_key: string
          house_target: number | null
          id: string
          is_active: boolean
          options: Json | null
          perspective_id: string
          question_en: string
          question_fr: string
          question_type: string
          scale_max: number | null
          scale_min: number | null
          sort_order: number
          user_id: string | null
          weight: number
        }
        Insert: {
          archetype_target?: string | null
          created_at?: string
          dimension_target?: string | null
          external_key: string
          house_target?: number | null
          id?: string
          is_active?: boolean
          options?: Json | null
          perspective_id: string
          question_en: string
          question_fr: string
          question_type?: string
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number
          user_id?: string | null
          weight?: number
        }
        Update: {
          archetype_target?: string | null
          created_at?: string
          dimension_target?: string | null
          external_key?: string
          house_target?: number | null
          id?: string
          is_active?: boolean
          options?: Json | null
          perspective_id?: string
          question_en?: string
          question_fr?: string
          question_type?: string
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number
          user_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "tracking_questions_perspective_id_fkey"
            columns: ["perspective_id"]
            isOneToOne: false
            referencedRelation: "tracking_perspectives"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_user_settings: {
        Row: {
          created_at: string
          daily_popup_enabled: boolean
          perspective_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_popup_enabled?: boolean
          perspective_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_popup_enabled?: boolean
          perspective_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_user_settings_perspective_id_fkey"
            columns: ["perspective_id"]
            isOneToOne: false
            referencedRelation: "tracking_perspectives"
            referencedColumns: ["id"]
          },
        ]
      }
      user_app_versions: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          platform: string
          reported_at: string
          user_id: string
          version_code: number
          version_name: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          platform?: string
          reported_at?: string
          user_id: string
          version_code: number
          version_name?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          platform?: string
          reported_at?: string
          user_id?: string
          version_code?: number
          version_name?: string | null
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
      user_tao_portrait_parts: {
        Row: {
          content_md: string
          created_at: string
          id: string
          part_id: string
          pole: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_md?: string
          created_at?: string
          id?: string
          part_id: string
          pole: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          part_id?: string
          pole?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      widget_proposals: {
        Row: {
          content_type_slug: string
          created_at: string
          created_by: string | null
          description: string | null
          description_i18n: Json
          external_url: string | null
          id: string
          published_assignment_ids: string[]
          published_template_id: string | null
          reasoning: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selected_user_ids: string[]
          source: string
          status: string
          suggested_user_ids: string[]
          title: string
          title_i18n: Json
          updated_at: string
          widget_config: Json
        }
        Insert: {
          content_type_slug: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_i18n?: Json
          external_url?: string | null
          id?: string
          published_assignment_ids?: string[]
          published_template_id?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selected_user_ids?: string[]
          source?: string
          status?: string
          suggested_user_ids?: string[]
          title: string
          title_i18n?: Json
          updated_at?: string
          widget_config?: Json
        }
        Update: {
          content_type_slug?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_i18n?: Json
          external_url?: string | null
          id?: string
          published_assignment_ids?: string[]
          published_template_id?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selected_user_ids?: string[]
          source?: string
          status?: string
          suggested_user_ids?: string[]
          title?: string
          title_i18n?: Json
          updated_at?: string
          widget_config?: Json
        }
        Relationships: [
          {
            foreignKeyName: "widget_proposals_content_type_slug_fkey"
            columns: ["content_type_slug"]
            isOneToOne: false
            referencedRelation: "content_type_definitions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "widget_proposals_published_template_id_fkey"
            columns: ["published_template_id"]
            isOneToOne: false
            referencedRelation: "toolbox_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _user_top_archetypes: { Args: { p_user_id: string }; Returns: string[] }
      add_habit_template_to_tracker: {
        Args: { p_template_id: string }
        Returns: Json
      }
      add_toolbox_assignment_to_habits: {
        Args: { p_toolbox_assignment_id: string }
        Returns: Json
      }
      add_toolbox_template_to_routine: {
        Args: { p_template_id: string }
        Returns: Json
      }
      bump_toolbox_assignment_stat: {
        Args: { p_assignment_id: string; p_status: string; p_user_id: string }
        Returns: undefined
      }
      complete_aegis_card: { Args: { p_card_id: string }; Returns: Json }
      confirm_waiting_toolbox_assignment: {
        Args: { p_assignment_id: string }
        Returns: boolean
      }
      delete_cartography_for_user: {
        Args: { p_user_id: string }
        Returns: Json
      }
      dispatch_newsletter_email_queue: {
        Args: { p_limit?: number }
        Returns: undefined
      }
      enqueue_newsletter_edition_emails: {
        Args: { p_edition_id: string }
        Returns: number
      }
      enqueue_newsletter_welcome_email: {
        Args: { p_email: string; p_locale?: string }
        Returns: undefined
      }
      export_to_drive_async: {
        Args: {
          p_category: string
          p_content_md: string
          p_filename: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_aegis_synapse_deck: {
        Args: { p_limit?: number; p_locale?: string }
        Returns: Json
      }
      get_aegis_synapse_grimoire: { Args: { p_locale?: string }; Returns: Json }
      get_pulse_admin_card_stats: { Args: never; Returns: Json }
      get_pulse_admin_card_users: { Args: { p_card_id: string }; Returns: Json }
      get_pulse_admin_swipe_log: {
        Args: { p_card_id?: string; p_limit?: number; p_user_id?: string }
        Returns: Json
      }
      get_pulse_admin_user_runes: { Args: { p_user_id: string }; Returns: Json }
      get_pulse_admin_users_overview: {
        Args: {
          p_activity?: string
          p_card_id?: string
          p_limit?: number
          p_min_assimilated?: number
          p_min_runes_unlocked?: number
          p_offset?: number
          p_principle_code?: string
          p_search?: string
          p_sort?: string
        }
        Returns: Json
      }
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
      notify_newsletter_edition_in_app: {
        Args: { p_edition_id: string }
        Returns: number
      }
      notify_newsletter_welcome_in_app: {
        Args: { p_locale?: string; p_user_id: string }
        Returns: undefined
      }
      publish_app_release: {
        Args: { p_release_id: string }
        Returns: {
          apk_public_url: string
          apk_storage_path: string
          created_at: string
          created_by: string | null
          file_size_bytes: number | null
          force_update: boolean
          id: string
          is_published: boolean
          min_version_code: number | null
          platform: string
          published_at: string | null
          release_notes: string | null
          sha256: string | null
          updated_at: string
          version_code: number
          version_name: string
        }
        SetofOptions: {
          from: "*"
          to: "app_releases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_newsletter_edition: {
        Args: { p_edition_id: string }
        Returns: Json
      }
      record_aegis_synapse_swipe: {
        Args: {
          p_action: Database["public"]["Enums"]["aegis_swipe_action"]
          p_card_id: string
        }
        Returns: Json
      }
      recycle_pulse_ignored: { Args: never; Returns: Json }
      refresh_archetype_scores_by_user: { Args: never; Returns: undefined }
      remove_habit_from_tracker: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      remove_toolbox_assignment_from_habits: {
        Args: { p_toolbox_assignment_id: string }
        Returns: Json
      }
      remove_toolbox_from_routine: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      replace_assessment_core_catalog: {
        Args: { p_questions: Json; p_template_slug: string }
        Returns: boolean
      }
      reset_user_archetype_results: {
        Args: { p_reset_t1?: boolean; p_reset_t2?: boolean; p_user_id: string }
        Returns: Json
      }
      resolve_course_content: {
        Args: { p_field: Json; p_locale: string }
        Returns: Json
      }
      resolve_i18n: {
        Args: { p_field: Json; p_locale: string }
        Returns: string
      }
      resolve_i18n_array: {
        Args: { p_field: Json; p_locale: string }
        Returns: Json
      }
      seed_assessment_catalog_if_empty: {
        Args: { p_questions: Json; p_template_slug: string }
        Returns: boolean
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
      set_habit_duration_override: {
        Args: { p_assignment_id: string; p_duration_min: number }
        Returns: Json
      }
      subscribe_newsletter: {
        Args: { p_email: string; p_locale?: string; p_source?: string }
        Returns: Json
      }
      unsubscribe_newsletter: { Args: { p_email: string }; Returns: Json }
    }
    Enums: {
      aegis_swipe_action: "assimilated" | "ignored"
      app_role: "admin" | "user"
      assessment_question_type:
        | "single_choice"
        | "multiple_choice"
        | "likert_scale"
        | "ranking"
        | "short_text"
      assessment_session_status: "in_progress" | "submitted" | "archived"
      assessment_tool_type:
        | "meditation"
        | "breathwork"
        | "journal_prompt"
        | "micro_practice"
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
      aegis_swipe_action: ["assimilated", "ignored"],
      app_role: ["admin", "user"],
      assessment_question_type: [
        "single_choice",
        "multiple_choice",
        "likert_scale",
        "ranking",
        "short_text",
      ],
      assessment_session_status: ["in_progress", "submitted", "archived"],
      assessment_tool_type: [
        "meditation",
        "breathwork",
        "journal_prompt",
        "micro_practice",
      ],
    },
  },
} as const
