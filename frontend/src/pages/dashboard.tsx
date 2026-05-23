import Link from "next/link";
import { BookPlus, Library, Search, Users } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { isAdmin } = useAuth();

  return (
    <AppLayout title="Accueil" subtitle="Un espace simple pour gérer la bibliothèque couture sans se perdre dans des menus compliqués.">
      <div className="grid gap-5 md:grid-cols-3">
        <Link href="/books/add" className="soft-panel block p-6 transition hover:-translate-y-0.5">
          <BookPlus className="text-rosewood" size={34} aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Ajouter un livre</h2>
          <p className="mt-2 text-base leading-7 text-stone-600">Une seule page claire, avec photo de couverture et informations couture.</p>
        </Link>
        <Link href="/books" className="soft-panel block p-6 transition hover:-translate-y-0.5">
          <Library className="text-rosewood" size={34} aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Voir les livres</h2>
          <p className="mt-2 text-base leading-7 text-stone-600">Consulter, corriger ou compléter les fiches déjà enregistrées.</p>
        </Link>
        <Link href="/books/search" className="soft-panel block p-6 transition hover:-translate-y-0.5">
          <Search className="text-rosewood" size={34} aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Rechercher</h2>
          <p className="mt-2 text-base leading-7 text-stone-600">Retrouver un titre, un auteur ou une maison d’édition.</p>
        </Link>
      </div>

      {isAdmin ? (
        <section className="soft-panel mt-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestion des bénévoles</h2>
              <p className="mt-2 text-base leading-7 text-stone-600">Créer les accès et garder la main sur les comptes de l’association.</p>
            </div>
            <Link href="/volunteers">
              <Button icon={<Users aria-hidden size={20} />}>Ouvrir</Button>
            </Link>
          </div>
        </section>
      ) : null}
    </AppLayout>
  );
}
