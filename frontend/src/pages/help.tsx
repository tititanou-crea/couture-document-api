import { HelpCircle, Mail, Phone } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { SectionCard } from "@/components/ui/SectionCard";

export default function HelpPage() {
  return (
    <AppLayout title="Aide / support" subtitle="Une page de repères simples pour accompagner les bénévoles.">
      <div className="grid gap-5 md:grid-cols-3">
        <section className="soft-panel p-6">
          <HelpCircle className="text-rosewood" size={34} aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Ajouter un livre</h2>
          <p className="mt-2 text-base leading-7 text-stone-600">Remplissez d’abord le titre. Les autres informations peuvent être ajoutées plus tard.</p>
        </section>
        <section className="soft-panel p-6">
          <Phone className="text-rosewood" size={34} aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Photo mobile</h2>
          <p className="mt-2 text-base leading-7 text-stone-600">Sur téléphone, le bouton photo peut ouvrir l’appareil photo directement.</p>
        </section>
        <section className="soft-panel p-6">
          <Mail className="text-rosewood" size={34} aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Besoin d’aide</h2>
          <p className="mt-2 text-base leading-7 text-stone-600">En cas de doute, contactez l’administratrice avant de supprimer une fiche.</p>
        </section>
      </div>

      <div className="mt-6">
        <SectionCard title="Conseils rassurants">
          <ul className="space-y-3 text-lg leading-8 text-stone-700">
            <li>Vous pouvez enregistrer une fiche même si elle n’est pas complète.</li>
            <li>L’ISBN se trouve souvent au dos du livre, près du code-barres.</li>
            <li>Les cases peuvent être cochées plusieurs fois quand un livre concerne plusieurs publics ou niveaux.</li>
            <li>Les modifications restent simples : ouvrez une fiche, corrigez, puis enregistrez.</li>
          </ul>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
