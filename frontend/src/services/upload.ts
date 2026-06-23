import { API_ORIGIN, apiRequest } from "@/services/api";

export async function uploadCover(file: File) {
  const uploadFile = await optimizeImageForUpload(file);
  const response = await apiRequest<{ url: string }>("/upload/cover", {
    method: "POST",
    body: uploadFile,
    headers: {
      "Content-Type": uploadFile.type,
      "X-Filename": encodeURIComponent(uploadFile.name),
    },
  });
  return {
    url: response.url.startsWith("http") ? response.url : `${API_ORIGIN}${response.url}`,
  };
}

async function optimizeImageForUpload(file: File) {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  try {
    const image = await loadImage(file);
    const maxDimension = 1600;
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    if (ratio === 1 && file.size < 900_000) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, "image/webp", 0.78);
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], replaceExtension(file.name, "webp"), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function replaceExtension(filename: string, extension: string) {
  const cleanExtension = extension.replace(/^\./, "");
  const basename = filename.replace(/\.[^.]+$/, "");
  return `${basename || "cover"}.${cleanExtension}`;
}
