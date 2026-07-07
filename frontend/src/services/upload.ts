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

export async function prepareEditedImageForUpload(
  file: File,
  edits: { rotation: number; flipHorizontal: boolean; zoom: number },
) {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const normalizedRotation = ((edits.rotation % 360) + 360) % 360;
  const quarterTurn = normalizedRotation === 90 || normalizedRotation === 270;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const outputWidth = quarterTurn ? sourceHeight : sourceWidth;
  const outputHeight = quarterTurn ? sourceWidth : sourceHeight;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.translate(outputWidth / 2, outputHeight / 2);
  context.rotate((normalizedRotation * Math.PI) / 180);
  context.scale(edits.flipHorizontal ? -edits.zoom : edits.zoom, edits.zoom);
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);

  const blob = await canvasToBlob(canvas, "image/webp", 0.86);
  if (!blob) return file;

  return new File([blob], replaceExtension(file.name, "webp"), {
    type: "image/webp",
    lastModified: Date.now(),
  });
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
