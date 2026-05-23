import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <AppLayout title="Profil utilisateur" subtitle="Votre accès à BiblioCouture, simplement.">
      <SectionCard title="Mon accès">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-rosewood/10 bg-white p-5">
            <UserRound className="text-rosewood" size={30} aria-hidden />
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">Identifiant</p>
            <p className="mt-1 break-all text-lg font-bold">{user?.id}</p>
          </div>
          <div className="rounded-lg border border-rosewood/10 bg-white p-5">
            <ShieldCheck className="text-rosewood" size={30} aria-hidden />
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">Rôle</p>
            <p className="mt-1 text-lg font-bold">{isAdmin ? "Administratrice" : "Bénévole"}</p>
          </div>
        </div>
        <Button className="mt-6" variant="secondary" onClick={logout} icon={<LogOut aria-hidden size={20} />}>
          Se déconnecter
        </Button>
      </SectionCard>
    </AppLayout>
  );
}
