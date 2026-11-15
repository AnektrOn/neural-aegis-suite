export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolSeoMeta {
  title: string;
  description: string;
}

export type ConversionProblemKind = "cost" | "security" | "dispersion" | "waste" | "network";