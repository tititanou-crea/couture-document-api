import { useRouter } from "next/router";
import { useEffect } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookForm } from "@/components/books/BookForm";
import { Notice } from "@/components/ui/Notice";
import { useAsyncState } from "@/hooks/useAsyncState";
import { getBook, updateBook } from "@/services/books";
import type { Book, BookPayload } from "@/types/book";

export default function EditBookPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const book = useAsyncState<Book>();

  useEffect(() => {
    if (id) {
      book.run(() => getBook(id)).catch(() => undefined);
    }
  }, [book.run, id]);

  async function handleSubmit(payload: BookPayload) {
    await updateBook(id, payload);
    router.push("/books");
  }

  const isMagazine = book.data?.document_type === "magazine";

  return (
    <AppLayout
      title={isMagazine ? "Modifier un magazine" : "Modifier un livre"}
      subtitle="Corrigez uniquement ce qui est utile. Les fiches peuvent évoluer doucement."
    >
      {book.error ? <Notice type="error">{book.error}</Notice> : null}
      {book.loading ? <p className="text-lg font-semibold text-rosewood">Chargement...</p> : null}
      {book.data ? (
        <BookForm
          initialBook={book.data}
          documentType={book.data.document_type}
          submitLabel="Enregistrer les modifications"
          onSubmit={handleSubmit}
        />
      ) : null}
    </AppLayout>
  );
}
