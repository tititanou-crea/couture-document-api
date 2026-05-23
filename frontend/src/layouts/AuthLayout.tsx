import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-rosewood/10 bg-white shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col items-center justify-center bg-cream p-8 text-center sm:p-10">
          <p className="font-serif text-4xl italic text-ink">BiblioCouture</p>
          <p className="mt-3 max-w-xs text-base leading-7 text-stone-600">
            Catalogue des livres couture et techniques
          </p>
          <img
            src="/illustrations/sewing-books.svg"
            alt="Illustration couture avec livres et bobine de fil"
            className="mt-7 w-full max-w-md"
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <h2 className="text-3xl font-bold text-ink">{title}</h2>
          <p className="mt-3 text-lg leading-8 text-stone-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 rounded-lg bg-[#fff0f2] p-4 text-sm leading-6 text-stone-700">
            Première connexion ? Contactez l’administratrice pour obtenir vos identifiants.
          </div>
        </div>
      </section>
    </main>
  );
}
