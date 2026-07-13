import { useEffect, useRef, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { CoverUpload } from "@/components/books/CoverUpload";
import { audienceOptions, difficultyOptions, projectOptions } from "@/utils/bookOptions";
import type {
  Pattern,
  PatternFormat,
  PatternPayload,
} from "@/types/pattern";

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
  secondCoverUrl: string | null;
  measurementChartUrl: string | null;
  magazinePatternIdentifier: string;
  difficulty_levels: PatternPayload["difficulty_levels"];
  target_audiences: PatternPayload["target_audiences"];
  main_categories: PatternPayload["main_categories"];
  project_types: PatternPayload["project_types"];
  availableSizes: string;
  availableSizeRanges: string;
  sizeEntries: string;
};

type PatternFormProps = {
  initialPattern?: Pattern | null;
  submitLabel: string;
  onSubmit: (payload: PatternPayload) => Promise<void>;
  onAutoSave?: (payload: PatternPayload) => Promise<void>;
};

function initialState(pattern?: Pattern | null): PatternFormState {
  return {
    modelName: pattern?.model_name ?? "",
    designerName: pattern?.designer_name ?? "",
    format: pattern?.format ?? "",
    description: pattern?.description ?? "",
    coverUrl: pattern?.cover_url ?? null,
    secondCoverUrl: pattern?.second_cover_url ?? null,
    measurementChartUrl: pattern?.measurement_chart_url ?? pattern?.source_magazine?.measurement_chart_url ?? null,
    magazinePatternIdentifier: pattern?.magazine_pattern_identifier ?? "",
    difficulty_levels: pattern?.difficulty_levels ?? [],
    target_audiences: pattern?.target_audiences ?? [],
    main_categories: pattern?.main_categories ?? [],
    project_types: pattern?.project_types ?? [],
    availableSizes: pattern?.available_sizes.join(", ") ?? "",
    availableSizeRanges: pattern?.available_size_ranges.join(", ") ?? "",
    sizeEntries: formatSizeEntries(pattern?.available_sizes, pattern?.available_size_ranges),
  };
}

