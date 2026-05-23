import { useRouter } from "next/router";
import { AppLayout } from "@/layouts/AppLayout";
import { BookForm } from "@/components/books/BookForm";
import { createBook } from "@/services/books";
import type { BookPayload } from "@/types/book";

export default function AddBookPage() {
  const router = useRouter();

  async function handleSubmit(payload: BookPayload) {
    const book = await createBook(payload);
    router.push(`/books/${book.id}/edit`);
  }

  return (
    <AppLayout title="Ajouter un livre" subtitle="Une seule page, organisée en sections claires. Remplissez ce que vous savez, le reste pourra attendre.">
      <BookForm submitLabel="Enregistrer le livre" onSubmit={handleSubmit} />
    </AppLayout>
  );
}
