import { useState } from "react";
import { useRouter } from "next/router";
import { BookOpen, Newspaper, Shirt } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { BookForm } from "@/components/books/BookForm";
import { PatternForm } from "@/components/patterns/PatternForm";
import { Button } from "@/components/ui/Button";
import { createBook } from "@/services/books";
import { createPattern } from "@/services/patterns";
import type { BookPayload, DocumentType } from "@/types/book";
import type { PatternPayload } from "@/types/pattern";

type AddDocumentType = DocumentType | "pattern";

const documentTypes: {
  type: AddDocumentType;
  title: string;
  description: string;
  icon: typeof BookOpen;
}[] = [
  {
    type: "book",
    title: "Livre",
    description: "Un ouvrage de couture, de technique ou de projets.",
    icon: BookOpen,
  },
  {
    type: "magazine",
    title: "Magazine",
    description: "Un numéro de magazine avec ses projets et patrons.",
    icon: Newspaper,
  },
  {
    type: "pattern",
    title: "Patron",
    description: "Un patron indépendant, papier ou numérique.",
    icon: Shirt,
  },
];

const subtitles = {
  book: "Renseignez le livre, sa couverture et ses informations couture.",
  magazine: "Renseignez le numéro, sa couverture et les patrons qu’il contient.",
  pattern: "Renseignez le modèle, son créateur, ses critères couture et une photo.",
};

export default function AddDocumentPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<AddDocumentType | null>(null);

  async function handleBookSubmit(payload: BookPayload) {
    const document = await createBook(payload);
    router.push(`/books/${document.id}/edit`);
  }

  async function handlePatternSubmit(payload: PatternPayload) {
    const pattern = await createPattern(payload);
    router.push(`/patterns/${pattern.id}/edit`);
  }

  return (
    <AppLayout
      title={selectedType ? `Ajouter un ${selectedType === "pattern" ? "patron" : selectedType === "magazine" ? "magazine" : "livre"}` : "Ajouter"}
      subtitle={selectedType ? subtitles[selectedType] : "Choisissez d’abord le type de document à ajouter."}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          {documentTypes.map((documentType) => {
            const Icon = documentType.icon;
            const isSelected = selectedType === documentType.type;

            return (
              <button
                key={documentType.type}
                type="button"
                className={`soft-panel flex min-h-40 flex-col items-start p-5 text-left transition hover:-translate-y-0.5 ${
                  isSelected ? "ring-2 ring-rosewood" : ""
                }`}
                aria-pressed={isSelected}
                onClick={() => setSelectedType(documentType.type)}
              >
                <Icon className="text-rosewood" size={30} aria-hidden />
                <span className="mt-4 text-xl font-bold text-ink">{documentType.title}</span>
                <span className="mt-2 text-sm leading-6 text-stone-600">{documentType.description}</span>
              </button>
            );
          })}
        </section>

        {selectedType ? (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setSelectedType(null)}>
              Changer de type
            </Button>
          </div>
        ) : null}

        {selectedType === "book" ? (
          <BookForm key="book" documentType="book" submitLabel="Enregistrer le livre" onSubmit={handleBookSubmit} />
        ) : null}

        {selectedType === "magazine" ? (
          <BookForm key="magazine" documentType="magazine" submitLabel="Enregistrer le magazine" onSubmit={handleBookSubmit} />
        ) : null}

        {selectedType === "pattern" ? (
          <PatternForm submitLabel="Enregistrer le patron" onSubmit={handlePatternSubmit} />
        ) : null}
      </div>
    </AppLayout>
  );
}
