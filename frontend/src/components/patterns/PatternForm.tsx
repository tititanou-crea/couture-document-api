import { useMemo, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { CoverUpload } from "@/components/books/CoverUpload";
import {
  audienceOptions,
  categoryOptions,
  difficultyOptions,
  projectOptions,
} from "@/utils/bookOptions";
import type { Pattern, PatternFormat, PatternPayload } from "@/types/pattern";

const patternCategoryOptions = categoryOptions.filter((option) => option.value !== "technique") as {
  label: string;
  value: PatternPayload["main_categories"][number];
  hint?: string;
}[];

type PatternFormState = {
  modelName: string;
  designerName: string;
  format: PatternFormat | "";
  description: string;
  coverUrl: string | null;
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
        title="1. Informations principales"
        description="Renseignez le nom du modèle, son créateur et une courte description du patron."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nom du modèle" value={form.modelName} onChange={(event) => update("modelName", event.target.value)} required placeholder="Ex. Robe Magnolia" />
          <TextField label="Nom du créateur" value={form.designerName} onChange={(event) => update("designerName", event.target.value)} required placeholder="Ex. Atelier Couture" />
          <label>
            <span className="label">Format</span>
            <select className="field" value={form.format} onChange={(event) => update("format", event.target.value as PatternFormState["format"])} required>
              <option value="">Choisir un format</option>
              <option value="physical">Physique</option>
              <option value="digital">Numérique</option>
              <option value="both">Physique et numérique</option>
            </select>
          </label>
        </div>
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
