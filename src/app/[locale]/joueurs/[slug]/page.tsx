import Link from "@/components/Lien";
import Provenance from "@/components/Provenance";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { estJoue } from "@/lib/matchs";
import type { MatchResult } from "@prisma/client";
import { POSITIONS } from "@/lib/constants";
import { formatDateFR, countryCodeToFlag } from "@/lib/utils";
import { creditPhoto } from "@/lib/credits-photos";
import type { Metadata } from "next";
import { cheminLocalise, type Langue } from "@/i18n/langues";
import { dictionnaire, type Traduire } from "@/i18n/dictionnaire";

/**
 * La fiche d'un joueur, refaite le 6 septembre 2026 dans l'identité posée sur
 * `/joueurs` la veille : Archivo seule, le Sang et Or, des tableaux serrés et
 * pas une carte. Sa seule audace est le **dos de maillot** — le nom condensé
 * en rouge, et à sa droite le numéro que l'homme a le plus porté, qui est une
 * donnée de la base et non un ornement. Le cœur de la page est le **bilan
 * saison par saison**, comme sur lfchistory.net : c'est ce qu'un supporter
 * vient chercher, et quatre gros chiffres centrés ne le disaient pas.
 *
 * Ce que la page ne fait plus : un rond gris à la place du portrait — la
 * case reste vide —, du vert et du rouge de Tailwind pour les résultats —
 * V, N, D en toutes lettres —, des icônes devant les titres.
 */

/** Une participation à un match, telle que chargée par cette page. */
type PlayerAppearance = {
  id: string;
  isStarter: boolean;
  isCaptain: boolean;
  shirtNumber: number | null;
  minutesPlayed: number | null;
  tries: number;
  totalPoints: number;
  match: {
    slug: string;
    date: Date;
    scoreUsap: number;
    scoreOpponent: number;
    result: MatchResult;
    isHome: boolean;
    competition: { shortName: string | null; name: string };
    opponent: { shortName: string | null; name: string };
    season: { label: string };
  };
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: Langue; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) return { title: "Joueur introuvable - USAP Historia" };

  const player = await prisma.player.findUnique({
    where: { id },
    select: { firstName: true, lastName: true, position: true },
  });
  if (!player) return { title: "Joueur introuvable - USAP Historia" };

  const posLabel = player.position ? POSITIONS[player.position]?.label : undefined;
  return {
    title: `${player.firstName} ${player.lastName} - USAP Historia`,
    description: `Fiche de ${player.firstName} ${player.lastName}${posLabel ? `, ${posLabel}` : ""} à l'USA Perpignan. Statistiques, carrière et matchs.`,
  };
}

/** Extrait le CUID de la fin du slug : 25 caractères alphanumériques. */
function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-z0-9]{25,})$/);
  return match ? match[1] : null;
}

const nombre = (n: number) => n.toLocaleString("fr-FR");

