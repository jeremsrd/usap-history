import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import VenueList from "./VenueList";

export default async function AdminStadesPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const [venues, countries] = await Promise.all([
    prisma.venue.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        countryId: true,
        capacity: true,
        yearOpened: true,
        latitude: true,
        longitude: true,
        isHomeGround: true,
        photoUrl: true,
        notes: true,
        country: { select: { name: true, code: true } },
        _count: { select: { matches: true, opponents: true } },
      },
    }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
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
          <span className="text-usap-or">des stades</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stades et enceintes sportives référencés.
        </p>
      </div>

      {/* Liste */}
      <VenueList
        venues={venues}
        countries={countries}
      />
    </div>
  );
}
