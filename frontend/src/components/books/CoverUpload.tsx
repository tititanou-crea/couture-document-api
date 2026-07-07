import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Camera, FlipHorizontal, ImagePlus, RotateCcw, RotateCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { Notice } from "@/components/ui/Notice";
import { prepareEditedImageForUpload, uploadCover } from "@/services/upload";
import { useAsyncState } from "@/hooks/useAsyncState";

type CoverUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function CoverUpload({ value, onChange }: CoverUploadProps) {
  const upload = useAsyncState<{ url: string }>();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [zoom, setZoom] = useState(1);

  const previewStyle = useMemo(
    () => ({
      transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scale(${zoom})`,
    }),
    [flipHorizontal, rotation, zoom],
  );

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  async function handleFile(file?: File | null) {
    if (!file) return;
    setPendingFile(file);
    setRotation(0);
    setFlipHorizontal(false);
    setZoom(1);
  }

  async function uploadPendingFile() {
    if (!pendingFile) return;
    const result = await upload.run(async () => {
      const editedFile = await prepareEditedImageForUpload(pendingFile, {
        rotation,
        flipHorizontal,
        zoom,
      });
      return uploadCover(editedFile);
    });
    setPendingFile(null);
    onChange(result.url);
  }

  async function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    await handleFile(file);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[260px_1fr]">
      <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-lg border border-dashed border-rosewood/30 bg-cream">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Aperçu de la photo à envoyer"
            className="max-h-full max-w-full object-contain transition-transform"
            style={previewStyle}
          />
        ) : value ? (
          <CoverImage src={value} alt="Aperçu de la couverture" />
        ) : (
          <div className="px-6 text-center text-stone-600">
            <ImagePlus className="mx-auto mb-3 text-rosewood" size={42} aria-hidden />
            <p className="font-semibold text-ink">Aucune couverture pour le moment</p>
            <p className="mt-2 text-sm leading-6">Vous pouvez ajouter une photo maintenant ou compléter plus tard.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Notice>
          Sur téléphone, vous pouvez prendre une nouvelle photo ou choisir une image déjà présente dans votre galerie.
        </Notice>

        {upload.error ? <Notice type="error">{upload.error}</Notice> : null}

        {pendingFile ? (
          <div className="space-y-3 rounded-lg border border-rosewood/10 bg-white p-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" icon={<RotateCcw aria-hidden size={18} />} onClick={() => setRotation((value) => value - 90)}>
                Tourner à gauche
              </Button>
              <Button type="button" variant="secondary" icon={<RotateCw aria-hidden size={18} />} onClick={() => setRotation((value) => value + 90)}>
                Tourner à droite
              </Button>
              <Button type="button" variant="secondary" icon={<FlipHorizontal aria-hidden size={18} />} onClick={() => setFlipHorizontal((value) => !value)}>
                Retourner
              </Button>
            </div>
            <label className="block">
              <span className="label">Redimensionner</span>
              <input
                className="w-full accent-rosewood"
                type="range"
                min="0.6"
                max="1.8"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="button" icon={<Upload aria-hidden size={18} />} onClick={uploadPendingFile} disabled={upload.loading}>
                Envoyer cette photo
              </Button>
              <Button type="button" variant="quiet" onClick={() => setPendingFile(null)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-rosewood px-5 py-3 text-base font-semibold text-white transition hover:bg-[#7c424b] md:hidden">
            <Camera aria-hidden size={20} />
            Prendre une photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="sr-only"
              onChange={handleInputChange}
            />
          </label>

          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-rosewood/25 bg-white px-5 py-3 text-base font-semibold text-rosewood transition hover:bg-[#fff2f5] md:hidden">
            <ImagePlus aria-hidden size={20} />
            Choisir dans les photos
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleInputChange}
            />
          </label>

          <label className="hidden min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-rosewood px-5 py-3 text-base font-semibold text-white transition hover:bg-[#7c424b] md:inline-flex">
            <ImagePlus aria-hidden size={20} />
            Ajouter une photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleInputChange}
            />
          </label>

          {value ? (
            <Button variant="secondary" type="button" icon={<Trash2 aria-hidden size={20} />} onClick={() => onChange(null)}>
              Supprimer
            </Button>
          ) : null}
        </div>

        {upload.loading ? <p className="text-base font-semibold text-rosewood">Envoi de la photo en cours...</p> : null}
      </div>
    </div>
  );
}