export function PatternForm({ initialPattern, submitLabel, onSubmit, onAutoSave }: PatternFormProps) {
  const [form, setForm] = useState<PatternFormState>(() => initialState(initialPattern));
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastAutoSavedPayload = useRef("");
  const autoSaving = useRef(false);
  const isMagazinePattern = Boolean(initialPattern?.source_magazine);
  const sourceMagazineName = initialPattern?.source_magazine?.title ?? "";

  const hasDraftContent =
    form.modelName.trim().length > 0 ||
    form.designerName.trim().length > 0 ||
    Boolean(form.format) ||
    form.description.trim().length > 0 ||
    Boolean(form.coverUrl) ||
    Boolean(form.secondCoverUrl) ||
    Boolean(form.measurementChartUrl) ||
    form.magazinePatternIdentifier.trim().length > 0 ||
    form.sizeEntries.trim().length > 0 ||
    form.difficulty_levels.length > 0 ||
    form.target_audiences.length > 0 ||
    form.main_categories.length > 0 ||
    form.project_types.length > 0;

  useEffect(() => {
    if (!onAutoSave) return;
    const interval = window.setInterval(() => {
      if (!hasDraftContent || autoSaving.current) return;
      const payload = buildPayload();
      const serialized = JSON.stringify(payload);
      if (serialized === lastAutoSavedPayload.current) return;

      autoSaving.current = true;
      onAutoSave(payload)
        .then(() => {
          lastAutoSavedPayload.current = serialized;
          setAutoSaveStatus(`Brouillon sauvegardé automatiquement à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`);
        })
        .catch(() => setAutoSaveStatus("La sauvegarde automatique n’a pas pu se faire."))
        .finally(() => {
          autoSaving.current = false;
        });
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  });

  function update<K extends keyof PatternFormState>(key: K, value: PatternFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload(): PatternPayload {
    return {
      model_name: form.modelName.trim() || null,
      designer_name: isMagazinePattern ? sourceMagazineName || null : form.designerName.trim() || null,
      format: form.format || null,
      description: form.description.trim() || null,
      cover_url: form.coverUrl,
      second_cover_url: form.secondCoverUrl,
      measurement_chart_url: form.measurementChartUrl,
      magazine_pattern_identifier: form.magazinePatternIdentifier.trim() || null,
      source_magazine_id: initialPattern?.source_magazine_id ?? null,
      difficulty_levels: form.difficulty_levels,
      target_audiences: form.target_audiences,
      main_categories: form.main_categories,
      project_types: form.project_types,
      available_sizes: parseSizeEntries(form.sizeEntries).sizes,
      available_size_ranges: parseSizeEntries(form.sizeEntries).ranges,
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
      {autoSaveStatus ? <Notice>{autoSaveStatus}</Notice> : null}

      <SectionCard
        title="1. Informations principales"
        description={
          isMagazinePattern
            ? "Renseignez le nom du modèle, son repère dans le magazine et une courte description du patron."
            : "Renseignez le nom du modèle, son créateur et une courte description du patron."
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nom du modèle" value={form.modelName} onChange={(event) => update("modelName", event.target.value)} placeholder="Ex. Robe Magnolia" />
          {!isMagazinePattern ? (
            <TextField label="Créateur / éditeur" value={form.designerName} onChange={(event) => update("designerName", event.target.value)} placeholder="Ex. Atelier Couture ou Burda Style" />
          ) : null}
          <label>
            <span className="label">Format</span>
            <select className="field" value={form.format} onChange={(event) => update("format", event.target.value as PatternFormState["format"])}>
              <option value="">Choisir un format</option>
              <option value="physical">Physique</option>
              <option value="digital">Numérique</option>
              <option value="both">Physique et numérique</option>
            </select>
          </label>
          <TextField label="Repère sur la planche" value={form.magazinePatternIdentifier} onChange={(event) => update("magazinePatternIdentifier", event.target.value)} placeholder="Ex. M1, 12A, modèle 104" />
          <TextField
            label="Tailles ou intervalles"
            value={form.sizeEntries}
            onChange={(event) => update("sizeEntries", event.target.value)}
            placeholder="Ex. 34, 36, 38, 40, S, M, L, 34-46, XS-XL, 2-10 ans"
            help="Séparez chaque élément par une virgule. Tailles seules : 34, 36, S, M. Intervalles : 34-46, XS-XL, 2-10 ans."
          />
        </div>
        {initialPattern?.source_magazine ? (
          <div className="mt-4 rounded-md bg-linen px-4 py-3 text-sm font-semibold text-rosewood">
            Magazine source : {initialPattern.source_magazine.title || "Magazine"}{" "}
            {initialPattern.source_magazine.issue_number ? `- ${initialPattern.source_magazine.issue_number}` : ""}
          </div>
        ) : null}
        <div className="mt-4">
          <TextArea label="Petite description" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Quelques phrases sur la coupe, le style ou les détails du patron." />
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

      <SectionCard
        title="3. Photos"
        description="Ajoutez une photo principale et, si utile, une seconde vue du patron."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <p className="label">Photo principale</p>
            <CoverUpload value={form.coverUrl} onChange={(url) => update("coverUrl", url)} />
          </div>
          <div>
            <p className="label">Deuxième photo (facultatif)</p>
            <CoverUpload
              value={form.secondCoverUrl}
              onChange={(url) => update("secondCoverUrl", url)}
            />
          </div>
          <div className="xl:col-span-2">
            <p className="label">Tableau des mensurations (facultatif)</p>
            <CoverUpload
              value={form.measurementChartUrl}
              onChange={(url) => update("measurementChartUrl", url)}
            />
          </div>
        </div>
      </SectionCard>

      <div className="sticky bottom-20 z-10 rounded-lg border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur lg:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-stone-600">Le patron sera enregistré en brouillon. Vous pourrez le compléter ou le modifier ensuite.</p>
          <Button type="submit" disabled={saving} icon={<Save aria-hidden size={20} />}>
            {saving ? "Enregistrement..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function parseCommaList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function parseSizeEntries(value: string) {
  const entries = parseCommaList(value);
  return {
    sizes: entries.filter((entry) => !isSizeRange(entry)),
    ranges: entries.filter(isSizeRange),
  };
}

function isSizeRange(value: string) {
  const normalized = value.trim().toLowerCase();
  return /\S\s*[-–—]\s*\S/.test(normalized) || /\b(?:a|à|au|aux|jusqu)/.test(normalized);
}

function formatSizeEntries(sizes: string[] = [], ranges: string[] = []) {
  return [...sizes, ...ranges].join(", ");
}
