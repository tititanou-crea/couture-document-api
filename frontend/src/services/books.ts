import { apiRequest } from "@/services/api";
import type { Book, BookPayload, PaginatedBooks } from "@/types/book";

export function listBooks(params = { limit: 20, offset: 0 }) {
  return apiRequest<PaginatedBooks>(`/books?limit=${params.limit}&offset=${params.offset}`);
}

export function searchBooks(query: string, params = { limit: 20, offset: 0 }) {
  const search = new URLSearchParams({
    q: query,
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return apiRequest<PaginatedBooks>(`/books/search?${search.toString()}`);
}

export function getBook(id: string) {
  return apiRequest<Book>(`/books/${id}`);
}

export function createBook(payload: BookPayload) {
  return apiRequest<Book>("/books", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBook(id: string, payload: Partial<BookPayload>) {
  return apiRequest<Book>(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBook(id: string) {
  return apiRequest<void>(`/books/${id}`, { method: "DELETE" });
}
