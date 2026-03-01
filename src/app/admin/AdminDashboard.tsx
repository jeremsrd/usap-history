"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Users, Calendar, Trophy, Swords, LogOut, Globe } from "lucide-react";

interface AdminDashboardProps {
  user: { email: string; name: string | null; role: string };
  stats: {
    players: number;
    matches: number;
    seasons: number;
    trophies: number;
    countries: number;
  };
}

const statCards = [
  { key: "players" as const, label: "Joueurs", icon: Users, href: "/admin/joueurs" },
  { key: "matches" as const, label: "Matchs", icon: Swords, href: "/admin/matchs" },
  { key: "seasons" as const, label: "Saisons", icon: Calendar, href: "/admin/saisons" },
  { key: "trophies" as const, label: "Trophées", icon: Trophy, href: "/admin/palmares" },
  { key: "countries" as const, label: "Pays", icon: Globe, href: "/admin/pays" },
];

export default function AdminDashboard({ user, stats }: AdminDashboardProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">
            <span className="text-usap-sang">Administration</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connecté en tant que {user.email} ({user.role})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-lg border border-border bg-usap-carte p-6 text-center transition-colors hover:border-usap-or/30"
          >
            <card.icon className="mx-auto mb-3 h-8 w-8 text-usap-or" />
            <div className="text-3xl font-bold text-usap-or">
              {stats[card.key]}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {card.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wider text-foreground">
          Actions rapides
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="Ajouter un match"
            description="Saisir le résultat d'un nouveau match"
            href="/admin/matchs"
          />
          <ActionCard
            title="Ajouter un joueur"
            description="Créer une fiche joueur"
            href="/admin/joueurs"
          />
          <ActionCard
            title="Gérer les saisons"
            description="Créer ou modifier une saison"
            href="/admin/saisons"
          />
          <ActionCard
            title="Gérer les pays"
            description="Ajouter ou modifier les pays référencés"
            href="/admin/pays"
          />
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-usap-carte p-5 transition-colors hover:border-usap-sang/30"
    >
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
