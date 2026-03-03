import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { countryCodeToFlag } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Joueurs - USAP Historia",
  description:
    "Tous les joueurs de l'USA Perpignan. Effectif actuel et joueurs historiques.",
};

export default async function JoueursPage({
  searchParams,
}: {
  searchParams: Promise<{ poste?: string; actif?: string; q?: string }>;
}) {
  const params = await searchParams;
  const positionFilter = params.poste || undefined;
  const activeFilter = params.actif;
  const searchQuery = params.q?.trim() || undefined;

  // Uniquement les joueurs liés à l'USAP (passage, carrière, match ou effectif saison)
  const usapCondition = {
    OR: [
      { usapStints: { some: {} } },
      { careerClubs: { some: { isUsap: true } } },
      { matchAppearances: { some: { isOpponent: false } } },
      { seasonSquads: { some: {} } },
    ],
  };
  const where: Record<string, unknown> = { ...usapCondition };

  if (positionFilter && positionFilter in POSITIONS) {
    where.position = positionFilter;
  }

  if (activeFilter === "oui") {
    where.isActive = true;
  } else if (activeFilter === "non") {
    where.isActive = false;
  }

  if (searchQuery) {
    where.OR = [
      { firstName: { contains: searchQuery, mode: "insensitive" } },
      { lastName: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const players = await prisma.player.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      position: true,
      photoUrl: true,
      isActive: true,
      nationality: { select: { name: true, code: true } },
    },
  });

  // Compteurs pour les filtres (uniquement joueurs USAP)
  const totalCount = await prisma.player.count({ where: usapCondition });
  const activeCount = await prisma.player.count({
    where: { ...usapCondition, isActive: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Joueurs
      </h1>
      <p className="mb-8 text-muted-foreground">
        {players.length} joueur{players.length > 1 ? "s" : ""}
        {activeFilter === "oui" && " dans l'effectif actuel"}
        {searchQuery && ` pour « ${searchQuery} »`}
        {positionFilter && ` — ${POSITIONS[positionFilter]?.label ?? positionFilter}`}
      </p>

      {/* Filtres */}
      <div className="mb-8 flex flex-wrap gap-3">
        {/* Recherche */}
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Rechercher un joueur..."
            defaultValue={searchQuery}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-or focus:outline-none"
          />
          {/* Préserver les autres filtres */}
          {positionFilter && (
            <input type="hidden" name="poste" value={positionFilter} />
          )}
          {activeFilter && (
            <input type="hidden" name="actif" value={activeFilter} />
          )}
          <button
            type="submit"
            className="rounded-lg bg-usap-sang px-4 py-2 text-sm font-medium text-white hover:bg-usap-sang/90"
          >
            Rechercher
          </button>
        </form>

        {/* Filtre effectif actuel */}
        <div className="flex gap-2">
          <FilterLink
            href="/joueurs"
            label={`Tous (${totalCount})`}
            active={!activeFilter && !positionFilter && !searchQuery}
          />
          <FilterLink
            href="/joueurs?actif=oui"
            label={`Effectif actuel (${activeCount})`}
            active={activeFilter === "oui"}
          />
        </div>
      </div>

      {/* Filtre par poste */}
      <div className="mb-8 flex flex-wrap gap-2">
        {Object.entries(POSITIONS).map(([key, { label }]) => (
          <FilterLink
            key={key}
            href={`/joueurs?poste=${key}${activeFilter ? `&actif=${activeFilter}` : ""}`}
            label={label}
            active={positionFilter === key}
          />
        ))}
        {positionFilter && (
          <FilterLink
            href={activeFilter ? `/joueurs?actif=${activeFilter}` : "/joueurs"}
            label="Tous les postes"
            active={false}
          />
        )}
      </div>

      {/* Grille de joueurs */}
      {players.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {players.map((player) => (
            <Link
              key={player.slug}
              href={`/joueurs/${player.slug}`}
              className="group rounded-lg border border-border bg-usap-carte p-4 transition-colors hover:border-usap-or/30"
            >
              {/* Photo */}
              <div className="mb-3 flex justify-center">
                {player.photoUrl ? (
                  <Image
                    src={player.photoUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="text-center">
                <p className="font-bold text-foreground group-hover:text-usap-sang">
                  {player.firstName} {player.lastName}
                </p>
                {player.position && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {POSITIONS[player.position]?.label ?? player.position}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-center gap-2">
                  {player.nationality && (
                    <span className="text-lg" title={player.nationality.name}>
                      {countryCodeToFlag(player.nationality.code)}
                    </span>
                  )}
                  {player.isActive && (
                    <span className="rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-medium text-usap-sang">
                      Actuel
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">Aucun joueur trouvé.</p>
          {(searchQuery || positionFilter || activeFilter) && (
            <Link
              href="/joueurs"
              className="mt-2 inline-block text-sm text-usap-sang hover:underline"
            >
              Réinitialiser les filtres
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
