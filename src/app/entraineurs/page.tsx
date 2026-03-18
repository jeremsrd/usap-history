import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entraîneurs - USAP Historia",
  description:
    "Tous les entraîneurs de l'USA Perpignan. Historique des coaches du club catalan.",
};

export default async function EntraineursPage() {
  const coaches = await prisma.coach.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      _count: { select: { seasons: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Entraîneurs
      </h1>
      <p className="mb-8 text-muted-foreground">
        {coaches.length} entraîneur{coaches.length > 1 ? "s" : ""} référencé
        {coaches.length > 1 ? "s" : ""}
      </p>

      {coaches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {coaches.map((coach) => (
            <Link
              key={coach.id}
              href={`/entraineurs/${coach.slug}`}
              className="group rounded-lg border border-border bg-usap-carte p-4 transition-colors hover:border-usap-or/30"
            >
              <div className="mb-3 flex justify-center">
                {coach.photoUrl ? (
                  <img
                    src={coach.photoUrl}
                    alt={`${coach.firstName} ${coach.lastName}`}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="font-bold text-foreground group-hover:text-usap-sang">
                  {coach.firstName} {coach.lastName}
                </p>
                {coach.role && (
                  <p className="mt-1 text-sm text-usap-or">{coach.role}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {coach._count.seasons} saison
                  {coach._count.seasons > 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">Aucun entraîneur référencé pour le moment.</p>
        </div>
      )}
    </div>
  );
}
