import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="soft-panel p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-rosewood/10 pb-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