export default async function JoueurDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      nationality: true,
      birthCountry: true,
      careerClubs: { orderBy: { displayOrder: "asc" }, include: { country: true } },
      matchAppearances: {
        include: {
          match: {
            select: {
              slug: true,
              date: true,
              scoreUsap: true,
              scoreOpponent: true,
              result: true,
              isHome: true,
              competition: { select: { shortName: true, name: true } },
              opponent: { select: { shortName: true, name: true } },
              season: { select: { label: true } },
            },
          },
        },
        orderBy: { match: { date: "desc" } },
      },
      internationalCaps: { include: { nationalTeam: true } },
      awards: { orderBy: { year: "desc" } },
    },
  });
  if (!player) notFound();

  // Rediriger si le slug a changé (joueur renommé)
  if (player.slug !== slug) {
    redirect(cheminLocalise(`/joueurs/${player.slug}`, locale));
  }

  const credit = creditPhoto(player.photoUrl);

  // Un même joueur peut avoir porté le maillot catalan ET l'avoir affronté
  // sous d'autres couleurs : les deux carrières sont séparées. Une rencontre
  // à venir n'a pas de composition, mais rien ne l'interdit en base : on ne
  // garde que celles qui ont un score.
  const jouees = player.matchAppearances.filter(
    (ma): ma is typeof ma & { match: typeof ma.match & { scoreUsap: number; scoreOpponent: number; result: MatchResult } } =>
      estJoue(ma.match) && ma.match.result != null,
  );
  const avec: PlayerAppearance[] = jouees.filter((ma) => !ma.isOpponent);
  const contre: PlayerAppearance[] = jouees.filter((ma) => ma.isOpponent);

  // ---- Le bilan saison par saison, sous le maillot seulement --------------
  const saisons = new Map<string, { competitions: Set<string>; matchs: number; titulaire: number; capitaine: number; essais: number; points: number; minutes: number | null }>();
  for (const ma of avec) {
    const label = ma.match.season.label;
    const s = saisons.get(label) ?? { competitions: new Set<string>(), matchs: 0, titulaire: 0, capitaine: 0, essais: 0, points: 0, minutes: 0 };
    s.competitions.add(ma.match.competition.shortName || ma.match.competition.name);
    s.matchs++;
    if (ma.isStarter) s.titulaire++;
    if (ma.isCaptain) s.capitaine++;
    s.essais += ma.tries;
    s.points += ma.totalPoints;
    // Une minute inconnue rend le total de la saison inconnu : mieux vaut un
    // tiret qu'un total qui compte les seuls matchs où la source parle.
    s.minutes = s.minutes == null || (ma.minutesPlayed == null && ma.isStarter) ? null : s.minutes + (ma.minutesPlayed ?? 0);
    saisons.set(label, s);
  }
  const bilan = [...saisons.entries()].sort(([a], [b]) => a.localeCompare(b));
  const total = {
    matchs: avec.length,
    titulaire: avec.filter((ma) => ma.isStarter).length,
    capitaine: avec.filter((ma) => ma.isCaptain).length,
    essais: avec.reduce((s, ma) => s + ma.tries, 0),
    points: avec.reduce((s, ma) => s + ma.totalPoints, 0),
    minutes: bilan.some(([, s]) => s.minutes == null) ? null : bilan.reduce((s, [, x]) => s + (x.minutes ?? 0), 0),
  };
  const capitaineUneFois = total.capitaine > 0;

  // ---- Le dos de maillot : le numéro le plus porté ------------------------
  const numeros = new Map<number, number>();
  for (const ma of avec) if (ma.shirtNumber != null) numeros.set(ma.shirtNumber, (numeros.get(ma.shirtNumber) ?? 0) + 1);
  const numero = [...numeros.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] ?? null;

  const periode =
    bilan.length === 0
      ? null
      : bilan[0][0] === bilan[bilan.length - 1][0]
        ? bilan[0][0]
        : `${bilan[0][0].slice(0, 4)}-${bilan[bilan.length - 1][0].slice(5)}`;
  const poste = player.position ? `${POSITIONS[player.position]?.label ?? player.position}. ` : "";

  const age = player.birthDate && !player.deathDate
    ? Math.floor((Date.now() - new Date(player.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Les faits d'état civil, en une phrase : ce qui est connu, dans l'ordre.
  const etatCivil = [
    player.birthDate &&
      `${t("fiche.ne", { date: formatDateFR(player.birthDate) })}${player.birthPlace ? ` ${t("fiche.a", { lieu: player.birthPlace + (player.birthCountry ? ` (${player.birthCountry.name})` : "") })}` : ""}${age != null ? `, ${t("fiche.age", { n: age })}` : ""}`,
    player.deathDate && t("fiche.decede", { date: formatDateFR(player.deathDate) }),
    player.height && t("fiche.taille", { cm: player.height }),
    player.weight && t("fiche.poids", { kg: player.weight }),
    player.nationality && `${countryCodeToFlag(player.nationality.code)} ${player.nationality.name}`,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/joueurs" className="hover:text-usap-sang">
          {t("fiche.filAriane")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {player.firstName} {player.lastName}
        </span>
      </nav>

      {/* Le dos de maillot : portrait, prénom, NOM, numéro */}
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {player.photoUrl && (
          <div className="shrink-0">
            <Image
              src={player.photoUrl}
              alt={`${player.firstName} ${player.lastName}`}
              width={160}
              height={160}
              className="h-40 w-40 rounded-xs object-cover"
              priority
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-none text-foreground sm:text-4xl">{player.firstName}</p>
          <div className="flex items-end justify-between gap-6">
            <h1 className="font-display text-6xl uppercase leading-[0.9] text-usap-sang sm:text-8xl">
              {player.lastName}
            </h1>
            {numero && (
              <p
                className="shrink-0 font-display text-7xl leading-[0.85] text-usap-or tabular-nums sm:text-9xl"
                title={t("fiche.numeroPorte", { n: numero[1] })}
                aria-label={`${numero[0]}, ${t("fiche.numeroPorte", { n: numero[1] })}`}
              >
                {numero[0]}
              </p>
            )}
          </div>
          <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
            {avec.length > 0 && periode
              ? t("fiche.presentation", { n: avec.length, poste, periode })
              : contre.length > 0
                ? `${poste}${t("fiche.adversaireSeulement", { n: contre.length })}`
                : t("fiche.presentationSansPeriode", { poste })}
            {player.isActive && (
              <span className="ml-2 text-sm font-semibold text-usap-sang">{t("fiche.actuel")}</span>
            )}
          </p>
          {etatCivil.length > 0 && (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{etatCivil.join(". ")}.</p>
          )}
          {/* Le crédit de la photo : les licences CC BY et CC BY-SA l'exigent. */}
          {credit && (
            <p className="mt-1 text-xs text-muted-foreground">
              Photo :{" "}
              <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-usap-sang">
                {credit.auteur}
              </a>
              , {credit.licence}.
            </p>
          )}
          {player.biography && (
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground">{player.biography}</p>
          )}
        </div>
      </header>

      {/* Le bilan, saison par saison */}
      {bilan.length > 0 && (
        <section className="mb-10">
          <Titre>{t("fiche.bilanTitre")}</Titre>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">{t("fiche.bilanSaison")}</th>
                  <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("fiche.bilanCompetitions")}</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">{t("fiche.bilanMatchs")}</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">{t("fiche.bilanTitulaire")}</th>
                  {capitaineUneFois && <th scope="col" className="hidden py-2 pr-4 text-right font-medium sm:table-cell">{t("fiche.bilanCapitaine")}</th>}
                  <th scope="col" className="py-2 pr-4 text-right font-medium">{t("fiche.bilanEssais")}</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">{t("fiche.bilanPoints")}</th>
                  <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">{t("fiche.bilanMinutes")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {bilan.map(([label, s]) => (
                  <tr key={label} className="border-b border-border hover:bg-muted">
                    <td className="py-1.5 pr-4 whitespace-nowrap">
                      <Link href={`/saisons/${label}`} className="text-foreground hover:text-usap-sang">
                        {label}
                      </Link>
                    </td>
                    <td className="hidden py-1.5 pr-4 text-muted-foreground sm:table-cell">{[...s.competitions].join(", ")}</td>
                    <td className="py-1.5 pr-4 text-right font-semibold text-foreground">{s.matchs}</td>
                    <td className="py-1.5 pr-4 text-right text-muted-foreground">{s.titulaire}</td>
                    {capitaineUneFois && <td className="hidden py-1.5 pr-4 text-right text-muted-foreground sm:table-cell">{s.capitaine || ""}</td>}
                    <td className="py-1.5 pr-4 text-right text-foreground">{s.essais || ""}</td>
                    <td className="py-1.5 pr-4 text-right text-foreground">{s.points || ""}</td>
                    <td className="hidden py-1.5 text-right text-muted-foreground sm:table-cell">{s.minutes == null ? "—" : nombre(s.minutes)}</td>
                  </tr>
                ))}
              </tbody>
              {bilan.length > 1 && (
                <tfoot className="tabular-nums">
                  <tr className="border-b-2 border-usap-sang font-semibold text-foreground">
                    <td className="py-2 pr-4">{t("fiche.bilanTotal")}</td>
                    <td className="hidden py-2 pr-4 sm:table-cell" />
                    <td className="py-2 pr-4 text-right">{total.matchs}</td>
                    <td className="py-2 pr-4 text-right">{total.titulaire}</td>
                    {capitaineUneFois && <td className="hidden py-2 pr-4 text-right sm:table-cell">{total.capitaine}</td>}
                    <td className="py-2 pr-4 text-right">{total.essais}</td>
                    <td className="py-2 pr-4 text-right">{total.points}</td>
                    <td className="hidden py-2 text-right sm:table-cell">{total.minutes == null ? "—" : nombre(total.minutes)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted-foreground">{t("fiche.bilanReserve")}</p>
        </section>
      )}

      {/* Carrière */}
      {player.careerClubs.length > 0 && (
        <section className="mb-10">
          <Titre>{t("fiche.carriereTitre")}</Titre>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">{t("fiche.carrierePeriode")}</th>
                  <th scope="col" className="py-2 pr-4 font-medium">{t("fiche.carriereClub")}</th>
                  <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("fiche.carrierePays")}</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">{t("fiche.carriereMatchs")}</th>
                  <th scope="col" className="py-2 text-right font-medium">{t("fiche.carriereEssais")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {player.careerClubs.map((cc) => (
                  <tr key={cc.id} className="border-b border-border hover:bg-muted">
                    <td className="py-1.5 pr-4 whitespace-nowrap text-muted-foreground">
                      {cc.startYear}–{cc.endYear ?? t("fiche.carriereEnCours")}
                    </td>
                    <td className="py-1.5 pr-4">
                      <span className={cc.isUsap ? "font-semibold text-usap-sang" : "text-foreground"}>{cc.isUsap ? "USAP" : cc.clubName}</span>
                      {cc.isLoan && <span className="ml-2 text-xs text-muted-foreground">({t("fiche.carrierePret")})</span>}
                    </td>
                    <td className="hidden py-1.5 pr-4 text-muted-foreground sm:table-cell">
                      {cc.country && `${countryCodeToFlag(cc.country.code)} ${cc.country.name}`}
                    </td>
                    <td className="py-1.5 pr-4 text-right text-foreground">{cc.appearances ?? ""}</td>
                    <td className="py-1.5 text-right text-foreground">{cc.tries ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted-foreground">{t("fiche.carriereReserve")}</p>
        </section>
      )}

      {/* Sélections internationales, et distinctions : des lignes, pas des cartes */}
      {player.internationalCaps.length > 0 && (
        <section className="mb-10">
          <Titre>{t("fiche.selectionsTitre")}</Titre>
          <ul className="text-sm">
            {player.internationalCaps.map((cap) => {
              // La source ne donne que l'année : la date est stockée au
              // 1er janvier, on n'en affiche donc que l'année.
              const debut = cap.firstCapDate ? new Date(cap.firstCapDate).getUTCFullYear() : null;
              const fin = cap.lastCapDate ? new Date(cap.lastCapDate).getUTCFullYear() : null;
              return (
                <li key={cap.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-border py-2">
                  <span className="font-semibold text-foreground">{cap.nationalTeam.name}</span>
                  <span className="text-foreground tabular-nums">{t("fiche.selections", { n: cap.totalCaps })}</span>
                  {debut != null && (
                    <span className="text-muted-foreground tabular-nums">
                      {fin != null && fin !== debut ? t("fiche.selectionsDe", { debut, fin }) : t("fiche.selectionsEn", { annee: debut })}
                    </span>
                  )}
                  {cap.totalTries != null && cap.totalTries > 0 && (
                    <span className="text-muted-foreground tabular-nums">{t("fiche.selectionsEssais", { n: cap.totalTries })}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted-foreground">{t("fiche.selectionsReserve")}</p>
        </section>
      )}

      {player.awards.length > 0 && (
        <section className="mb-10">
          <Titre>{t("fiche.distinctionsTitre")}</Titre>
          <ul className="text-sm">
            {player.awards.map((award) => (
              <li key={award.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-border py-2">
                <span className="w-12 text-muted-foreground tabular-nums">{award.year}</span>
                <span className="font-semibold text-foreground">{award.name}</span>
                {award.category && <span className="text-muted-foreground">{award.category}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Les rencontres, sous le maillot puis contre */}
      {avec.length > 0 && (
        <section className="mb-10">
          <Titre compte={avec.length}>{t("fiche.matchsAvecTitre")}</Titre>
          <MatchHistoryTable appearances={avec} t={t} />
        </section>
      )}
      {contre.length > 0 && (
        <section className="mb-10">
          <Titre compte={contre.length}>{t("fiche.matchsContreTitre")}</Titre>
          {avec.length > 0 && <p className="mb-3 max-w-prose text-sm text-muted-foreground">{t("fiche.matchsContreNote")}</p>}
          <MatchHistoryTable appearances={contre} isOpponent t={t} />
        </section>
      )}

      {/* D'où vient ce que la fiche affirme, quand ce n'est pas d'une feuille */}
      <Provenance entite="Player" id={player.id} />
    </div>
  );
}

/** Le titre d'une section : la voix condensée de la liste, sous un filet rouge. */
function Titre({ children, compte }: { children: React.ReactNode; compte?: number }) {
  return (
    <h2 className="mb-3 border-b-2 border-usap-sang pb-1 font-display text-4xl uppercase leading-none text-usap-sang">
      {children}
      {compte != null && <span className="ml-3 text-foreground tabular-nums">{compte}</span>}
    </h2>
  );
}

/**
 * Tableau des rencontres, partagé entre celles jouées pour l'USAP et celles
 * jouées contre elle. Le résultat est une lettre — V, N, D — du point de vue
 * de l'USAP toujours, en gras quand il est favorable au joueur : pour un
 * adversaire, une défaite catalane. Pas de vert ni de rouge : les couleurs
 * du site sont le Sang et l'Or, et elles ne disent pas un résultat.
 */
function MatchHistoryTable({ appearances, isOpponent = false, t }: { appearances: PlayerAppearance[]; isOpponent?: boolean; t: Traduire }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">{t("fiche.colDate")}</th>
            <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("fiche.colCompetition")}</th>
            <th scope="col" className="py-2 pr-3 font-medium">{t("fiche.colMatch")}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{t("fiche.colScore")}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{t("fiche.colNumero")}</th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("fiche.colMinutes")}</th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("fiche.colEssais")}</th>
            <th scope="col" className="hidden py-2 text-right font-medium md:table-cell">{t("fiche.colPoints")}</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {appearances.map((ma) => {
            const m = ma.match;
            const favorable = isOpponent ? m.result === "DEFAITE" : m.result === "VICTOIRE";
            const lettre = m.result === "VICTOIRE" ? t("fiche.victoire") : m.result === "NUL" ? t("fiche.nul") : t("fiche.defaite");
            const oppName = m.opponent.shortName || m.opponent.name;
            return (
              <tr key={ma.id} className="border-b border-border hover:bg-muted">
                <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">{formatDateFR(m.date)}</td>
                <td className="hidden py-1.5 pr-3 whitespace-nowrap text-muted-foreground sm:table-cell">{m.competition.shortName || m.competition.name}</td>
                <td className="py-1.5 pr-3">
                  <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                    {m.isHome ? (
                      <>
                        <span className="font-semibold">USAP</span> – {oppName}
                      </>
                    ) : (
                      <>
                        {oppName} – <span className="font-semibold">USAP</span>
                      </>
                    )}
                  </Link>
                </td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                  <span className={`mr-2 ${favorable ? "font-bold text-usap-sang" : "text-muted-foreground"}`}>{lettre}</span>
                  <span className="text-foreground">{m.isHome ? `${m.scoreUsap}-${m.scoreOpponent}` : `${m.scoreOpponent}-${m.scoreUsap}`}</span>
                </td>
                <td className="py-1.5 pr-3 text-right text-muted-foreground">
                  {ma.shirtNumber ?? ""}
                  {!ma.isStarter && ma.shirtNumber != null && (
                    <span className="sr-only"> ({t("fiche.remplacant")})</span>
                  )}
                  {!ma.isStarter && ma.shirtNumber != null && <span aria-hidden="true">*</span>}
                </td>
                <td className="hidden py-1.5 pr-3 text-right text-muted-foreground sm:table-cell">{ma.minutesPlayed ?? ""}</td>
                <td className={`hidden py-1.5 pr-3 text-right md:table-cell ${isOpponent ? "text-muted-foreground" : "text-foreground"}`}>{ma.tries || ""}</td>
                <td className={`hidden py-1.5 text-right md:table-cell ${isOpponent ? "text-muted-foreground" : "font-semibold text-foreground"}`}>{ma.totalPoints || ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
