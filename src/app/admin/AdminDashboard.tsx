"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Users, Calendar, Trophy, Swords, LogOut, Globe, MapPin, Medal, GraduationCap, Crown, Shield } from "lucide-react";

interface AdminDashboardProps {
  user: { email: string; name: string | null; role: string };
  stats: {
    players: number;
    matches: number;
    seasons: number;
    trophies: number;
    countries: number;
    venues: number;
    competitions: number;
    coaches: number;
    presidents: number;
    referees: number;
  };
}

const statCards = [
  { key: "players" as const, label: "Joueurs", icon: Users, href: "/admin/joueurs" },
  { key: "matches" as const, label: "Matchs", icon: Swords, href: "/admin/matchs" },
  { key: "seasons" as const, label: "Saisons", icon: Calendar, href: "/admin/saisons" },
  { key: "trophies" as const, label: "Trophées", icon: Trophy, href: "/admin/palmares" },
  { key: "countries" as const, label: "Pays", icon: Globe, href: "/admin/pays" },
  { key: "venues" as const, label: "Stades", icon: MapPin, href: "/admin/stades" },
  { key: "competitions" as const, label: "Compétitions", icon: Medal, href: "/admin/competitions" },
  { key: "coaches" as const, label: "Entraîneurs", icon: GraduationCap, href: "/admin/entraineurs" },
  { key: "presidents" as const, label: "Présidents", icon: Crown, href: "/admin/presidents" },
  { key: "referees" as const, label: "Arbitres", icon: Shield, href: "/admin/arbitres" },
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
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
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
            title="Gérer les matchs"
            description="Saisir ou modifier les résultats de matchs"
            href="/admin/matchs"
          />
          <ActionCard
            title="Gérer les joueurs"
            description="Ajouter ou modifier les fiches joueurs"
            href="/admin/joueurs"
          />
          <ActionCard
            title="Gérer les saisons"
            description="Créer ou modifier une saison"
            href="/admin/saisons"
          />
          <ActionCard
            title="Gérer les adversaires"
            description="Ajouter ou modifier les clubs adverses"
            href="/admin/adversaires"
          />
          <ActionCard
            title="Gérer les pays"
            description="Ajouter ou modifier les pays référencés"
            href="/admin/pays"
          />
          <ActionCard
            title="Gérer les stades"
            description="Ajouter ou modifier les stades"
            href="/admin/stades"
          />
          <ActionCard
            title="Gérer les compétitions"
            description="Championnats, coupes et compétitions"
            href="/admin/competitions"
          />
          <ActionCard
            title="Gérer le palmarès"
            description="Titres, finales et trophées"
            href="/admin/palmares"
          />
          <ActionCard
            title="Gérer les entraîneurs"
            description="Ajouter ou modifier les entraîneurs"
            href="/admin/entraineurs"
          />
          <ActionCard
            title="Gérer les présidents"
            description="Ajouter ou modifier les présidents"
            href="/admin/presidents"
          />
          <ActionCard
            title="Gérer les arbitres"
            description="Ajouter ou modifier les arbitres"
            href="/admin/arbitres"
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
