import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import {
  CircleHelp,
  Home,
  Library,
  LogOut,
  PlusCircle,
  Search,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

type AppLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const navigation = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/books", label: "Livres", icon: Library },
  { href: "/books/search", label: "Recherche", icon: Search },
  { href: "/books/add", label: "Ajouter", icon: PlusCircle },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/volunteers", label: "Bénévoles", icon: Users, adminOnly: true },
  { href: "/help", label: "Aide", icon: CircleHelp },
];

export function AppLayout({ title, subtitle, children }: AppLayoutProps) {
  const router = useRouter();
  const { loading, isAdmin, logout } = useAuth();

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center p-6 text-lg">Préparation de votre espace...</main>;
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-rosewood/10 bg-white/95 px-2 py-2 shadow-soft backdrop-blur lg:inset-y-0 lg:left-0 lg:right-auto lg:w-48 lg:border-r lg:border-t-0 lg:px-4 lg:py-5">
        <div className="mb-8 hidden items-center gap-2 lg:flex">
          <img src="/illustrations/sewing-books.svg" alt="" className="h-9 w-9 rounded-md object-cover" />
          <div>
            <p className="font-serif text-lg italic text-ink">BiblioCouture</p>
          </div>
        </div>

        <nav className="grid grid-cols-6 gap-1 lg:block lg:space-y-2" aria-label="Navigation principale">
          {navigation
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const active = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-semibold transition lg:min-h-10 lg:flex-row lg:justify-start lg:px-3 lg:text-sm ${
                    active ? "bg-[#fff0f2] text-rosewood" : "text-ink hover:bg-cream"
                  }`}
                >
                  <Icon aria-hidden size={20} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
        </nav>

        <Button
          variant="quiet"
          className="mt-8 hidden w-full justify-start lg:flex"
          icon={<LogOut aria-hidden size={20} />}
          onClick={logout}
        >
          Déconnexion
        </Button>
      </aside>

      <main className="pb-28 lg:ml-48 lg:pb-10">
        <header className="border-b border-rosewood/10 bg-white/45 px-5 py-5 backdrop-blur sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{subtitle}</p> : null}
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8 sm:py-6">{children}</div>
      </main>
    </div>
  );
}
