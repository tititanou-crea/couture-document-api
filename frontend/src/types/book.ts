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
  categories: string[];
  tags: string[];
  difficulty_levels: DifficultyLevel[];
  target_audiences: TargetAudience[];
  main_categories: MainCategory[];
  project_types: ProjectType[];
  techniques: Technique[];
  includes_patterns?: boolean | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

export type BookPayload = Omit<Book, "id" | "document_type" | "created_at" | "updated_at"> & {
  document_type?: DocumentType;
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
