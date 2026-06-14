import Link from "next/link";
import { useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { useAsyncState } from "@/hooks/useAsyncState";
import { deleteBook, listBooks } from "@/services/books";
import type { PaginatedBooks } from "@/types/book";

export default function MagazinesPage() {
  const magazines = useAsyncState<PaginatedBooks>();

  useEffect(() => {
    magazines.run(() => listBooks({ limit: 100, offset: 0 })).catch(() => undefined);
  }, [magazines.run]);

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce magazine ? Cette action est définitive.")) return;
    await deleteBook(id);
    magazines.run(() => listBooks({ limit: 100, offset: 0 })).catch(() => undefined);
  }

  const magazineItems =
    magazines.data?.items.filter((book) => book.document_type === "magazine") ?? [];

  return (
    <AppLayout
      title="Liste des magazines"
      subtitle="Tous les numéros enregistrés, avec leurs patrons reliés quand ils en contiennent."
    >
      <div className="mb-5 flex justify-end">
        <Link href="/magazines/add">
          <Button icon={<PlusCircle aria-hidden size={20} />}>Ajouter un magazine</Button>
        </Link>
      </div>

      {magazines.error ? <Notice type="error">{magazines.error}</Notice> : null}
      {magazines.loading ? (
        <p className="text-lg font-semibold text-rosewood">Chargement des magazines...</p>
      ) : null}

      <div className="space-y-4">
        {magazineItems.map((magazine) => (
          <BookCard key={magazine.id} book={magazine} onDelete={handleDelete} />
        ))}
      </div>

      {!magazines.loading && magazineItems.length === 0 ? (
        <EmptyState title="Aucun magazine pour le moment">
          Ajoutez le premier numéro pour commencer à relier les magazines et leurs patrons.
        </EmptyState>
      ) : null}
    </AppLayout>
  );
}
