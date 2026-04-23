export type AppendixQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "likert_scale"
  | "ranking"
  | "short_text";

export interface AppendixCategory {
  id: string;
  slug: string;
  label_fr: string;
  label_en: string;
  description_fr: string | null;
  description_en: string | null;
  sort_order: number;
}

export interface AppendixOption {
  id: string;
  question_id: string;
  position: number;
  label_fr: string;
  label_en: string;
  value: number | null;
}

export interface AppendixQuestion {
  id: string;
  category_id: string;
  position: number;
  question_type: AppendixQuestionType;
  prompt_fr: string;
  prompt_en: string;
  helper_fr: string | null;
  helper_en: string | null;
  is_required: boolean;
  options: AppendixOption[];
}

export interface AppendixCategoryWithQuestions extends AppendixCategory {
  questions: AppendixQuestion[];
}

export interface AppendixResponse {
  question_id: string;
  selected_option_ids: string[];
  numeric_value: number | null;
  text_value: string | null;
}
