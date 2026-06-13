import { useRouter } from "next/router";
import { AppLayout } from "@/layouts/AppLayout";
import { PatternForm } from "@/components/patterns/PatternForm";
import { createPattern } from "@/services/patterns";
import type { PatternPayload } from "@/types/pattern";

export default function AddPatternPage() {
  const router = useRouter();

  async function handleSubmit(payload: PatternPayload) {
    const pattern = await createPattern(payload);
    router.push(`/patterns/${pattern.id}/edit`);
  }

  return (
    <AppLayout title="Ajouter un patron" subtitle="Renseignez le modèle, son créateur, ses critères couture et une photo.">
      <PatternForm submitLabel="Enregistrer le patron" onSubmit={handleSubmit} />
    </AppLayout>
  );
}
