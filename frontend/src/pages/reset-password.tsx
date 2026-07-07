import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PasswordField } from "@/components/ui/PasswordField";
import { resetPassword } from "@/services/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await resetPassword(token, password);
      setPassword("");
      setMessage("Votre mot de passe a été modifié. Vous pouvez vous connecter.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le mot de passe n’a pas pu être modifié.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un nouveau mot de passe.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? <Notice type="success">{message}</Notice> : null}
        {error ? <Notice type="error">{error}</Notice> : null}
        {!token ? <Notice type="error">Le lien de réinitialisation est incomplet.</Notice> : null}
        <PasswordField label="Nouveau mot de passe" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </Button>
        <Link href="/login" className="block text-center font-semibold text-rosewood underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </form>
    </AuthLayout>
  );
}
