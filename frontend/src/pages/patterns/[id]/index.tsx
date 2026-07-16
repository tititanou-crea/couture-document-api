import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, BookOpen, Edit3, Trash2 } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { Notice } from "@/components/ui/Notice";
import { DocumentTrace } from "@/components/ui/DocumentTrace";
import { useAsyncState } from "@/hooks/useAsyncState";
import { deletePattern, getPattern } from "@/services/patterns";
import type { DocumentStatus } from "@/types/book";
import type { Pattern, PatternFormat } from "@/types/pattern";
import { labelFor } from "@/utils/bookOptions";

const statusLabels: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  pending_validation: "En attente de validation",
  validated: "Validé",
};

const formatLabels: Record<PatternFormat, string> = {
  physical: "Physique",
  digital: "Numérique",
  both: "Physique et numérique",
};

export default function PatternDetailsPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const patternState = useAsyncState<Pattern>();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      patternState.run(() => getPattern(id)).catch(() => undefined);
    }
  }, [id, patternState.run]);

  async function handleDelete(pattern: Pattern) {
    if (!window.confirm("Supprimer ce patron ? Cette action est définitive.")) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePattern(pattern.id);
      await router.push("/patterns");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Le patron n’a pas pu être supprimé.");
      setDeleting(false);
    }
  }

  const pattern = patternState.data;

  return (
    <AppLayout
      title="Détails du patron"
      subtitle="Consultez toutes les informations du patron sans passer en mode modification."
    >
      {patternState.error ? <Notice type="error">{patternState.error}</Notice> : null}
      {deleteError ? <Notice type="error">{deleteError}</Notice> : null}
      {patternState.loading ? <p className="text-lg font-semibold text-rosewood">Chargement du patron...</p> : null}

      {pattern ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/patterns"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-md px-3 py-2 font-semibold text-rosewood hover:bg-white"
            >
              <ArrowLeft aria-hidden size={19} />
              Retour à la liste
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/patterns/${pattern.id}/edit`}
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
                onClick={() => handleDelete(pattern)}
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>

          <article className="soft-panel overflow-hidden">
            <div className="grid lg:grid-cols-[340px_1fr]">
              <div className="grid content-start gap-px bg-white">
                <div className="flex min-h-80 items-center justify-center bg-cream lg:min-h-[440px]">
                  <CoverImage
                    src={pattern.cover_url}
                    alt={`Photo du patron ${pattern.model_name ?? ""}`}
                    className="h-full max-h-[560px] w-full object-contain"
                  />
                </div>
                {pattern.second_cover_url ? (
                  <div className="flex min-h-80 items-center justify-center bg-cream lg:min-h-[440px]">
                    <CoverImage
                      src={pattern.second_cover_url}
                      alt={`Deuxième photo du patron ${pattern.model_name ?? ""}`}
                      className="h-full max-h-[560px] w-full object-contain"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-7 p-5 sm:p-7">
                <header>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge>Patron</Badge>
                    <Badge>{statusLabels[pattern.status]}</Badge>
                  </div>
                  <h2 className="text-3xl font-bold text-ink">{pattern.model_name || "Patron sans nom"}</h2>
                  {pattern.designer_name ? <p className="mt-3 font-semibold text-rosewood">{pattern.designer_name}</p> : null}
                </header>

                <DetailSection title="Informations générales">
                  <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    <Detail label="Format" value={pattern.format ? formatLabels[pattern.format] : null} />
                    <Detail label="Repère dans le document" value={pattern.magazine_pattern_identifier} />
                  </dl>
                </DetailSection>

                <DetailSection title="Description">
                  <p className="whitespace-pre-wrap leading-7 text-stone-600">
                    {pattern.description || "Aucune description pour le moment."}
                  </p>
                </DetailSection>

                <DetailSection title="Classement">
                  <TagGroup label="Niveaux" values={pattern.difficulty_levels} />
                  <TagGroup label="Publics" values={pattern.target_audiences} />
                  <TagGroup label="Catégories" values={pattern.main_categories} />
                  <TagGroup label="Projets" values={pattern.project_types} />
                </DetailSection>

                {pattern.source_magazine ? (
                  <DetailSection title="Document source">
                    <Link
                      href={`/books/${pattern.source_magazine.id}`}
                      className="flex items-center gap-3 rounded-lg border border-rosewood/10 bg-linen p-4 transition hover:border-rosewood/30"
                    >
                      <BookOpen className="shrink-0 text-rosewood" aria-hidden size={22} />
                      <span>
                        <span className="block font-semibold text-ink">
                          {pattern.source_magazine.title || "Document sans nom"}
                        </span>
                        {pattern.source_magazine.issue_number ? (
                          <span className="text-sm text-stone-600">Numéro {pattern.source_magazine.issue_number}</span>
                        ) : null}
                      </span>
                    </Link>
                  </DetailSection>
                ) : null}

                <DetailSection title="Suivi de la fiche">
                  <DocumentTrace
                    createdAt={pattern.created_at}
                    updatedAt={pattern.updated_at}
                    creator={pattern.creator}
                    lastModifier={pattern.last_modifier}
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

function TagGroup({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;

  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-sm font-semibold text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => <Badge key={value}>{labelFor(value)}</Badge>)}
      </div>
    </div>
  );
}
