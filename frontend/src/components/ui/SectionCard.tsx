import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function SectionCard({
  title,
  description,
  children,
  collapsible = true,
  defaultOpen = true,
}: SectionCardProps) {
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="soft-panel p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-rosewood/10 pb-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{description}</p> : null}
        </div>
        {collapsible ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-rosewood/15 bg-white text-rosewood transition hover:bg-[#fff2f5]"
            aria-expanded={isOpen}
            aria-controls={contentId}
            aria-label={isOpen ? `Replier ${title}` : `Déplier ${title}`}
            onClick={() => setIsOpen((value) => !value)}
          >
            <ChevronDown
              aria-hidden
              size={20}
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>
      {isOpen ? <div id={contentId}>{children}</div> : null}
    </section>
  );
}
