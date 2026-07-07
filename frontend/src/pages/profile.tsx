import { useState, type FormEvent } from "react";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PasswordField } from "@/components/ui/PasswordField";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/services/auth";

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: "", next: "" });
      setMessage("Votre mot de passe a été modifié.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le mot de passe n’a pas pu être modifié.");
    } finally {
      setLoading(false);
    }
  }

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

      <SectionCard title="Modifier mon mot de passe">
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          {message ? <Notice type="success">{message}</Notice> : null}
          {error ? <Notice type="error">{error}</Notice> : null}
          <PasswordField label="Mot de passe actuel" value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} required />
          <PasswordField label="Nouveau mot de passe" minLength={10} value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} required help="Choisissez au moins 10 caractères." />
          <Button type="submit" disabled={loading} icon={<KeyRound aria-hidden size={20} />}>
            {loading ? "Modification..." : "Modifier le mot de passe"}
          </Button>
        </form>
      </SectionCard>
    </AppLayout>
  );
}
