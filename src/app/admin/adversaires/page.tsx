import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import OpponentList from "./OpponentList";

export default async function AdminAdversairesPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const [opponents, countries, venues] = await Promise.all([
    prisma.opponent.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        shortName: true,
        officialName: true,
        city: true,
        countryId: true,
        venueId: true,
        foundedYear: true,
        logoUrl: true,
        websiteUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        isActive: true,
        notes: true,
        country: { select: { name: true, code: true } },
        venue: { select: { name: true, city: true } },
        _count: { select: { matches: true } },
      },
    }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.venue.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, city: true },
    }),
  ]);

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
          <span className="text-usap-or">des adversaires</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clubs affrontés par l&apos;USAP depuis 1902.
        </p>
      </div>

      {/* Liste */}
      <OpponentList
        opponents={opponents}
        countries={countries}
        venues={venues}
      />
    </div>
  );
}
