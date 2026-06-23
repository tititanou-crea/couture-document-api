import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PatternCard } from "@/components/patterns/PatternCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { useAsyncState } from "@/hooks/useAsyncState";
import { deletePattern, listPatterns } from "@/services/patterns";
import type { PaginatedPatterns } from "@/types/pattern";

export default function PatternsPage() {
  const patterns = useAsyncState<PaginatedPatterns>();
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 12;

  useEffect(() => {
    patterns.run(() => listPatterns({ limit: pageSize, offset: 0 })).catch(() => undefined);
  }, [patterns.run]);

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce patron ? Cette action est définitive.")) return;
    await deletePattern(id);
    patterns.run(() => listPatterns({ limit: pageSize, offset: 0 })).catch(() => undefined);
  }

  const loadMore = useCallback(async () => {
    if (!patterns.data || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await listPatterns({ limit: pageSize, offset: patterns.data.items.length });
      patterns.setData({ ...next, items: [...patterns.data.items, ...next.items] });
    } catch (error) {
      patterns.setError(error instanceof Error ? error.message : "Impossible de charger la suite.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, patterns.data, patterns.setData, patterns.setError]);

  return (
    <AppLayout title="Liste des patrons" subtitle="Tous les patrons renseignés par les personnes connectées.">
      <div className="mb-5 flex justify-end">
        <Link href="/patterns/add">
          <Button icon={<PlusCircle aria-hidden size={20} />}>Ajouter un patron</Button>
        </Link>
      </div>

      {patterns.error ? <Notice type="error">{patterns.error}</Notice> : null}
      {patterns.loading ? <p className="text-lg font-semibold text-rosewood">Chargement des patrons...</p> : null}

      <div className="space-y-4">
        {patterns.data?.items.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} onDelete={handleDelete} />)}
      </div>

      {patterns.data && patterns.data.items.length < patterns.data.total ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Chargement..." : `Afficher la suite (${patterns.data.total - patterns.data.items.length})`}
          </Button>
        </div>
      ) : null}

      {!patterns.loading && patterns.data?.items.length === 0 ? (
        <EmptyState title="Aucun patron pour le moment">Ajoutez le premier patron pour commencer le catalogue.</EmptyState>
      ) : null}
    </AppLayout>
  );
}
