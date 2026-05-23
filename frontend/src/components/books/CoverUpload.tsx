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

  async function handleFile(file?: File) {
    if (!file) return;
    const result = await upload.run(() => uploadCover(file));
    onChange(result.url);
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
          Sur téléphone, le bouton peut ouvrir l’appareil photo. Choisissez une image bien éclairée, la couverture entière si possible.
        </Notice>

        {upload.error ? <Notice type="error">{upload.error}</Notice> : null}

        <div className="flex flex-wrap gap-3">
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-rosewood px-5 py-3 text-base font-semibold text-white transition hover:bg-[#7c424b]">
            <Camera aria-hidden size={20} />
            Ajouter une photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
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
