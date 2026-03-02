import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import PlayerList from "./PlayerList";

export default async function AdminJoueursPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const [players, countries] = await Promise.all([
    prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        birthDate: true,
        deathDate: true,
        birthPlace: true,
        birthCountryId: true,
        nationalityId: true,
        height: true,
        weight: true,
        photoUrl: true,
        biography: true,
        isActive: true,
        nationality: { select: { name: true, code: true } },
      },
    }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  // Sérialiser les dates pour le client component
  const serializedPlayers = players.map((p) => ({
    ...p,
    birthDate: p.birthDate ? p.birthDate.toISOString().split("T")[0] : null,
    deathDate: p.deathDate ? p.deathDate.toISOString().split("T")[0] : null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Retour au dashboard
        </Link>
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          <span className="text-usap-sang">Gestion</span>{" "}
          <span className="text-usap-or">des joueurs</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Joueurs référencés dans la base de données historique.
        </p>
      </div>

      {/* Liste */}
      <PlayerList players={serializedPlayers} countries={countries} />
    </div>
  );
}
