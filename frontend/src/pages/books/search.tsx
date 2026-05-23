import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { useAsyncState } from "@/hooks/useAsyncState";
import { listBooks, searchBooks } from "@/services/books";
import type { PaginatedBooks } from "@/types/book";
import type { DifficultyLevel, MainCategory, ProjectType, TargetAudience, Technique } from "@/types/book";
import {
  audienceOptions,
  categoryOptions,
  difficultyOptions,
  projectOptions,
  techniqueOptions,
} from "@/utils/bookOptions";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    difficulty: "",
    audience: "",
    category: "",
    project: "",
    technique: "",
    patterns: "",
  });
  const results = useAsyncState<PaginatedBooks>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const task = query.trim() ? () => searchBooks(query.trim()) : () => listBooks({ limit: 100, offset: 0 });
    results.run(task).catch(() => undefined);
  }

  const filteredItems = (results.data?.items ?? []).filter((book) => {
    if (filters.difficulty && !book.difficulty_levels.includes(filters.difficulty as DifficultyLevel)) return false;
    if (filters.audience && !book.target_audiences.includes(filters.audience as TargetAudience)) return false;
    if (filters.category && !book.main_categories.includes(filters.category as MainCategory)) return false;
    if (filters.project && !book.project_types.includes(filters.project as ProjectType)) return false;
    if (filters.technique && !book.techniques.includes(filters.technique as Technique)) return false;
    if (filters.patterns === "yes" && book.includes_patterns !== true) return false;
    if (filters.patterns === "no" && book.includes_patterns !== false) return false;
    return true;
  });

  function resetFilters() {
    setFilters({ difficulty: "", audience: "", category: "", project: "", technique: "", patterns: "" });
  }

  return (
    <AppLayout title="Recherche" subtitle="Cherchez tranquillement par titre, auteur, ISBN ou mot-clé.">
      <form className="soft-panel mb-6 space-y-4 p-5" onSubmit={handleSubmit}>
        <TextField label="Recherche libre" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, auteur, maison d’édition, mot-clé..." />
        <div className="grid gap-3 md:grid-cols-3">
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
        {filteredItems.map((book) => <BookCard key={book.id} book={book} />)}
      </div>

      {results.data && filteredItems.length === 0 ? (
        <EmptyState title="Aucun résultat">Essayez avec un mot plus simple, par exemple un nom d’auteur ou une technique.</EmptyState>
      ) : null}
    </AppLayout>
  );
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
