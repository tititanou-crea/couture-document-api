import Link from "next/link";
import { useRouter } from "next/router";
import { BookOpen, Edit3, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { DocumentTrace } from "@/components/ui/DocumentTrace";
import { labelFor } from "@/utils/bookOptions";
import type { Pattern } from "@/types/pattern";

type PatternCardProps = {
  pattern: Pattern;
  onDelete?: (id: string) => void;
};

export function PatternCard({ pattern, onDelete }: PatternCardProps) {
  const router = useRouter();
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
  const detailsHref = `/patterns/${pattern.id}`;

  function openDetails(target: EventTarget | null) {
    if (target instanceof Element && target.closest("a, button")) return;
    router.push(detailsHref);
  }

  return (
    <article
      className="soft-panel cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:border-rosewood/25 hover:shadow-md"
      onClick={(event) => openDetails(event.target)}
    >
      <div className="grid gap-0 md:grid-cols-[150px_1fr]">
        <div className="grid min-h-44 grid-cols-1 bg-cream">
          <div className="flex min-h-44 items-center justify-center overflow-hidden">
            <CoverImage
              src={pattern.cover_url}
              alt={`Photo du patron ${pattern.model_name ?? ""}`}
              thumbnailWidth={360}
            />
          </div>
          {pattern.second_cover_url ? (
            <div className="flex min-h-44 items-center justify-center overflow-hidden border-t border-white">
              <CoverImage
                src={pattern.second_cover_url}
                alt={`Deuxième photo du patron ${pattern.model_name ?? ""}`}
                thumbnailWidth={360}
              />
            </div>
          ) : null}
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
              <Link prefetch={false} href={detailsHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-rosewood ring-1 ring-rosewood/20 hover:bg-cream">
                <Eye aria-hidden size={18} />
                Détails
              </Link>
              <Link prefetch={false} href={`/patterns/${pattern.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-rosewood ring-1 ring-rosewood/20 hover:bg-cream">
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
            <Link prefetch={false} href={`/books/${pattern.source_magazine.id}`} className="mt-4 inline-flex items-center gap-2 rounded-md bg-linen px-3 py-2 text-sm font-bold text-rosewood hover:bg-cream">
              <BookOpen aria-hidden size={16} />
              {pattern.source_magazine.title || "Document source"}
              {pattern.source_magazine.issue_number ? ` - ${pattern.source_magazine.issue_number}` : ""}
            </Link>
          ) : null}

          <DocumentTrace
            compact
            createdAt={pattern.created_at}
            updatedAt={pattern.updated_at}
            creator={pattern.creator}
            lastModifier={pattern.last_modifier}
          />
        </div>
      </div>
    </article>
  );
}
