import { useRouter } from "next/router";
import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookForm } from "@/components/books/BookForm";
import { createBook, updateBook } from "@/services/books";
import type { BookPayload } from "@/types/book";

export default function AddMagazinePage() {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);

  async function handleSubmit(payload: BookPayload) {
    if (draftId) {
      await updateBook(draftId, payload);
      router.push(`/books/${draftId}/edit`);
      return;
    }
    const magazine = await createBook(payload);
    router.push(`/books/${magazine.id}/edit`);
  }

  async function handleAutoSave(payload: BookPayload) {
    if (draftId) {
      await updateBook(draftId, payload);
      return;
    }
    const magazine = await createBook(payload);
    setDraftId(magazine.id);
  }

  return (
    <AppLayout
      title="Ajouter un magazine"
      subtitle="Renseignez le numéro, sa couverture, ses techniques particulières et les patrons qu’il contient."
    >
      <BookForm documentType="magazine" submitLabel="Enregistrer le magazine" onSubmit={handleSubmit} onAutoSave={handleAutoSave} />
    </AppLayout>
  );
}
