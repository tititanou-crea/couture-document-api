import { useState, type ChangeEvent } from "react";
import { BadgeCheck, Camera, ImagePlus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import {
  extractPatternMetadataFromPhoto,
  type ExtractedPatternMetadata,
} from "@/services/metadata";
import { uploadCover } from "@/services/upload";

type PatternPhotoAssistantProps = {
  onApply: (metadata: ExtractedPatternMetadata) => void;
};

export function PatternPhotoAssistant({ onApply }: PatternPhotoAssistantProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    setError(null);
    setStatus(null);
    setExtractedText(null);
    setPhoto(file);
    setPreview((current) => replacePreview(current, file));
  }

  async function handleAnalyzePhoto() {
    if (!photo) {
      setError("Ajoutez une photo du patron avant de lancer l’analyse.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const [uploadedPhoto, extractedMetadata] = await Promise.all([
        uploadCover(photo),
        extractPatternMetadataFromPhoto(photo),
      ]);
      const metadata = {
        ...extractedMetadata,
        coverUrl: uploadedPhoto.url,
      };

      onApply(metadata);
      setExtractedText(metadata.extractedText ?? null);
      setStatus(buildSuccessMessage(metadata));
    } catch (err) {
      setError(err instanceof Error ? err.message : "La photo n’a pas pu être analysée.");
    } finally {
      setLoading(false);
    }
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    setExtractedText(null);
    setStatus(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <Notice>
        Ajoutez une photo du patron. L’analyse lit les textes visibles pour proposer un préremplissage : modèle, créateur, format, description, niveau, public et type de projet.
      </Notice>

      <div className="overflow-hidden rounded-lg border border-rosewood/15 bg-white">
        <div className="flex min-h-64 items-center justify-center bg-cream">
          {preview ? (
            <img src={preview} alt="Photo du patron" className="h-full max-h-80 w-full object-contain" />
          ) : (
            <div className="px-5 text-center text-stone-600">
              <Sparkles className="mx-auto mb-3 text-rosewood" size={36} aria-hidden />
              <p className="font-semibold text-ink">Photo du patron</p>
              <p className="mt-1 text-sm leading-6">Pochette, fiche produit ou page de présentation</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-rosewood/10 p-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-rosewood px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c83b68] md:hidden">
            <Camera aria-hidden size={18} />
            Photographier
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="sr-only"
              onChange={handleInputChange}
            />
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-rosewood/25 bg-white px-4 py-2.5 text-sm font-semibold text-rosewood transition hover:bg-[#fff2f5]">
            <ImagePlus aria-hidden size={18} />
            Ajouter une image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleInputChange}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          icon={<Wand2 aria-hidden size={18} />}
          disabled={!photo || loading}
          onClick={handleAnalyzePhoto}
        >
          {loading ? "Analyse de la photo..." : "Extraire les informations"}
        </Button>
        {photo ? (
          <Button type="button" variant="quiet" icon={<Trash2 aria-hidden size={18} />} onClick={clearPhoto}>
            Effacer la photo
          </Button>
        ) : null}
      </div>

      {status ? (
        <Notice type="success">
          <span className="inline-flex items-center gap-2">
            <BadgeCheck aria-hidden size={18} />
            {status}
          </span>
        </Notice>
      ) : null}
      {error ? <Notice type="error">{error}</Notice> : null}

      {extractedText ? (
        <details className="rounded-lg border border-rosewood/15 bg-white p-4 text-sm leading-6 text-stone-600">
          <summary className="cursor-pointer font-semibold text-rosewood">Voir le texte reconnu</summary>
          <p className="mt-3 whitespace-pre-wrap">{extractedText}</p>
        </details>
      ) : null}
    </div>
  );
}

function replacePreview(current: string | null, file: File) {
  if (current) URL.revokeObjectURL(current);
  return URL.createObjectURL(file);
}

function buildSuccessMessage(metadata: ExtractedPatternMetadata) {
  const fields = [
    metadata.modelName ? "modèle" : "",
    metadata.designerName ? "créateur" : "",
    metadata.format ? "format" : "",
    metadata.description ? "description" : "",
    metadata.difficultyLevels?.length ? "niveau" : "",
    metadata.targetAudiences?.length ? "public" : "",
    metadata.mainCategories?.length ? "catégorie" : "",
    metadata.projectTypes?.length ? "type de projet" : "",
  ].filter(Boolean);

  if (!fields.length) {
    return "Analyse terminée, mais aucune information fiable n’a été reconnue.";
  }

  return `Champs proposés : ${fields.join(", ")}. Vérifiez rapidement avant d’enregistrer.`;
}
