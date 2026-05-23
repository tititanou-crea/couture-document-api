import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      const next = typeof router.query.next === "string" ? router.query.next : "/dashboard";
      router.replace(next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Connexion" subtitle="Entrez simplement vos identifiants.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <Notice type="error">{error}</Notice> : null}
        <TextField label="Adresse email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="prenom@association.fr" autoComplete="email" />
        <TextField label="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Votre mot de passe" autoComplete="current-password" />
        <Button type="submit" className="w-full" disabled={loading} icon={<LogIn aria-hidden size={20} />}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </AuthLayout>
  );
}
