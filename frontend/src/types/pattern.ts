import type { DifficultyLevel, DocumentStatus, MainCategory, ProjectType, TargetAudience } from "@/types/book";

export type PatternMainCategory = Exclude<MainCategory, "technique">;
export type PatternFormat = "physical" | "digital" | "both";

export type Pattern = {
  id: string;
  model_name?: string | null;
  designer_name?: string | null;
  format?: PatternFormat | null;
  description?: string | null;
  cover_url?: string | null;
  difficulty_levels: DifficultyLevel[];
  target_audiences: TargetAudience[];
  main_categories: PatternMainCategory[];
  project_types: ProjectType[];
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

export type PatternPayload = Omit<Pattern, "id" | "created_at" | "updated_at"> & {
  created_by?: string | null;
  validated_by?: string | null;
  validated_at?: string | null;
};

export type PaginatedPatterns = {
  items: Pattern[];
  total: number;
  limit: number;
  offset: number;
};
