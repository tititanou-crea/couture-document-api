import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { forgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await forgotPassword(email);
      setMessage("Si cette adresse existe, une aide de réinitialisation sera envoyée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "La demande n’a pas pu être envoyée.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Indiquez votre adresse email.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? <Notice type="success">{message}</Notice> : null}
        {error ? <Notice type="error">{error}</Notice> : null}
        <TextField label="Adresse email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="prenom@association.fr" />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Envoi..." : "Recevoir de l’aide"}
        </Button>
        <Link href="/login" className="block text-center font-semibold text-rosewood underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </form>
    </AuthLayout>
  );
}
