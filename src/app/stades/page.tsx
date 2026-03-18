import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stades - USAP Historia",
  description:
    "Tous les stades où l'USAP a disputé des matchs depuis 1902.",
};

export default async function StadesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: [{ isHomeGround: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { matches: true } },
      country: { select: { name: true, flagUrl: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Stades
      </h1>
      <p className="mb-8 text-muted-foreground">
        {venues.length} stade{venues.length > 1 ? "s" : ""} référencé
        {venues.length > 1 ? "s" : ""}
      </p>

      {venues.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/stades/${venue.slug}`}
              className="group rounded-lg border border-border bg-usap-carte p-4 transition-colors hover:border-usap-or/30"
            >
              <div className="mb-3 flex justify-center">
                {venue.photoUrl ? (
                  <img
                    src={venue.photoUrl}
                    alt={venue.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="font-bold text-foreground group-hover:text-usap-sang">
                  {venue.name}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {venue.city}
                  {venue.capacity &&
                    ` — ${venue.capacity.toLocaleString("fr-FR")} places`}
                </p>
                {venue.isHomeGround && (
                  <span className="mt-1 inline-block rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-medium text-usap-sang">
                    Domicile USAP
                  </span>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {venue._count.matches} match
                  {venue._count.matches > 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">Aucun stade référencé pour le moment.</p>
        </div>
      )}
    </div>
  );
}
