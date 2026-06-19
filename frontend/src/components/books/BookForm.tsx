import { useState, type FormEvent } from "react";
import { PlusCircle, Save, Trash2 } from "lucide-react";
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
import type { PatternMainCategory } from "@/types/pattern";

type IncludesPatternsChoice = "yes" | "no" | "unknown";

type BookFormState = {
  documentType: BookPayload["document_type"];
  title: string;
  subtitle: string;
  authors: string;
  publisher: string;
  isbn: string;
  ean: string;
  issueNumber: string;
  publicationYear: string;
  pageCount: string;
  description: string;
  notes: string;
  coverUrl: string | null;
  patternSheetUrl: string | null;
  patternSheetSecondUrl: string | null;
  difficulty_levels: BookPayload["difficulty_levels"];
  target_audiences: BookPayload["target_audiences"];
  main_categories: BookPayload["main_categories"];
  project_types: BookPayload["project_types"];
  techniques: BookPayload["techniques"];
  includesPatterns: IncludesPatternsChoice;
  otherProject: string;
  otherTechnique: string;
  magazinePatterns: MagazinePatternFormState[];
};

type MagazinePatternFormState = {
  id: string;
  modelName: string;
  identifier: string;
  format: "physical" | "digital" | "both";
  description: string;
  coverUrl: string | null;
  difficulty_levels: BookPayload["difficulty_levels"];
  target_audiences: BookPayload["target_audiences"];
  main_categories: PatternMainCategory[];
  project_types: BookPayload["project_types"];
};

type BookFormProps = {
  initialBook?: Book | null;
  documentType?: BookPayload["document_type"];
  submitLabel: string;
  onSubmit: (payload: BookPayload) => Promise<void>;
};

function initialState(book?: Book | null, documentType?: BookPayload["document_type"]): BookFormState {
  return {
    documentType: documentType ?? book?.document_type ?? "book",
    title: book?.title ?? "",
    subtitle: book?.subtitle ?? "",
    authors: book?.authors.join(", ") ?? "",
    publisher: book?.publisher ?? "",
    isbn: book?.isbn ?? "",
    ean: book?.ean ?? "",
    issueNumber: book?.issue_number ?? "",
    publicationYear: book?.published_date?.slice(0, 4) ?? "",
    pageCount: book?.page_count ? String(book.page_count) : "",
    description: book?.description ?? "",
    notes: "",
    coverUrl: book?.cover_url ?? null,
    patternSheetUrl: book?.pattern_sheet_url ?? null,
    patternSheetSecondUrl: book?.pattern_sheet_second_url ?? null,
    difficulty_levels: book?.difficulty_levels ?? [],
    target_audiences: book?.target_audiences ?? [],
    main_categories: book?.main_categories ?? [],
    project_types: book?.project_types ?? [],
    techniques: book?.techniques ?? [],
    includesPatterns:
      book?.includes_patterns === true ? "yes" : book?.includes_patterns === false ? "no" : "unknown",
    otherProject: "",
    otherTechnique: "",
    magazinePatterns: [],
  };
}

