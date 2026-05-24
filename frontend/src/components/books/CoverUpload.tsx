import type { ChangeEvent } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { uploadCover } from "@/services/upload";
import { useAsyncState } from "@/hooks/useAsyncState";

type CoverUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function CoverUpload({ value, onChange }: CoverUploadProps) {
  const upload = useAsyncState<{ url: string }>();

  async function handleFile(file?: File | null) {
    if (!file) return;
    const result = await upload.run(() => uploadCover(file));
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
        {value ? (
          <img src={value} alt="Aperçu de la couverture" className="h-full w-full object-cover" />
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
