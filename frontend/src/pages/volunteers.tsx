import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PasswordField } from "@/components/ui/PasswordField";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useAsyncState } from "@/hooks/useAsyncState";
import { useAuth } from "@/hooks/useAuth";
import { createUser, listUsers, resetUserPassword } from "@/services/users";
import type { Volunteer } from "@/types/auth";

export default function VolunteersPage() {
  const { isAdmin } = useAuth();
  const volunteers = useAsyncState<Volunteer[]>();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAdmin) {
      volunteers.run(() => listUsers()).catch(() => undefined);
    }
  }, [isAdmin, volunteers.run]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    await createUser({ ...form, role: "volunteer" });
    setForm({ first_name: "", last_name: "", email: "", password: "" });
    setMessage("Le compte bénévole a été créé.");
    volunteers.run(() => listUsers()).catch(() => undefined);
  }

  async function handlePasswordReset(event: FormEvent, volunteerId: string) {
    event.preventDefault();
    const password = resetPasswords[volunteerId] ?? "";
    await resetUserPassword(volunteerId, password);
    setResetPasswords((current) => ({ ...current, [volunteerId]: "" }));
    setMessage("Le mot de passe provisoire a été mis à jour.");
    volunteers.run(() => listUsers()).catch(() => undefined);
  }

  if (!isAdmin) {
    return (
      <AppLayout title="Gestion bénévoles" subtitle="Cette page est réservée à l’administratrice.">
        <Notice type="error">Vous n’avez pas accès à cette gestion.</Notice>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Gestion bénévoles" subtitle="Créer les comptes des bénévoles. Il n’y a pas d’inscription publique.">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Créer un compte">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {message ? <Notice type="success">{message}</Notice> : null}
            {volunteers.error ? <Notice type="error">{volunteers.error}</Notice> : null}
            <TextField label="Prénom" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} required />
            <TextField label="Nom" value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} required />
            <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            <PasswordField label="Mot de passe provisoire" minLength={10} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required help="Choisissez au moins 10 caractères. Vous pourrez le transmettre à la bénévole." />
            <Button type="submit" icon={<UserPlus aria-hidden size={20} />}>Créer le compte</Button>
          </form>
        </SectionCard>

        <SectionCard title="Comptes existants">
          {volunteers.loading ? <p className="text-rosewood font-semibold">Chargement...</p> : null}
          <div className="space-y-3">
            {volunteers.data?.map((volunteer) => (
              <div key={volunteer.id} className="rounded-lg border border-rosewood/10 bg-white p-4">
                <p className="text-lg font-bold">{volunteer.first_name} {volunteer.last_name}</p>
                <p className="text-stone-600">{volunteer.email}</p>
                <p className="mt-2 text-sm font-semibold text-rosewood">{volunteer.role === "admin" ? "Administratrice" : "Bénévole"}</p>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => handlePasswordReset(event, volunteer.id)}>
                  <PasswordField
                    label="Nouveau mot de passe provisoire"
                    minLength={10}
                    value={resetPasswords[volunteer.id] ?? ""}
                    onChange={(event) => setResetPasswords({ ...resetPasswords, [volunteer.id]: event.target.value })}
                    required
                  />
                  <Button className="self-end" type="submit" variant="secondary" icon={<KeyRound aria-hidden size={18} />}>
                    Réinitialiser
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
