import { useRouter } from "next/router";
import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { PatternForm } from "@/components/patterns/PatternForm";
import { createPattern, updatePattern } from "@/services/patterns";
import type { PatternPayload } from "@/types/pattern";

export default function AddPatternPage() {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);

  async function handleSubmit(payload: PatternPayload) {
    if (draftId) {
      await updatePattern(draftId, payload);
      router.push(`/patterns/${draftId}/edit`);
      return;
    }
    const pattern = await createPattern(payload);
    router.push(`/patterns/${pattern.id}/edit`);
  }

  async function handleAutoSave(payload: PatternPayload) {
    if (draftId) {
      await updatePattern(draftId, payload);
      return;
    }
    const pattern = await createPattern(payload);
    setDraftId(pattern.id);
  }

  return (
    <AppLayout
      title="Ajouter un patron"
      subtitle="Renseignez le modèle, son créateur, ses critères couture et jusqu’à deux photos."
    >
      <PatternForm submitLabel="Enregistrer le patron" onSubmit={handleSubmit} onAutoSave={handleAutoSave} />
    </AppLayout>
  );
}
