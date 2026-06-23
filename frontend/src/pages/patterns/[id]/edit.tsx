import { useRouter } from "next/router";
import { useEffect } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { PatternForm } from "@/components/patterns/PatternForm";
import { Notice } from "@/components/ui/Notice";
import { useAsyncState } from "@/hooks/useAsyncState";
import { getPattern, updatePattern } from "@/services/patterns";
import type { Pattern, PatternPayload } from "@/types/pattern";

export default function EditPatternPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const pattern = useAsyncState<Pattern>();

  useEffect(() => {
    if (id) {
      pattern.run(() => getPattern(id)).catch(() => undefined);
    }
  }, [pattern.run, id]);

  async function handleSubmit(payload: PatternPayload) {
    await updatePattern(id, payload);
    router.push(`/patterns/${id}`);
  }

  return (
    <AppLayout title="Modifier un patron" subtitle="Mettez à jour uniquement les informations utiles.">
      {pattern.error ? <Notice type="error">{pattern.error}</Notice> : null}
      {pattern.loading ? <p className="text-lg font-semibold text-rosewood">Chargement du patron...</p> : null}
      {pattern.data ? <PatternForm initialPattern={pattern.data} submitLabel="Enregistrer les modifications" onSubmit={handleSubmit} /> : null}
    </AppLayout>
  );
}
