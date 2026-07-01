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
          ? "mt-4 flex items-start gap-1.5 border-t border-rosewood/10 pt-3 text-xs text-stone-500"
          : "flex items-start gap-2 rounded-lg bg-linen/60 px-4 py-3 text-sm text-stone-600"
      }
    >
      <Clock3 aria-hidden className="mt-0.5 shrink-0" size={compact ? 13 : 15} />
      <div className="min-w-0 space-y-1">
        <p>Ajouté par {contributorName(creator)} le {formatDateTime(createdAt)}</p>
        <p>Modifié par {contributorName(lastModifier)} le {formatDateTime(updatedAt)}</p>
      </div>
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
