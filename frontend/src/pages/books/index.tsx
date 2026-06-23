import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { useAsyncState } from "@/hooks/useAsyncState";
import { deleteBook, listBooks } from "@/services/books";
import type { PaginatedBooks } from "@/types/book";

export default function BooksPage() {
  const books = useAsyncState<PaginatedBooks>();
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 12;

  useEffect(() => {
    books.run(() => listBooks({ limit: pageSize, documentType: "book" })).catch(() => undefined);
  }, [books.run]);

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce livre ? Cette action est définitive.")) return;
    await deleteBook(id);
    books.run(() => listBooks({ limit: pageSize, documentType: "book" })).catch(() => undefined);
  }

  const loadMore = useCallback(async () => {
    if (!books.data || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await listBooks({
        limit: pageSize,
        offset: books.data.items.length,
        documentType: "book",
      });
      books.setData({ ...next, items: [...books.data.items, ...next.items] });
    } catch (error) {
      books.setError(error instanceof Error ? error.message : "Impossible de charger la suite.");
    } finally {
      setLoadingMore(false);
    }
  }, [books.data, books.setData, books.setError, loadingMore]);

  const bookItems = books.data?.items ?? [];

  return (
    <AppLayout title="Liste des livres" subtitle="Toutes les fiches de la bibliothèque, prêtes à être consultées ou corrigées.">
      <div className="mb-5 flex flex-wrap justify-end gap-3">
        <Link href="/magazines/add">
          <Button variant="secondary" icon={<PlusCircle aria-hidden size={20} />}>Ajouter un magazine</Button>
        </Link>
        <Link href="/books/add">
          <Button icon={<PlusCircle aria-hidden size={20} />}>Ajouter un livre</Button>
        </Link>
      </div>

      {books.error ? <Notice type="error">{books.error}</Notice> : null}
      {books.loading ? <p className="text-lg font-semibold text-rosewood">Chargement des livres...</p> : null}

      <div className="space-y-4">
        {bookItems.map((book) => <BookCard key={book.id} book={book} onDelete={handleDelete} />)}
      </div>

      {books.data && bookItems.length < books.data.total ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Chargement..." : `Afficher la suite (${books.data.total - bookItems.length})`}
          </Button>
        </div>
      ) : null}

      {!books.loading && bookItems.length === 0 ? (
        <EmptyState title="Aucun livre pour le moment">Ajoutez le premier livre pour commencer la bibliothèque BiblioCouture.</EmptyState>
      ) : null}
    </AppLayout>
  );
}
