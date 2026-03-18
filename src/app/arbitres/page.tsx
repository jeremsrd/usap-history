import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arbitres - USAP Historia",
  description:
    "Tous les arbitres ayant officié lors des matchs de l'USA Perpignan.",
};

export default async function ArbitresPage() {
  const referees = await prisma.referee.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      _count: { select: { matches: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Arbitres
      </h1>
      <p className="mb-8 text-muted-foreground">
        {referees.length} arbitre{referees.length > 1 ? "s" : ""} référencé
        {referees.length > 1 ? "s" : ""}
      </p>

      {referees.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {referees.map((referee) => (
            <Link
              key={referee.id}
              href={`/arbitres/${referee.slug}`}
              className="group rounded-lg border border-border bg-usap-carte p-4 transition-colors hover:border-usap-or/30"
            >
              <div className="mb-3 flex justify-center">
                {referee.photoUrl ? (
                  <img
                    src={referee.photoUrl}
                    alt={`${referee.firstName} ${referee.lastName}`}
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
                  {referee.firstName} {referee.lastName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {referee._count.matches} match
                  {referee._count.matches > 1 ? "s" : ""} arbitré
                  {referee._count.matches > 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">Aucun arbitre référencé pour le moment.</p>
        </div>
      )}
    </div>
  );
}
