import Link from "next/link";
import { Edit3, ImageOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
          {pattern.cover_url ? (
            <img src={pattern.cover_url} alt={`Photo du patron ${pattern.model_name ?? ""}`} className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="text-rosewood/55" size={44} aria-hidden />
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">{pattern.model_name || "Patron sans nom"}</h2>
              {pattern.designer_name ? <p className="mt-2 text-base font-semibold text-rosewood">{pattern.designer_name}</p> : null}
              {pattern.format ? <p className="mt-1 text-sm font-semibold text-stone-600">{formatLabels[pattern.format]}</p> : null}
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
        </div>
      </div>
    </article>
  );
}
