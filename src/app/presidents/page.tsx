import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Présidents - USAP Historia",
  description:
    "Tous les présidents de l'USA Perpignan. Historique des dirigeants du club catalan.",
};

export default async function PresidentsPage() {
  const presidents = await prisma.president.findMany({
    orderBy: [{ startYear: "desc" }],
    include: {
      _count: { select: { seasons: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Présidents
      </h1>
      <p className="mb-8 text-muted-foreground">
        {presidents.length} président{presidents.length > 1 ? "s" : ""}{" "}
        référencé
        {presidents.length > 1 ? "s" : ""}
      </p>

      {presidents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {presidents.map((president) => {
            const period = president.startYear
              ? president.endYear
                ? `${president.startYear}–${president.endYear}`
                : `Depuis ${president.startYear}`
              : null;

            return (
              <Link
                key={president.id}
                href={`/presidents/${president.slug}`}
                className="group rounded-lg border border-border bg-usap-carte p-4 transition-colors hover:border-usap-or/30"
              >
                <div className="mb-3 flex justify-center">
                  {president.photoUrl ? (
                    <img
                      src={president.photoUrl}
                      alt={`${president.firstName} ${president.lastName}`}
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
                    {president.firstName} {president.lastName}
                  </p>
                  {period && (
                    <p className="mt-1 text-sm text-usap-or">{period}</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {president._count.seasons} saison
                    {president._count.seasons > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">Aucun président référencé pour le moment.</p>
        </div>
      )}
    </div>
  );
}
