import { apiRequest } from "@/services/api";

export type ExtractedBookMetadata = {
  isbn?: string;
  title?: string | null;
  subtitle?: string | null;
  authors?: string[];
  publisher?: string | null;
  publishedYear?: string | null;
  pageCount?: number | null;
  description?: string | null;
  coverUrl?: string | null;
  extractedText?: string | null;
  confidence?: "high" | "medium" | "low" | null;
};

export async function extractBookMetadataFromPhotos(files: {
  coverPhoto?: File | null;
  backPhoto?: File | null;
}) {
  return apiRequest<ExtractedBookMetadata>("/metadata/extract-from-photos", {
    method: "POST",
    body: JSON.stringify({
      coverPhoto: files.coverPhoto ? { dataUrl: await fileToDataUrl(files.coverPhoto) } : null,
      backPhoto: files.backPhoto ? { dataUrl: await fileToDataUrl(files.backPhoto) } : null,
    }),
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire la photo."));
    reader.readAsDataURL(file);
  });
}
