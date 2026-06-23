import Link from "next/link";
import { useRouter } from "next/router";
import { Edit3, Eye, Shirt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { DocumentTrace } from "@/components/ui/DocumentTrace";
import { labelFor } from "@/utils/bookOptions";
import type { Book } from "@/types/book";

type BookCardProps = {
  book: Book;
  onDelete?: (id: string) => void;
};

export function BookCard({ book, onDelete }: BookCardProps) {
  const router = useRouter();
  const chips = [
    ...book.difficulty_levels,
    ...book.target_audiences,
    ...book.main_categories,
    ...book.project_types,
  ].slice(0, 5);
  const detailsHref = `/books/${book.id}`;
  const documentLabel = book.document_type === "magazine" ? "magazine" : "livre";

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
        <div className="flex min-h-44 items-center justify-center bg-cream">
          <CoverImage src={book.cover_url} alt={`Couverture de ${book.title ?? "livre"}`} />
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">{book.title || (book.document_type === "magazine" ? "Magazine sans nom" : "Livre sans titre")}</h2>
              {book.document_type === "book" && book.subtitle ? <p className="mt-1 text-base text-stone-600">{book.subtitle}</p> : null}
              {book.document_type === "magazine" ? (
                <p className="mt-2 text-base font-semibold text-rosewood">
                  Magazine{book.issue_number ? ` - ${book.issue_number}` : ""}
                </p>
              ) : book.authors.length ? (
                <p className="mt-2 text-base font-semibold text-rosewood">{book.authors.join(", ")}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Link prefetch={false} href={detailsHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-rosewood ring-1 ring-rosewood/20 hover:bg-cream">
                <Eye aria-hidden size={18} />
                Détails
              </Link>
              <Link prefetch={false} href={`/books/${book.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-rosewood ring-1 ring-rosewood/20 hover:bg-cream">
                <Edit3 aria-hidden size={18} />
                Modifier
              </Link>
              {onDelete ? (
                <Button variant="quiet" type="button" aria-label={`Supprimer le ${documentLabel}`} onClick={() => onDelete(book.id)}>
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

          {book.document_type === "book" ? (
            <p className="mt-4 line-clamp-2 text-base leading-7 text-stone-600">
              {book.description || "Aucune description pour le moment."}
            </p>
          ) : null}

          {book.document_type === "magazine" && book.patterns?.length ? (
            <div className="mt-4 rounded-lg bg-linen p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-rosewood">
                <Shirt aria-hidden size={16} />
                Patrons dans ce magazine
              </p>
              <div className="flex flex-wrap gap-2">
                {book.patterns.map((pattern) => (
                  <Link prefetch={false} key={pattern.id} href={`/patterns/${pattern.id}/edit`} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink ring-1 ring-rosewood/10 hover:text-rosewood">
                    {pattern.magazine_pattern_identifier ? `${pattern.magazine_pattern_identifier} - ` : ""}
                    {pattern.model_name || "Patron sans nom"}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <DocumentTrace
            compact
            createdAt={book.created_at}
            updatedAt={book.updated_at}
            creator={book.creator}
            lastModifier={book.last_modifier}
          />
        </div>
      </div>
    </article>
  );
}
