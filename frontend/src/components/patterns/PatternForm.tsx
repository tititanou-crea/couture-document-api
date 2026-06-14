import { useMemo, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { CoverUpload } from "@/components/books/CoverUpload";
import { PatternPhotoAssistant } from "@/components/patterns/PatternPhotoAssistant";
import type { ExtractedPatternMetadata } from "@/services/metadata";
import { audienceOptions, difficultyOptions, projectOptions } from "@/utils/bookOptions";
import type {
  Pattern,
  PatternFormat,
  PatternMainCategory,
  PatternPayload,
} from "@/types/pattern";
import type { DifficultyLevel, ProjectType, TargetAudience } from "@/types/book";

const patternCategoryOptions: {
  label: string;
  value: PatternPayload["main_categories"][number];
  hint?: string;
}[] = [
  { label: "Vêtement", value: "clothing", hint: "Robes, jupes, hauts, pantalons, vestes..." },
  { label: "Accessoire", value: "accessories", hint: "Sacs, pochettes, accessoires cheveux..." },
];

type PatternFormState = {
  modelName: string;
  designerName: string;
  format: PatternFormat | "";
  description: string;
  coverUrl: string | null;
  magazinePatternIdentifier: string;
  difficulty_levels: PatternPayload["difficulty_levels"];
  target_audiences: PatternPayload["target_audiences"];
  main_categories: PatternPayload["main_categories"];
  project_types: PatternPayload["project_types"];
};

type PatternFormProps = {
  initialPattern?: Pattern | null;
  submitLabel: string;
  onSubmit: (payload: PatternPayload) => Promise<void>;
};

function initialState(pattern?: Pattern | null): PatternFormState {
  return {
    modelName: pattern?.model_name ?? "",
    designerName: pattern?.designer_name ?? "",
    format: pattern?.format ?? "",
    description: pattern?.description ?? "",
    coverUrl: pattern?.cover_url ?? null,
    magazinePatternIdentifier: pattern?.magazine_pattern_identifier ?? "",
    difficulty_levels: pattern?.difficulty_levels ?? [],
    target_audiences: pattern?.target_audiences ?? [],
    main_categories: pattern?.main_categories ?? [],
    project_types: pattern?.project_types ?? [],
  };
}

export function PatternForm({ initialPattern, submitLabel, onSubmit }: PatternFormProps) {
  const [form, setForm] = useState<PatternFormState>(() => initialState(initialPattern));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(
    () =>
      form.modelName.trim().length > 0 &&
      form.designerName.trim().length > 0 &&
      Boolean(form.format) &&
      form.description.trim().length > 0 &&
      Boolean(form.coverUrl),
    [form.coverUrl, form.description, form.designerName, form.format, form.modelName]
  );

  function update<K extends keyof PatternFormState>(key: K, value: PatternFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload(): PatternPayload {
    return {
      model_name: form.modelName.trim(),
      designer_name: form.designerName.trim() || null,
      format: form.format || null,
      description: form.description.trim() || null,
      cover_url: form.coverUrl,
      magazine_pattern_identifier: form.magazinePatternIdentifier.trim() || null,
      source_magazine_id: initialPattern?.source_magazine_id ?? null,
      difficulty_levels: form.difficulty_levels,
      target_audiences: form.target_audiences,
      main_categories: form.main_categories,
      project_types: form.project_types,
      status: "draft",
      created_by: null,
      validated_by: null,
      validated_at: null,
    };
  }

  function applyExtractedMetadata(metadata: ExtractedPatternMetadata) {
    setForm((current) => ({
      ...current,
      modelName: current.modelName || metadata.modelName || "",
      designerName: current.designerName || metadata.designerName || "",
      format: current.format || metadata.format || "",
      description: current.description || metadata.description || "",
      coverUrl: current.coverUrl || metadata.coverUrl || null,
      difficulty_levels: current.difficulty_levels.length
        ? current.difficulty_levels
        : filterValues<DifficultyLevel>(metadata.difficultyLevels, ["beginner", "intermediate", "advanced"]),
      target_audiences: current.target_audiences.length
        ? current.target_audiences
        : filterValues<TargetAudience>(metadata.targetAudiences, ["women", "men", "children", "baby", "plus_size"]),
      main_categories: current.main_categories.length
        ? current.main_categories
        : filterValues<PatternMainCategory>(metadata.mainCategories, ["clothing", "accessories"]),
      project_types: current.project_types.length
        ? current.project_types
        : filterValues<ProjectType>(metadata.projectTypes, [
            "dress",
            "skirt",
            "top",
            "pants",
            "jacket",
            "coat",
            "bag",
            "pouch",
            "hair_accessories",
            "textile_decoration",
          ]),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(buildPayload());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’enregistrer le patron.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error ? <Notice type="error">{error}</Notice> : null}

      <SectionCard
        title="Assistant photo"
        description="Ajoutez une photo du patron pour préremplir automatiquement les informations visibles."
      >
        <PatternPhotoAssistant onApply={applyExtractedMetadata} />
      </SectionCard>

      <SectionCard
        title="1. Informations principales"
        description="Renseignez le nom du modèle, son créateur et une courte description du patron."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nom du modèle" value={form.modelName} onChange={(event) => update("modelName", event.target.value)} required placeholder="Ex. Robe Magnolia" />
          <TextField label="Créateur / éditeur" value={form.designerName} onChange={(event) => update("designerName", event.target.value)} required placeholder="Ex. Atelier Couture ou Burda Style" />
          <label>
            <span className="label">Format</span>
            <select className="field" value={form.format} onChange={(event) => update("format", event.target.value as PatternFormState["format"])} required>
              <option value="">Choisir un format</option>
              <option value="physical">Physique</option>
              <option value="digital">Numérique</option>
              <option value="both">Physique et numérique</option>
            </select>
          </label>
          <TextField label="Repère sur la planche" value={form.magazinePatternIdentifier} onChange={(event) => update("magazinePatternIdentifier", event.target.value)} placeholder="Ex. M1, 12A, modèle 104" />
        </div>
        {initialPattern?.source_magazine ? (
          <div className="mt-4 rounded-md bg-linen px-4 py-3 text-sm font-semibold text-rosewood">
            Magazine source : {initialPattern.source_magazine.title || "Magazine"}{" "}
            {initialPattern.source_magazine.issue_number ? `- ${initialPattern.source_magazine.issue_number}` : ""}
          </div>
        ) : null}
        <div className="mt-4">
          <TextArea label="Petite description" value={form.description} onChange={(event) => update("description", event.target.value)} required placeholder="Quelques phrases sur la coupe, le style ou les détails du patron." />
        </div>
      </SectionCard>

      <SectionCard title="2. Informations couture" description="Ces choix reprennent les mêmes repères que les livres, sans l’option technique.">
        <div className="grid gap-5 lg:grid-cols-4">
          <CheckboxGroup title="Niveau" options={difficultyOptions} values={form.difficulty_levels} onChange={(values) => update("difficulty_levels", values)} />
          <div className="border-rosewood/10 lg:border-l lg:pl-4">
            <CheckboxGroup title="Public concerné" options={audienceOptions} values={form.target_audiences} onChange={(values) => update("target_audiences", values)} />
          </div>
          <div className="border-rosewood/10 lg:border-l lg:pl-4">
            <CheckboxGroup title="Catégorie principale" options={patternCategoryOptions} values={form.main_categories} onChange={(values) => update("main_categories", values)} />
          </div>
          <div className="border-rosewood/10 lg:border-l lg:pl-4">
            <CheckboxGroup title="Type de projet" options={projectOptions} values={form.project_types} onChange={(values) => update("project_types", values)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="3. Photo" description="Ajoutez une photo du patron pour l’identifier plus facilement.">
        <CoverUpload value={form.coverUrl} onChange={(url) => update("coverUrl", url)} />
      </SectionCard>

      <div className="sticky bottom-20 z-10 rounded-lg border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur lg:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-stone-600">Le patron sera enregistré en brouillon. Vous pourrez le compléter ou le modifier ensuite.</p>
          <Button type="submit" disabled={!canSave || saving} icon={<Save aria-hidden size={20} />}>
            {saving ? "Enregistrement..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function filterValues<T extends string>(values: string[] | undefined, allowed: T[]) {
  if (!values) return [];
  return values.filter((value): value is T => allowed.includes(value as T));
}
