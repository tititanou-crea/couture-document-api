export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type TargetAudience = "women" | "men" | "children" | "baby" | "plus_size";
export type MainCategory =
  | "clothing"
  | "accessories"
  | "technique"
  | "patternmaking"
  | "embroidery"
  | "patchwork"
  | "upcycling"
  | "alterations";
export type ProjectType =
  | "dress"
  | "skirt"
  | "top"
  | "pants"
  | "jacket"
  | "coat"
  | "bag"
  | "pouch"
  | "hair_accessories"
  | "textile_decoration";
export type Technique =
  | "jersey"
  | "serger"
  | "embroidery"
  | "patchwork"
  | "alterations"
  | "patternmaking";

export type DocumentStatus = "draft" | "pending_validation" | "validated";
export type DocumentType = "book" | "magazine";

export type DocumentContributor = {
  id: string;
  first_name: string;
  last_name: string;
};

export type Book = {
  id: string;
  document_type: DocumentType;
  isbn?: string | null;
  ean?: string | null;
  issue_number?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  authors: string[];
  publisher?: string | null;
  published_date?: string | null;
  page_count?: number | null;
  language: string;
  cover_url?: string | null;
  pattern_sheet_url?: string | null;
  pattern_sheet_second_url?: string | null;
  categories: string[];
  tags: string[];
  difficulty_levels: DifficultyLevel[];
  target_audiences: TargetAudience[];
  main_categories: MainCategory[];
  project_types: ProjectType[];
  techniques: Technique[];
  available_sizes: string[];
  available_size_ranges: string[];
  includes_patterns?: boolean | null;
  patterns?: {
    id: string;
    model_name?: string | null;
    designer_name?: string | null;
    magazine_pattern_identifier?: string | null;
    cover_url?: string | null;
    second_cover_url?: string | null;
    available_sizes: string[];
    available_size_ranges: string[];
  }[];
  status: DocumentStatus;
  creator?: DocumentContributor | null;
  last_modifier?: DocumentContributor | null;
  created_at: string;
  updated_at: string;
};

export type BookPayload = Omit<
  Book,
  "id" | "document_type" | "creator" | "last_modifier" | "created_at" | "updated_at"
> & {
  document_type?: DocumentType;
  magazine_patterns?: {
    model_name?: string | null;
    designer_name?: string | null;
    format?: "physical" | "digital" | "both" | null;
    description?: string | null;
    cover_url?: string | null;
    second_cover_url?: string | null;
    magazine_pattern_identifier?: string | null;
    difficulty_levels: DifficultyLevel[];
    target_audiences: TargetAudience[];
    main_categories: Extract<MainCategory, "clothing" | "accessories">[];
    project_types: ProjectType[];
    available_sizes: string[];
    available_size_ranges: string[];
  }[];
  created_by?: string | null;
  validated_by?: string | null;
  validated_at?: string | null;
};

export type PaginatedBooks = {
  items: Book[];
  total: number;
  limit: number;
  offset: number;
};
