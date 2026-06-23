import { Clock3 } from "lucide-react";

type Contributor = {
  first_name: string;
  last_name: string;
} | null | undefined;

type DocumentTraceProps = {
  createdAt: string;
  updatedAt: string;
  creator?: Contributor;
  lastModifier?: Contributor;
  compact?: boolean;
};

export function DocumentTrace({
  createdAt,
  updatedAt,
  creator,
  lastModifier,
  compact = false,
}: DocumentTraceProps) {
  return (
    <div
      className={
        compact
          ? "mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rosewood/10 pt-3 text-xs text-stone-500"
          : "rounded-lg bg-linen/60 px-4 py-3 text-sm text-stone-600"
      }
    >
      <span className="inline-flex items-center gap-1.5">
        <Clock3 aria-hidden size={compact ? 13 : 15} />
        Ajouté par {contributorName(creator)} le {formatDateTime(createdAt)}
      </span>
      <span>
        Modifié par {contributorName(lastModifier)} le {formatDateTime(updatedAt)}
      </span>
    </div>
  );
}

function contributorName(contributor: Contributor) {
  if (!contributor) return "une personne non renseignée";
  return `${contributor.first_name} ${contributor.last_name}`.trim();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
