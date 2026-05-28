import { useState, type ChangeEvent } from "react";
import { BadgeCheck, Camera, ImagePlus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { extractBookMetadataFromPhotos, type ExtractedBookMetadata } from "@/services/metadata";
import { uploadCover } from "@/services/upload";

type BookPhotoAssistantProps = {
  onApply: (metadata: ExtractedBookMetadata) => void;
};

type PhotoSide = "cover" | "back";

export function BookPhotoAssistant({ onApply }: BookPhotoAssistantProps) {
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasPhotos = Boolean(coverPhoto || backPhoto);

  function handleInputChange(side: PhotoSide, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    setError(null);
    setStatus(null);
    setExtractedText(null);

    if (side === "cover") {
      setCoverPhoto(file);
      setCoverPreview((current) => replacePreview(current, file));
      return;
    }

    setBackPhoto(file);
    setBackPreview((current) => replacePreview(current, file));
  }

  async function handleAnalyzePhotos() {
    if (!hasPhotos) {
      setError("Ajoutez au moins une photo du livre avant de lancer l’analyse.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const [uploadedCover, extractedMetadata] = await Promise.all([
        coverPhoto ? uploadCover(coverPhoto) : Promise.resolve(null),
        extractBookMetadataFromPhotos({ coverPhoto, backPhoto }),
      ]);

      const metadata = {
        ...extractedMetadata,
        coverUrl: uploadedCover?.url ?? extractedMetadata.coverUrl ?? null,
      };

      onApply(metadata);
      setExtractedText(metadata.extractedText ?? null);
      setStatus(buildSuccessMessage(metadata));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Les photos n’ont pas pu être analysées.");
    } finally {
      setLoading(false);
    }
  }

  function clearPhotos() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setCoverPhoto(null);
    setBackPhoto(null);
    setCoverPreview(null);
    setBackPreview(null);
    setExtractedText(null);
    setStatus(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <Notice>
        Prenez la couverture et le dos du livre. L’analyse lit les textes visibles pour proposer un préremplissage : titre, sous-titre, auteur, éditeur, ISBN, année, nombre de pages et résumé.
      </Notice>

      <div className="grid gap-4 md:grid-cols-2">
        <PhotoPicker
          title="Couverture"
          description="Titre, sous-titre, auteur, collection"
          preview={coverPreview}
          side="cover"
          onChange={handleInputChange}
        />
        <PhotoPicker
          title="Dos du livre"
          description="Résumé, ISBN, éditeur, nombre de pages"
          preview={backPreview}
          side="back"
          onChange={handleInputChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          icon={<Wand2 aria-hidden size={18} />}
          disabled={!hasPhotos || loading}
          onClick={handleAnalyzePhotos}
        >
          {loading ? "Analyse des photos..." : "Extraire les informations"}
        </Button>
        {hasPhotos ? (
          <Button type="button" variant="quiet" icon={<Trash2 aria-hidden size={18} />} onClick={clearPhotos}>
            Effacer les photos
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

type PhotoPickerProps = {
  title: string;
  description: string;
  preview: string | null;
  side: PhotoSide;
  onChange: (side: PhotoSide, event: ChangeEvent<HTMLInputElement>) => void;
};

function PhotoPicker({ title, description, preview, side, onChange }: PhotoPickerProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-rosewood/15 bg-white">
      <div className="flex min-h-64 items-center justify-center bg-cream">
        {preview ? (
          <img src={preview} alt={title} className="h-full max-h-80 w-full object-contain" />
        ) : (
          <div className="px-5 text-center text-stone-600">
            <Sparkles className="mx-auto mb-3 text-rosewood" size={36} aria-hidden />
            <p className="font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm leading-6">{description}</p>
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
            onChange={(event) => onChange(side, event)}
          />
        </label>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-rosewood/25 bg-white px-4 py-2.5 text-sm font-semibold text-rosewood transition hover:bg-[#fff2f5]">
          <ImagePlus aria-hidden size={18} />
          Ajouter une image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => onChange(side, event)}
          />
        </label>
      </div>
    </div>
  );
}

function replacePreview(current: string | null, file: File) {
  if (current) URL.revokeObjectURL(current);
  return URL.createObjectURL(file);
}

function buildSuccessMessage(metadata: ExtractedBookMetadata) {
  const fields = [
    metadata.title ? "titre" : "",
    metadata.subtitle ? "sous-titre" : "",
    metadata.authors?.length ? "auteur" : "",
    metadata.publisher ? "éditeur" : "",
    metadata.isbn ? "ISBN" : "",
    metadata.publishedYear ? "année" : "",
    metadata.pageCount ? "pages" : "",
    metadata.description ? "résumé" : "",
  ].filter(Boolean);

  if (!fields.length) {
    return "Analyse terminée, mais aucune information fiable n’a été reconnue.";
  }

  return `Champs proposés : ${fields.join(", ")}. Vérifiez rapidement avant d’enregistrer.`;
}
