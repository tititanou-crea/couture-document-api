import { useRouter } from "next/router";
import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookForm } from "@/components/books/BookForm";
import { createBook, updateBook } from "@/services/books";
import type { BookPayload } from "@/types/book";

export default function AddBookPage() {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);

  async function handleSubmit(payload: BookPayload) {
    if (draftId) {
      await updateBook(draftId, payload);
      router.push(`/books/${draftId}/edit`);
      return;
    }
    const book = await createBook(payload);
    router.push(`/books/${book.id}/edit`);
  }

  async function handleAutoSave(payload: BookPayload) {
    if (draftId) {
      await updateBook(draftId, payload);
      return;
    }
    const book = await createBook(payload);
    setDraftId(book.id);
  }

  return (
    <AppLayout title="Ajouter un livre" subtitle="Une seule page, organisée en sections claires. Remplissez ce que vous savez, le reste pourra attendre.">
      <BookForm documentType="book" submitLabel="Enregistrer le livre" onSubmit={handleSubmit} onAutoSave={handleAutoSave} />
    </AppLayout>
  );
}
