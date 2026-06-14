import Link from "next/link";
import { BookOpen, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { labelFor } from "@/utils/bookOptions";
import type { Pattern } from "@/types/pattern";

type PatternCardProps = {
  pattern: Pattern;
  onDelete?: (id: string) => void;
};

export function PatternCard({ pattern, onDelete }: PatternCardProps) {
  const formatLabels = {
    physical: "Physique",
    digital: "Numérique",
    both: "Physique et numérique",
  };
  const chips = [
    ...pattern.difficulty_levels,
    ...pattern.target_audiences,
    ...pattern.main_categories,
    ...pattern.project_types,
  ].slice(0, 5);

  return (
    <article className="soft-panel overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[150px_1fr]">
        <div className="flex min-h-44 items-center justify-center bg-cream">
          <CoverImage src={pattern.cover_url} alt={`Photo du patron ${pattern.model_name ?? ""}`} />
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">{pattern.model_name || "Patron sans nom"}</h2>
              {pattern.designer_name ? <p className="mt-2 text-base font-semibold text-rosewood">{pattern.designer_name}</p> : null}
              {pattern.format ? <p className="mt-1 text-sm font-semibold text-stone-600">{formatLabels[pattern.format]}</p> : null}
              {pattern.magazine_pattern_identifier ? <p className="mt-1 text-sm font-semibold text-stone-600">Repère : {pattern.magazine_pattern_identifier}</p> : null}
            </div>
            <div className="flex gap-2">
              <Link href={`/patterns/${pattern.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-rosewood ring-1 ring-rosewood/20 hover:bg-cream">
                <Edit3 aria-hidden size={18} />
                Modifier
              </Link>
              {onDelete ? (
                <Button variant="quiet" type="button" aria-label="Supprimer le patron" onClick={() => onDelete(pattern.id)}>
                  <Trash2 aria-hidden size={19} />
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-linen px-3 py-1 text-sm font-semibold text-rosewood">
                {labelFor(chip)}
              </span>
            ))}
          </div>

          <p className="mt-4 line-clamp-2 text-base leading-7 text-stone-600">
            {pattern.description || "Aucune description pour le moment."}
          </p>

          {pattern.source_magazine ? (
            <Link href={`/books/${pattern.source_magazine.id}/edit`} className="mt-4 inline-flex items-center gap-2 rounded-md bg-linen px-3 py-2 text-sm font-bold text-rosewood hover:bg-cream">
              <BookOpen aria-hidden size={16} />
              {pattern.source_magazine.title || "Magazine source"}
              {pattern.source_magazine.issue_number ? ` - ${pattern.source_magazine.issue_number}` : ""}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
