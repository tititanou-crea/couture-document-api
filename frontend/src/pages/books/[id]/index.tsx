import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Edit3, Shirt, Trash2 } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { Notice } from "@/components/ui/Notice";
import { DocumentTrace } from "@/components/ui/DocumentTrace";
import { useAsyncState } from "@/hooks/useAsyncState";
import { deleteBook, getBook } from "@/services/books";
import type { Book, DocumentStatus } from "@/types/book";
import { labelFor } from "@/utils/bookOptions";

const statusLabels: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  pending_validation: "En attente de validation",
  validated: "Validé",
};

export default function BookDetailsPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const document = useAsyncState<Book>();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      document.run(() => getBook(id)).catch(() => undefined);
    }
  }, [document.run, id]);

  async function handleDelete(book: Book) {
    const label = book.document_type === "magazine" ? "ce magazine" : "ce livre";
    if (!window.confirm(`Supprimer ${label} ? Cette action est définitive.`)) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBook(book.id);
      await router.push(book.document_type === "magazine" ? "/magazines" : "/books");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Le document n’a pas pu être supprimé.");
      setDeleting(false);
    }
  }

  const book = document.data;
  const isMagazine = book?.document_type === "magazine";

  return (
    <AppLayout
      title={isMagazine ? "Détails du magazine" : "Détails du livre"}
      subtitle="Consultez toutes les informations du document sans passer en mode modification."
    >
      {document.error ? <Notice type="error">{document.error}</Notice> : null}
      {deleteError ? <Notice type="error">{deleteError}</Notice> : null}
      {document.loading ? <p className="text-lg font-semibold text-rosewood">Chargement du document...</p> : null}

      {book ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={isMagazine ? "/magazines" : "/books"}
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-md px-3 py-2 font-semibold text-rosewood hover:bg-white"
            >
              <ArrowLeft aria-hidden size={19} />
              Retour à la liste
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/books/${book.id}/edit`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rosewood/25 bg-white px-5 py-2.5 text-sm font-semibold text-rosewood transition hover:bg-[#fff2f5]"
              >
                <Edit3 aria-hidden size={18} />
                Modifier
              </Link>
              <Button
                type="button"
                variant="danger"
                icon={<Trash2 aria-hidden size={18} />}
                disabled={deleting}
                onClick={() => handleDelete(book)}
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>

          <article className="soft-panel overflow-hidden">
            <div className="grid lg:grid-cols-[300px_1fr]">
              <div className="flex min-h-80 items-center justify-center bg-cream lg:min-h-[440px]">
                <CoverImage
                  src={book.cover_url}
                  alt={`Couverture de ${book.title ?? (isMagazine ? "magazine" : "livre")}`}
                  className="h-full max-h-[560px] w-full object-contain"
                />
              </div>

              <div className="space-y-7 p-5 sm:p-7">
                <header>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge>{isMagazine ? "Magazine" : "Livre"}</Badge>
                    <Badge>{statusLabels[book.status]}</Badge>
                  </div>
                  <h2 className="text-3xl font-bold text-ink">{book.title || (isMagazine ? "Magazine sans nom" : "Livre sans titre")}</h2>
                  {!isMagazine && book.subtitle ? <p className="mt-2 text-lg text-stone-600">{book.subtitle}</p> : null}
                  {!isMagazine && book.authors.length ? (
                    <p className="mt-3 font-semibold text-rosewood">{book.authors.join(", ")}</p>
                  ) : null}
                </header>

                <DetailSection title="Informations générales">
                  <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {isMagazine ? (
                      <>
                        <Detail label="Numéro" value={book.issue_number} />
                        <Detail label="EAN" value={book.ean} />
                      </>
                    ) : (
                      <>
                        <Detail label="ISBN" value={book.isbn} />
                        <Detail label="Éditeur" value={book.publisher} />
                      </>
                    )}
                    <Detail label="Date de publication" value={formatDate(book.published_date)} />
                    <Detail label="Nombre de pages" value={book.page_count ? String(book.page_count) : null} />
                    <Detail label="Langue" value={book.language?.toUpperCase()} />
                    <Detail label="Patrons inclus" value={formatBoolean(book.includes_patterns)} />
                  </dl>
                </DetailSection>

                {!isMagazine ? (
                  <DetailSection title="Description">
                    <p className="whitespace-pre-wrap leading-7 text-stone-600">
                      {book.description || "Aucune description pour le moment."}
                    </p>
                  </DetailSection>
                ) : null}

                <DetailSection title="Classement">
                  <TagGroup label="Niveaux" values={book.difficulty_levels} />
                  <TagGroup label="Publics" values={book.target_audiences} />
                  <TagGroup label="Catégories" values={book.main_categories} />
                  <TagGroup label="Projets" values={book.project_types} />
                  <TagGroup label="Techniques" values={book.techniques} />
                  <TagGroup label="Mots-clés" values={book.tags} translate={false} />
                </DetailSection>

                {book.patterns?.length ? (
                  <DetailSection title={isMagazine ? "Patrons de ce magazine" : "Patrons de ce livre"}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {book.patterns.map((pattern) => (
                        <Link
                          key={pattern.id}
                          href={`/patterns/${pattern.id}`}
                          className="flex items-center gap-3 rounded-lg border border-rosewood/10 bg-linen p-3 transition hover:border-rosewood/30"
                        >
                          <Shirt className="shrink-0 text-rosewood" aria-hidden size={20} />
                          <span>
                            <span className="block font-semibold text-ink">{pattern.model_name || "Patron sans nom"}</span>
                            {pattern.magazine_pattern_identifier ? (
                              <span className="text-sm text-stone-600">{pattern.magazine_pattern_identifier}</span>
                            ) : null}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </DetailSection>
                ) : null}

                <DetailSection title="Suivi de la fiche">
                  <DocumentTrace
                    createdAt={book.created_at}
                    updatedAt={book.updated_at}
                    creator={book.creator}
                    lastModifier={book.last_modifier}
                  />
                </DetailSection>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </AppLayout>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-rosewood/10 pt-6 first:border-t-0 first:pt-0">
      <h3 className="mb-4 text-lg font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-stone-500">{label}</dt>
      <dd className="mt-1 text-base text-ink">{value || "Non renseigné"}</dd>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-linen px-3 py-1 text-sm font-semibold text-rosewood">{children}</span>;
}

function TagGroup({ label, values, translate = true }: { label: string; values: string[]; translate?: boolean }) {
  if (!values.length) return null;

  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-sm font-semibold text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => <Badge key={value}>{translate ? labelFor(value) : value}</Badge>)}
      </div>
    </div>
  );
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return "Non renseigné";
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}