export function BookForm({ initialBook, documentType, submitLabel, onSubmit }: BookFormProps) {
  const [form, setForm] = useState<BookFormState>(() => initialState(initialBook, documentType));
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMagazine = form.documentType === "magazine";
  const filledMagazinePatterns = form.magazinePatterns.filter(
    (pattern) => pattern.modelName.trim() || pattern.identifier.trim()
  );
  const missingRequiredPatternPhotos =
    isMagazine &&
    form.includesPatterns === "yes" &&
    !form.patternSheetUrl &&
    !form.patternSheetSecondUrl &&
    filledMagazinePatterns.some((pattern) => !pattern.coverUrl);
  const canSave = form.title.trim().length > 0 && !missingRequiredPatternPhotos;

  function update<K extends keyof BookFormState>(key: K, value: BookFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateIncludesPatterns(value: IncludesPatternsChoice) {
    setForm((current) => ({
      ...current,
      includesPatterns: value,
      patternSheetUrl: value === "yes" ? current.patternSheetUrl : null,
      patternSheetSecondUrl: value === "yes" ? current.patternSheetSecondUrl : null,
      magazinePatterns: value === "yes" ? current.magazinePatterns : [],
    }));
  }

  function applyExtractedMetadata(metadata: ExtractedBookMetadata) {
    setForm((current) => ({
      ...current,
      title: current.title || metadata.title || "",
      subtitle: isMagazine ? "" : current.subtitle || metadata.subtitle || "",
      authors: current.authors || metadata.authors?.join(", ") || "",
      publisher: isMagazine ? "" : current.publisher || metadata.publisher || "",
      isbn: current.isbn || metadata.isbn || "",
      publicationYear: current.publicationYear || metadata.publishedYear || "",
      pageCount: current.pageCount || (metadata.pageCount ? String(metadata.pageCount) : ""),
      description: isMagazine ? "" : current.description || metadata.description || "",
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
      document_type: form.documentType,
      subtitle: isMagazine ? null : form.subtitle.trim() || null,
      authors: isMagazine
        ? []
        : form.authors
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean),
      publisher: isMagazine ? null : form.publisher.trim() || null,
      isbn: isMagazine ? null : form.isbn.trim() || null,
      ean: isMagazine ? form.ean.trim() || null : null,
      issue_number: isMagazine ? form.issueNumber.trim() || null : null,
      published_date: form.publicationYear ? `${form.publicationYear}-01-01` : null,
      page_count: form.pageCount ? Number(form.pageCount) : null,
      language: "fr",
      cover_url: form.coverUrl,
      pattern_sheet_url: isMagazine ? form.patternSheetUrl : null,
      pattern_sheet_second_url: isMagazine ? form.patternSheetSecondUrl : null,
      description: isMagazine
        ? null
        : form.description.trim()
          ? `${form.description.trim()}${notes}`
          : notes.trim() || null,
      categories: [],
      tags,
      difficulty_levels: form.difficulty_levels,
      target_audiences: form.target_audiences,
      main_categories: form.main_categories,
      project_types: form.project_types,
      techniques: form.techniques,
      includes_patterns:
        form.includesPatterns === "unknown" ? null : form.includesPatterns === "yes",
      magazine_patterns:
        isMagazine && form.includesPatterns === "yes"
          ? form.magazinePatterns
              .filter((pattern) => pattern.modelName.trim() || pattern.identifier.trim())
              .map((pattern) => ({
                model_name: pattern.modelName.trim() || null,
                designer_name: form.title.trim() || null,
                format: pattern.format,
                description: pattern.description.trim() || null,
                cover_url:
                  pattern.coverUrl || form.patternSheetUrl || form.patternSheetSecondUrl,
                magazine_pattern_identifier: pattern.identifier.trim() || null,
                difficulty_levels: pattern.difficulty_levels,
                target_audiences: pattern.target_audiences,
                main_categories: pattern.main_categories,
                project_types: pattern.project_types,
              }))
          : [],
      status: "draft",
      created_by: null,
      validated_by: null,
      validated_at: null,
    };
  }

  function addMagazinePattern() {
    setForm((current) => ({
      ...current,
      magazinePatterns: [
        ...current.magazinePatterns,
        {
          id: crypto.randomUUID(),
          modelName: "",
          identifier: "",
          format: "physical",
          description: "",
          coverUrl: null,
          difficulty_levels: current.difficulty_levels,
          target_audiences: current.target_audiences,
          main_categories: current.main_categories.filter((value): value is PatternMainCategory =>
            ["clothing", "accessories"].includes(value)
          ),
          project_types: current.project_types,
        },
      ],
    }));
  }

  function updateMagazinePattern<K extends keyof MagazinePatternFormState>(
    id: string,
    key: K,
    value: MagazinePatternFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      magazinePatterns: current.magazinePatterns.map((pattern) =>
        pattern.id === id ? { ...pattern, [key]: value } : pattern
      ),
    }));
  }

  function removeMagazinePattern(id: string) {
    setForm((current) => ({
      ...current,
      magazinePatterns: current.magazinePatterns.filter((pattern) => pattern.id !== id),
    }));
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
        title={isMagazine ? "Assistant couverture" : "Assistant photo"}
        description={
          isMagazine
            ? "Ajoutez la couverture avant du magazine pour préremplir les informations visibles."
            : "Prenez la couverture et le dos du livre pour préremplir automatiquement les informations disponibles."
        }
      >
        <BookPhotoAssistant mode={isMagazine ? "magazine" : "book"} onApply={applyExtractedMetadata} />
      </SectionCard>

      <SectionCard
        title={isMagazine ? "1. Identifier le numéro" : "1. Informations principales"}
        description={
          isMagazine
            ? "Renseignez le nom du magazine et le numéro exact pour pouvoir le retrouver facilement."
            : "Commencez par les informations visibles sur la couverture ou les premières pages. Vous pourrez toujours compléter plus tard."
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label={isMagazine ? "Nom du magazine" : "Titre du livre"} value={form.title} onChange={(event) => update("title", event.target.value)} required placeholder={isMagazine ? "Ex. Burda Style" : "Ex. Couture facile pour tous"} />
          {!isMagazine ? <TextField label="Sous-titre" value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} placeholder="Ex. 20 projets pour débuter" /> : null}
          {!isMagazine ? <TextField label="Auteur(s)" value={form.authors} onChange={(event) => update("authors", event.target.value)} placeholder="Nom, Prénom" help="S’il y a plusieurs auteurs, séparez-les par une virgule." /> : null}
          {!isMagazine ? <TextField label="Maison d’édition" value={form.publisher} onChange={(event) => update("publisher", event.target.value)} placeholder="Ex. Eyrolles" /> : null}
          {isMagazine ? (
            <>
              <TextField label="Numéro ou date" value={form.issueNumber} onChange={(event) => update("issueNumber", event.target.value)} placeholder="Ex. Mars 2026, n°289" />
              <TextField label="EAN" value={form.ean} onChange={(event) => update("ean", event.target.value)} placeholder="Ex. 9771234567003" />
            </>
          ) : (
            <TextField label="ISBN" value={form.isbn} onChange={(event) => update("isbn", event.target.value)} placeholder="Ex. 9782842218232" help="L’ISBN se trouve généralement au dos du livre près du code-barres." />
          )}
          <TextField label="Année de publication" type="number" min="1900" max="2100" value={form.publicationYear} onChange={(event) => update("publicationYear", event.target.value)} placeholder="Ex. 2021" />
          <TextField label="Nombre de pages" type="number" min="1" value={form.pageCount} onChange={(event) => update("pageCount", event.target.value)} placeholder="Ex. 128" />
        </div>
      </SectionCard>

      <SectionCard
        title="2. Informations couture"
        description={
          isMagazine
            ? "Ces choix décrivent le contenu global du numéro, notamment les techniques ou zooms particuliers."
            : "Ces choix permettent aux bénévoles de retrouver facilement un livre adapté à une envie ou à un niveau."
        }
      >
        <div className="grid gap-5 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <CheckboxGroup title={isMagazine ? "Niveaux présents" : "Niveaux présents dans le livre"} options={difficultyOptions} values={form.difficulty_levels} onChange={(values) => update("difficulty_levels", values)} />
            <div className="mt-5">
              <RadioCards
                title="Patrons inclus ?"
                value={form.includesPatterns}
                onChange={updateIncludesPatterns}
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
            <CheckboxGroup title={isMagazine ? "Catégorie principale" : "Catégorie principale du livre"} options={categoryOptions} values={form.main_categories} onChange={(values) => update("main_categories", values)} />
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

      {!isMagazine ? (
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
      ) : null}

      <SectionCard title={isMagazine ? "3. Photo de la couverture" : "4. Photo de la couverture"} description="Ajoutez une photo pour rendre la recherche plus visuelle et plus agréable.">
        <CoverUpload value={form.coverUrl} onChange={(url) => update("coverUrl", url)} />
      </SectionCard>

      {isMagazine && form.includesPatterns === "yes" ? (
        <SectionCard title="4. Patrons du magazine" description="Ajoutez une planche globale si le magazine en propose une, puis créez les patrons du numéro depuis cette même page.">
          <div className="space-y-5">
            <div>
              <p className="label">Photos de la planche des modèles (facultatif)</p>
              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-600">Première page</p>
                  <CoverUpload
                    value={form.patternSheetUrl}
                    onChange={(url) => update("patternSheetUrl", url)}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-600">Deuxième page</p>
                  <CoverUpload
                    value={form.patternSheetSecondUrl}
                    onChange={(url) => update("patternSheetSecondUrl", url)}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-stone-500">
                Pour une planche sur double page, ajoutez une photo de chaque page. Si le magazine
                n’a pas de planche globale, ajoutez une photo pour chaque patron ci-dessous.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-base text-stone-600">
                  Chaque patron créé ici sera relié à ce magazine et pourra être retrouvé dans la liste des patrons.
                </p>
                <Button type="button" variant="secondary" icon={<PlusCircle aria-hidden size={20} />} onClick={addMagazinePattern}>
                  Ajouter un patron
                </Button>
              </div>

              {form.magazinePatterns.length === 0 ? (
                <div className="rounded-lg border border-dashed border-rosewood/20 bg-cream p-5 text-base text-stone-600">
                  Ajoutez au moins un patron si le magazine contient des modèles à coudre.
                </div>
              ) : null}

              {form.magazinePatterns.map((pattern, index) => (
                <div key={pattern.id} className="rounded-lg border border-rosewood/10 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-ink">Patron {index + 1}</h3>
                    <Button type="button" variant="quiet" aria-label="Retirer ce patron" onClick={() => removeMagazinePattern(pattern.id)}>
                      <Trash2 aria-hidden size={19} />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <TextField label="Nom descriptif" value={pattern.modelName} onChange={(event) => updateMagazinePattern(pattern.id, "modelName", event.target.value)} placeholder="Ex. Jupe en jean" />
                    <TextField label="Repère sur la planche" value={pattern.identifier} onChange={(event) => updateMagazinePattern(pattern.id, "identifier", event.target.value)} placeholder="Ex. M1, 12A, modèle 104" />
                    <label>
                      <span className="label">Format</span>
                      <select className="field" value={pattern.format} onChange={(event) => updateMagazinePattern(pattern.id, "format", event.target.value as MagazinePatternFormState["format"])}>
                        <option value="physical">Physique</option>
                        <option value="digital">Numérique</option>
                        <option value="both">Physique et numérique</option>
                      </select>
                    </label>
                    <div className="md:col-span-2">
                      <TextArea label="Description courte" value={pattern.description} onChange={(event) => updateMagazinePattern(pattern.id, "description", event.target.value)} placeholder="Ex. Robe à volants enfant, pantalon large, veste courte..." />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-5 lg:grid-cols-4">
                    <CheckboxGroup title="Niveau" options={difficultyOptions} values={pattern.difficulty_levels} onChange={(values) => updateMagazinePattern(pattern.id, "difficulty_levels", values)} />
                    <div className="border-rosewood/10 lg:border-l lg:pl-4">
                      <CheckboxGroup title="Public" options={audienceOptions} values={pattern.target_audiences} onChange={(values) => updateMagazinePattern(pattern.id, "target_audiences", values)} />
                    </div>
                    <div className="border-rosewood/10 lg:border-l lg:pl-4">
                      <CheckboxGroup title="Catégorie" options={categoryOptions.filter((option) => option.value === "clothing" || option.value === "accessories")} values={pattern.main_categories} onChange={(values) => updateMagazinePattern(pattern.id, "main_categories", values as PatternMainCategory[])} />
                    </div>
                    <div className="border-rosewood/10 lg:border-l lg:pl-4">
                      <CheckboxGroup title="Type de projet" options={projectOptions} values={pattern.project_types} onChange={(values) => updateMagazinePattern(pattern.id, "project_types", values)} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="label">
                      Photo du modèle
                      {form.patternSheetUrl || form.patternSheetSecondUrl
                        ? " (facultatif)"
                        : " (obligatoire sans planche globale)"}
                    </p>
                    <CoverUpload value={pattern.coverUrl} onChange={(url) => updateMagazinePattern(pattern.id, "coverUrl", url)} />
                    <p className="mt-2 text-sm text-stone-500">
                      {form.patternSheetUrl || form.patternSheetSecondUrl
                        ? "Si aucune photo séparée n’est ajoutée, la planche du magazine sera utilisée."
                        : "Comme aucune planche globale n’est renseignée, cette photo servira à identifier le patron."}
                    </p>
                  </div>
                </div>
              ))}

              {missingRequiredPatternPhotos ? (
                <Notice type="error">
                  Sans planche globale, chaque patron renseigné doit avoir sa propre photo.
                </Notice>
              ) : null}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="sticky bottom-20 z-10 rounded-lg border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur lg:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-stone-600">Le document sera enregistré en brouillon. Vous pourrez le compléter ou le modifier ensuite.</p>
          <Button type="submit" disabled={!canSave || saving} icon={<Save aria-hidden size={20} />}>
            {saving ? "Enregistrement..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
