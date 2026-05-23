import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";

type EmptyStateProps = {
  title: string;
  children: ReactNode;
};

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="soft-panel px-6 py-12 text-center">
      <BookOpen className="mx-auto text-rosewood" size={44} aria-hidden />
      <h2 className="mt-4 text-2xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-stone-600">{children}</p>
    </div>
  );
}
