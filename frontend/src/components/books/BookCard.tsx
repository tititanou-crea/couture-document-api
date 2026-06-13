import Link from "next/link";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { labelFor } from "@/utils/bookOptions";
import type { Book } from "@/types/book";

type BookCardProps = {
  book: Book;
  onDelete?: (id: string) => void;
};

export function BookCard({ book, onDelete }: BookCardProps) {
  const chips = [
    ...book.difficulty_levels,
    ...book.target_audiences,
    ...book.main_categories,
    ...book.project_types,
  ].slice(0, 5);

  return (
    <article className="soft-panel overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[150px_1fr]">
        <div className="flex min-h-44 items-center justify-center bg-cream">
          <CoverImage src={book.cover_url} alt={`Couverture de ${book.title ?? "livre"}`} />
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">{book.title || "Livre sans titre"}</h2>
              {book.subtitle ? <p className="mt-1 text-base text-stone-600">{book.subtitle}</p> : null}
              {book.authors.length ? <p className="mt-2 text-base font-semibold text-rosewood">{book.authors.join(", ")}</p> : null}
            </div>
            <div className="flex gap-2">
              <Link href={`/books/${book.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-rosewood ring-1 ring-rosewood/20 hover:bg-cream">
                <Edit3 aria-hidden size={18} />
                Modifier
              </Link>
              {onDelete ? (
                <Button variant="quiet" type="button" aria-label="Supprimer le livre" onClick={() => onDelete(book.id)}>
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
            {book.description || "Aucune description pour le moment."}
          </p>
        </div>
      </div>
    </article>
  );
}
