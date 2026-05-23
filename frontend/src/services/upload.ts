import { API_ORIGIN, apiRequest } from "@/services/api";

export async function uploadCover(file: File) {
  const response = await apiRequest<{ url: string }>("/upload/cover", {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": file.type,
      "X-Filename": encodeURIComponent(file.name),
    },
  });
  return {
    url: response.url.startsWith("http") ? response.url : `${API_ORIGIN}${response.url}`,
  };
}
