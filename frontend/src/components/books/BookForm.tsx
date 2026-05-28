import { useMemo, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { Notice } from "@/components/ui/Notice";
import { RadioCards } from "@/components/ui/RadioCards";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { BookPhotoAssistant } from "@/components/books/BookPhotoAssistant";
import { CoverUpload } from "@/components/books/CoverUpload";
import type { ExtractedBookMetadata } from "@/services/metadata";
import {
  audienceOptions,
  categoryOptions,
  difficultyOptions,
  projectOptions,
  techniqueOptions,
} from "@/utils/bookOptions";
import type { Book, BookPayload } from "@/types/book";

type IncludesPatternsChoice = "yes" | "no" | "unknown";

type BookFormState = {
  title: string;
  subtitle: string;
  authors: string;
  publisher: string;
  isbn: string;
  publicationYear: string;
  pageCount: string;
  description: string;
  notes: string;
  coverUrl: string | null;
  difficulty_levels: BookPayload["difficulty_levels"];
  target_audiences: BookPayload["target_audiences"];
  main_categories: BookPayload["main_categories"];
  project_types: BookPayload["project_types"];
  techniques: BookPayload["techniques"];
  includesPatterns: IncludesPatternsChoice;
  otherProject: string;
  otherTechnique: string;
};

type BookFormProps = {
  initialBook?: Book | null;
  submitLabel: string;
  onSubmit: (payload: BookPayload) => Promise<void>;
};

function initialState(book?: Book | null): BookFormState {
  return {
    title: book?.title ?? "",
    subtitle: book?.subtitle ?? "",
    authors: book?.authors.join(", ") ?? "",
    publisher: book?.publisher ?? "",
    isbn: book?.isbn ?? "",
    publicationYear: book?.published_date?.slice(0, 4) ?? "",
    pageCount: book?.page_count ? String(book.page_count) : "",
    description: book?.description ?? "",
    notes: "",
    coverUrl: book?.cover_url ?? null,
    difficulty_levels: book?.difficulty_levels ?? [],
    target_audiences: book?.target_audiences ?? [],
    main_categories: book?.main_categories ?? [],
    project_types: book?.project_types ?? [],
    techniques: book?.techniques ?? [],
    includesPatterns:
      book?.includes_patterns === true ? "yes" : book?.includes_patterns === false ? "no" : "unknown",
    otherProject: "",
    otherTechnique: "",
  };
}

export function BookForm({ initialBook, submitLabel, onSubmit }: BookFormProps) {
  const [form, setForm] = useState<BookFormState>(() => initialState(initialBook));
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => form.title.trim().length > 0, [form.title]);

  function update<K extends keyof BookFormState>(key: K, value: BookFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyExtractedMetadata(metadata: ExtractedBookMetadata) {
    setForm((current) => ({
      ...current,
      title: current.title || metadata.title || "",
      subtitle: current.subtitle || metadata.subtitle || "",
      authors: current.authors || metadata.authors?.join(", ") || "",
      publisher: current.publisher || metadata.publisher || "",
      isbn: current.isbn || metadata.isbn || "",
      publicationYear: current.publicationYear || metadata.publishedYear || "",
      pageCount: current.pageCount || (metadata.pageCount ? String(metadata.pageCount) : ""),
      description: current.description || metadata.description || "",
      coverUrl: current.coverUrl || metadata.coverUrl || null,
    }));
  }

  function buildPayload(): BookPayload {
    const notes = form.notes.trim() ? `\n\nNotes complémentaires :\n${form.notes.trim()}` : "";
    const tags = [
      form.otherProject.trim() ? `projet-autre:${form.otherProject.trim()}` : "",
      form.otherTechnique.trim() ? `technique-autre:${form.otherTechnique.trim()}` : "",
    ].filter(Boolean);

    return {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      authors: form.authors
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean),
      publisher: form.publisher.trim() || null,
      isbn: form.isbn.trim() || null,
      published_date: form.publicationYear ? `${form.publicationYear}-01-01` : null,
      page_count: form.pageCount ? Number(form.pageCount) : null,
      language: "fr",
      cover_url: form.coverUrl,
      description: form.description.trim() ? `${form.description.trim()}${notes}` : notes.trim() || null,
      categories: [],
      tags,
      difficulty_levels: form.difficulty_levels,
      target_audiences: form.target_audiences,
      main_categories: form.main_categories,
      project_types: form.project_types,
      techniques: form.techniques,
      includes_patterns:
        form.includesPatterns === "unknown" ? null : form.includesPatterns === "yes",
      status: "draft",
      created_by: null,
      validated_by: null,
      validated_at: null,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(buildPayload());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’enregistrer le livre.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error ? <Notice type="error">{error}</Notice> : null}

      <SectionCard
        title="Assistant photo"
        description="Prenez la couverture et le dos du livre pour préremplir automatiquement les informations disponibles."
      >
        <BookPhotoAssistant onApply={applyExtractedMetadata} />
      </SectionCard>

      <SectionCard
        title="1. Informations principales"
        description="Commencez par les informations visibles sur la couverture ou les premières pages. Vous pourrez toujours compléter plus tard."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Titre du livre" value={form.title} onChange={(event) => update("title", event.target.value)} required placeholder="Ex. Couture facile pour tous" />
          <TextField label="Sous-titre" value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} placeholder="Ex. 20 projets pour débuter" />
          <TextField label="Auteur(s)" value={form.authors} onChange={(event) => update("authors", event.target.value)} placeholder="Nom, Prénom" help="S’il y a plusieurs auteurs, séparez-les par une virgule." />
          <TextField label="Maison d’édition" value={form.publisher} onChange={(event) => update("publisher", event.target.value)} placeholder="Ex. Eyrolles" />
          <TextField label="ISBN" value={form.isbn} onChange={(event) => update("isbn", event.target.value)} placeholder="Ex. 9782842218232" help="L’ISBN se trouve généralement au dos du livre près du code-barres." />
          <TextField label="Année de publication" type="number" min="1900" max="2100" value={form.publicationYear} onChange={(event) => update("publicationYear", event.target.value)} placeholder="Ex. 2021" />
          <TextField label="Nombre de pages" type="number" min="1" value={form.pageCount} onChange={(event) => update("pageCount", event.target.value)} placeholder="Ex. 128" />
        </div>
      </SectionCard>

      <SectionCard title="2. Informations couture" description="Ces choix permettent aux bénévoles de retrouver facilement un livre adapté à une envie ou à un niveau.">
        <div className="grid gap-5 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <CheckboxGroup title="Niveaux présents dans le livre" options={difficultyOptions} values={form.difficulty_levels} onChange={(values) => update("difficulty_levels", values)} />
            <div className="mt-5">
              <RadioCards
                title="Patrons inclus ?"
                value={form.includesPatterns}
                onChange={(value) => update("includesPatterns", value)}
                options={[
                  { label: "Oui", value: "yes" },
                  { label: "Non", value: "no" },
                  { label: "Je ne sais pas", value: "unknown" },
                ]}
              />
            </div>
          </div>
          <div className="border-rosewood/10 lg:col-span-1 lg:border-l lg:pl-4">
            <CheckboxGroup title="Public concerné" options={audienceOptions} values={form.target_audiences} onChange={(values) => update("target_audiences", values)} />
          </div>
          <div className="border-rosewood/10 lg:col-span-1 lg:border-l lg:pl-4">
            <CheckboxGroup title="Catégorie principale du livre" options={categoryOptions} values={form.main_categories} onChange={(values) => update("main_categories", values)} />
          </div>
          <div className="border-rosewood/10 lg:col-span-1 lg:border-l lg:pl-4">
            <CheckboxGroup title="Types de projets abordés" options={projectOptions} values={form.project_types} onChange={(values) => update("project_types", values)} />
            <label className="mt-2 flex items-start gap-2 rounded-md bg-white px-2 py-1.5">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={Boolean(form.otherProject)} onChange={() => update("otherProject", form.otherProject ? "" : " ")} />
              <span className="w-full">
                <span className="block text-sm font-medium">Autre</span>
                {form.otherProject ? <input className="field mt-2 py-2 text-sm" value={form.otherProject} onChange={(event) => update("otherProject", event.target.value)} placeholder="Précisez" /> : null}
              </span>
            </label>
          </div>
          <div className="border-rosewood/10 lg:col-span-2 lg:border-l lg:pl-4">
            <CheckboxGroup title="Techniques abordées" options={techniqueOptions} values={form.techniques} onChange={(values) => update("techniques", values)} />
            <label className="mt-2 flex items-start gap-2 rounded-md bg-white px-2 py-1.5">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={Boolean(form.otherTechnique)} onChange={() => update("otherTechnique", form.otherTechnique ? "" : " ")} />
              <span className="w-full">
                <span className="block text-sm font-medium">Autre</span>
                {form.otherTechnique ? <input className="field mt-2 py-2 text-sm" value={form.otherTechnique} onChange={(event) => update("otherTechnique", event.target.value)} placeholder="Précisez" /> : null}
              </span>
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="3. Description" description="Une description courte suffit. L’important est d’aider une bénévole à savoir si le livre lui convient.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea label="Résumé du livre" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Quelques phrases simples sur le contenu du livre." />
          <div>
            <button type="button" className="mb-2 font-semibold text-rosewood underline-offset-4 hover:underline" onClick={() => setShowNotes((value) => !value)}>
              {showNotes ? "Masquer les notes complémentaires" : "Ajouter des notes complémentaires"}
            </button>
            {showNotes ? <TextArea label="Notes complémentaires" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="État du livre, remarques internes, détails utiles..." /> : <div className="rounded-lg border border-dashed border-rosewood/20 bg-cream p-5 text-sm leading-6 text-stone-600">Les notes internes sont facultatives. Ouvrez ce bloc seulement si vous avez une remarque utile.</div>}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="4. Photo de la couverture" description="Ajoutez une photo pour rendre la recherche plus visuelle et plus agréable.">
        <CoverUpload value={form.coverUrl} onChange={(url) => update("coverUrl", url)} />
      </SectionCard>

      <div className="sticky bottom-20 z-10 rounded-lg border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur lg:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-stone-600">Le livre sera enregistré en brouillon. Vous pourrez le compléter ou le modifier ensuite.</p>
          <Button type="submit" disabled={!canSave || saving} icon={<Save aria-hidden size={20} />}>
            {saving ? "Enregistrement..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
