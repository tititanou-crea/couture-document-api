import { useRouter } from "next/router";
import { useEffect, useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      window.location.assign(getRedirectTarget(router.query.next));
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
        {loading ? <Notice>{getLoginStatus(elapsedSeconds)}</Notice> : null}
        <TextField label="Adresse email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="prenom@association.fr" autoComplete="email" />
        <PasswordField label="Mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Votre mot de passe" autoComplete="current-password" />
        <Button type="submit" className="w-full" disabled={loading} icon={<LogIn aria-hidden size={20} />}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function getLoginStatus(elapsedSeconds: number) {
  if (elapsedSeconds >= 15) {
    return `Le serveur répond très lentement (${elapsedSeconds} s). L'application va arrêter l'attente si ça dure encore.`;
  }
  if (elapsedSeconds >= 5) {
    return `Connexion en cours (${elapsedSeconds} s). Le serveur est peut-être en train de se réveiller.`;
  }
  return "Connexion au serveur...";
}

function getRedirectTarget(next: string | string[] | undefined) {
  if (typeof next !== "string") return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  if (next === "/" || next.startsWith("/login")) return "/dashboard";
  return next;
}
