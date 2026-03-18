import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { countryCodeToFlag } from "@/lib/utils";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Adversaires - USAP Historia",
  description:
    "Tous les clubs affronts par l'USA Perpignan. Bilan head-to-head, historique des confrontations.",
};

export default async function AdversairesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() || undefined;
  const filtre = params.filtre;

  const where: Record<string, unknown> = {};

  if (filtre === "actifs") {
    where.isActive = true;
  } else if (filtre === "matchs") {
    where.matches = { some: {} };
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { shortName: { contains: searchQuery, mode: "insensitive" } },
      { city: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const opponents = await prisma.opponent.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      shortName: true,
      city: true,
      logoUrl: true,
      isActive: true,
      country: { select: { name: true, code: true } },
      _count: { select: { matches: true } },
    },
  });

  // Stats pour les compteurs
  const [totalCount, withMatchesCount] = await Promise.all([
    prisma.opponent.count(),
    prisma.opponent.count({ where: { matches: { some: {} } } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Adversaires
      </h1>
      <p className="mb-8 text-muted-foreground">
        {opponents.length} club{opponents.length > 1 ? "s" : ""}
        {searchQuery && ` pour \u00ab ${searchQuery} \u00bb`}
        {filtre === "actifs" && " actifs"}
        {filtre === "matchs" && " avec matchs"}
      </p>

      {/* Filtres */}
      <div className="mb-8 flex flex-wrap gap-3">
        {/* Recherche */}
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Rechercher un club..."
            defaultValue={searchQuery}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-or focus:outline-none"
          />
          {filtre && <input type="hidden" name="filtre" value={filtre} />}
          <button
            type="submit"
            className="rounded-lg bg-usap-sang px-4 py-2 text-sm font-medium text-white hover:bg-usap-sang/90"
          >
            Rechercher
          </button>
        </form>

        {/* Filtres rapides */}
        <div className="flex gap-2">
          <FilterLink
            href="/adversaires"
            label={`Tous (${totalCount})`}
            active={!filtre && !searchQuery}
          />
          <FilterLink
            href="/adversaires?filtre=matchs"
            label={`Avec matchs (${withMatchesCount})`}
            active={filtre === "matchs"}
          />
          <FilterLink
            href="/adversaires?filtre=actifs"
            label="Actifs"
            active={filtre === "actifs"}
          />
        </div>
      </div>

      {/* Grille d'adversaires */}
      {opponents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {opponents.map((opp) => (
            <Link
              key={opp.slug}
              href={`/adversaires/${opp.slug}`}
              className="group rounded-lg border border-border bg-usap-carte p-4 transition-colors hover:border-usap-or/30"
            >
              {/* Logo */}
              <div className="mb-3 flex justify-center">
                {opp.logoUrl ? (
                  <Image
                    src={opp.logoUrl}
                    alt={opp.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="text-center">
                <p className="font-bold text-foreground group-hover:text-usap-sang">
                  {opp.shortName || opp.name}
                </p>
                {opp.city && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {opp.city}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-center gap-2">
                  {opp.country && (
                    <span className="text-lg" title={opp.country.name}>
                      {countryCodeToFlag(opp.country.code)}
                    </span>
                  )}
                  {opp._count.matches > 0 && (
                    <span className="rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-medium text-usap-sang">
                      {opp._count.matches} match
                      {opp._count.matches > 1 ? "s" : ""}
                    </span>
                  )}
                  {!opp.isActive && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Inactif
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">Aucun adversaire trouv&eacute;.</p>
          {(searchQuery || filtre) && (
            <Link
              href="/adversaires"
              className="mt-2 inline-block text-sm text-usap-sang hover:underline"
            >
              R&eacute;initialiser les filtres
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-usap-sang text-white"
          : "border border-border bg-background text-muted-foreground hover:border-usap-or/30 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
