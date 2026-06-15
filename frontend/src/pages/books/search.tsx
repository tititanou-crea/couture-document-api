import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookCard } from "@/components/books/BookCard";
import { PatternCard } from "@/components/patterns/PatternCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { useAsyncState } from "@/hooks/useAsyncState";
import { listBooks, searchBooks } from "@/services/books";
import { listPatterns, searchPatterns } from "@/services/patterns";
import type { Book, PaginatedBooks } from "@/types/book";
import type { DocumentType } from "@/types/book";
import type { PaginatedPatterns, Pattern } from "@/types/pattern";
import {
  audienceOptions,
  categoryOptions,
  difficultyOptions,
  projectOptions,
  techniqueOptions,
} from "@/utils/bookOptions";

type SearchDocumentType = "all" | DocumentType | "pattern";
type SearchResult =
  | { kind: "book"; item: Book }
  | { kind: "magazine"; item: Book }
  | { kind: "pattern"; item: Pattern };

type SearchResults = {
  items: SearchResult[];
  total: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    documentType: "all" as SearchDocumentType,
    difficulty: "",
    audience: "",
    category: "",
    project: "",
    technique: "",
    patterns: "",
  });
  const results = useAsyncState<SearchResults>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const task = () => runSearch(query.trim(), filters.documentType);
    results.run(task).catch(() => undefined);
  }

  const filteredItems = (results.data?.items ?? []).filter((result) => {
    if (filters.difficulty && !hasValue(result.item.difficulty_levels, filters.difficulty)) return false;
    if (filters.audience && !hasValue(result.item.target_audiences, filters.audience)) return false;
    if (filters.category && !hasValue(result.item.main_categories, filters.category)) return false;
    if (filters.project && !hasValue(result.item.project_types, filters.project)) return false;
    if (filters.technique && result.kind !== "pattern" && !hasValue(result.item.techniques, filters.technique)) return false;
    if (filters.technique && result.kind === "pattern") return false;
    if (filters.patterns === "yes" && result.kind !== "pattern" && result.item.includes_patterns !== true) return false;
    if (filters.patterns === "no" && result.kind !== "pattern" && result.item.includes_patterns !== false) return false;
    return true;
  });

  function resetFilters() {
    setFilters({ documentType: "all", difficulty: "", audience: "", category: "", project: "", technique: "", patterns: "" });
  }

  return (
    <AppLayout title="Recherche" subtitle="Cherchez par titre, auteur, créateur, projet, catégorie ou mot-clé dans tous les documents.">
      <form className="soft-panel mb-6 space-y-4 p-5" onSubmit={handleSubmit}>
        <TextField label="Recherche libre" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. jupe, robe, Burda, patronnage, auteur..." />
        <div className="grid gap-3 md:grid-cols-3">
          <label>
            <span className="label">Type de document</span>
            <select className="field" value={filters.documentType} onChange={(event) => setFilters({ ...filters, documentType: event.target.value as SearchDocumentType })}>
              <option value="all">Tous</option>
              <option value="book">Livres</option>
              <option value="magazine">Magazines</option>
              <option value="pattern">Patrons</option>
            </select>
          </label>
          <Select label="Niveau" value={filters.difficulty} onChange={(value) => setFilters({ ...filters, difficulty: value })} options={difficultyOptions} />
          <Select label="Public" value={filters.audience} onChange={(value) => setFilters({ ...filters, audience: value })} options={audienceOptions} />
          <Select label="Catégorie" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} options={categoryOptions} />
          <Select label="Type de projet" value={filters.project} onChange={(value) => setFilters({ ...filters, project: value })} options={projectOptions} />
          <Select label="Technique" value={filters.technique} onChange={(value) => setFilters({ ...filters, technique: value })} options={techniqueOptions} />
          <label>
            <span className="label">Patrons inclus</span>
            <select className="field" value={filters.patterns} onChange={(event) => setFilters({ ...filters, patterns: event.target.value })}>
              <option value="">Tous</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={resetFilters}>Effacer les filtres</Button>
          <Button type="submit" disabled={results.loading} icon={<Search aria-hidden size={20} />}>
            {results.loading ? "Recherche..." : "Rechercher"}
          </Button>
        </div>
      </form>

      {results.error ? <Notice type="error">{results.error}</Notice> : null}

      <div className="space-y-4">
        {filteredItems.map((result) =>
          result.kind === "pattern" ? (
            <PatternCard key={`pattern-${result.item.id}`} pattern={result.item} />
          ) : (
            <BookCard key={`${result.kind}-${result.item.id}`} book={result.item} />
          )
        )}
      </div>

      {results.data && filteredItems.length === 0 ? (
        <EmptyState title="Aucun résultat">Essayez avec un mot plus simple, par exemple un nom d’auteur ou une technique.</EmptyState>
      ) : null}
    </AppLayout>
  );
}

function hasValue(values: readonly string[], value: string) {
  return values.includes(value);
}

async function runSearch(query: string, documentType: SearchDocumentType): Promise<SearchResults> {
  const booksTask = query ? () => searchBooks(query, { limit: 100, offset: 0 }) : () => listBooks({ limit: 100, offset: 0 });
  const patternsTask = query ? () => searchPatterns(query, { limit: 100, offset: 0 }) : () => listPatterns({ limit: 100, offset: 0 });

  if (documentType === "pattern") {
    const patterns = await patternsTask();
    return resultsFromResponses(undefined, patterns, documentType);
  }

  if (documentType === "book" || documentType === "magazine") {
    const books = await booksTask();
    return resultsFromResponses(books, undefined, documentType);
  }

  const [books, patterns] = await Promise.all([booksTask(), patternsTask()]);
  return resultsFromResponses(books, patterns, documentType);
}

function resultsFromResponses(
  books: PaginatedBooks | undefined,
  patterns: PaginatedPatterns | undefined,
  documentType: SearchDocumentType
): SearchResults {
  const bookResults = (books?.items ?? [])
    .filter((book) => documentType === "all" || book.document_type === documentType)
    .map((book): SearchResult => ({ kind: book.document_type, item: book }));
  const patternResults = (patterns?.items ?? []).map((pattern): SearchResult => ({ kind: "pattern", item: pattern }));
  const items = [...bookResults, ...patternResults].sort((left, right) => (
    new Date(right.item.created_at).getTime() - new Date(left.item.created_at).getTime()
  ));

  return {
    items,
    total: items.length,
  };
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
};

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label>
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Tous</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
