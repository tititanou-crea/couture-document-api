import { useRouter } from "next/router";
import { AppLayout } from "@/layouts/AppLayout";
import { BookForm } from "@/components/books/BookForm";
import { createBook } from "@/services/books";
import type { BookPayload } from "@/types/book";

export default function AddMagazinePage() {
  const router = useRouter();

  async function handleSubmit(payload: BookPayload) {
    const magazine = await createBook(payload);
    router.push(`/books/${magazine.id}/edit`);
  }

  return (
    <AppLayout
      title="Ajouter un magazine"
      subtitle="Renseignez le numéro, sa couverture, ses techniques particulières et les patrons qu’il contient."
    >
      <BookForm documentType="magazine" submitLabel="Enregistrer le magazine" onSubmit={handleSubmit} />
    </AppLayout>
  );
}
