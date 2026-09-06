import Link from "@/components/Lien";
import Provenance from "@/components/Provenance";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { estJoue } from "@/lib/matchs";
import { baremeDeMatch } from "@/lib/scoring";
import { POSITIONS } from "@/lib/constants";
import { formatDateFR } from "@/lib/utils";
import type { Metadata } from "next";
import VideoEmbed from "@/components/VideoEmbed";
import ScoreEvolution from "@/components/ScoreEvolution";
import { dictionnaire, type Traduire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";

/**
 * La fiche d'une rencontre, refaite le 6 septembre 2026 dans l'identité posée
 * sur `/joueurs` et la fiche joueur. Sa seule audace est le **tableau
 * d'affichage** : l'affiche en Archivo condensée, l'USAP en rouge,
 * l'adversaire en encre, et le score énorme entre les deux — sans logos,
 * qui sont ailleurs sur le site. Tout ce qui l'entoure est dit en phrases
 * puis en tableaux : le résultat et ses bonus, la mi-temps, le stade,
 * l'affluence, l'arbitre ; le graphe du score ; les deux XV ; les faits.
 *
 * Ce que la page ne fait plus : une pastille verte ou rouge pour le
 * résultat, un badge bleu pour le bonus défensif, des emojis pour les faits
 * et les cartons, des chips sous le graphe, des icônes devant les titres.
 */

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: Langue; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const match = await prisma.match.findUnique({
    where: { slug },
    select: {
      date: true,
      scoreUsap: true,
      scoreOpponent: true,
      isHome: true,
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { shortName: true, name: true } },
    },
  });
  if (!match) return { title: "Match introuvable - USAP Historia" };

  const opp = match.opponent.shortName || match.opponent.name;
  // Une rencontre à venir n'a pas de score : le titre annonce l'affiche.
  const score = !estJoue(match)
    ? match.isHome
      ? `USAP - ${opp}`
      : `${opp} - USAP`
    : match.isHome
      ? `USAP ${match.scoreUsap} - ${match.scoreOpponent} ${opp}`
      : `${opp} ${match.scoreOpponent} - ${match.scoreUsap} USAP`;

  return {
    title: `${score} - USAP Historia`,
    description: `${match.competition.shortName || match.competition.name} — ${score}, ${formatDateFR(match.date)}.`,
  };
}

const nombre = (n: number) => n.toLocaleString("fr-FR");

export default async function MatchDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);

  const match = await prisma.match.findUnique({
    where: { slug },
    include: {
      season: { select: { label: true, startYear: true } },
      competition: true,
      opponent: { select: { name: true, shortName: true, logoUrl: true, city: true, slug: true } },
      venue: { select: { name: true, slug: true, city: true } },
      referee: true,
      players: {
        include: { player: { select: { slug: true, firstName: true, lastName: true } } },
        orderBy: [{ isStarter: "desc" }, { shirtNumber: "asc" }],
      },
      matchEvents: { orderBy: { minute: "asc" } },
    },
  });
  if (!match) notFound();

  // Le titre que ce match a décidé, s'il en a décidé un. Le rapprochement se
  // fait sur l'année de fin de saison et la compétition : une finale et son
  // trophée ne peuvent pas se confondre avec autre chose. « Demi-finale » est
  // exclue — d'où l'ancrage de l'expression au début du libellé de tour.
  const anneeDuTitre = Number(match.season.label.slice(5));
  const trophee = /^finale/i.test(match.round ?? "")
    ? await prisma.trophy.findFirst({
        where: {
          year: anneeDuTitre,
          competition: { in: [match.competition.name, match.competition.shortName ?? match.competition.name] },
        },
      })
    : null;

  const oppName = match.opponent.shortName || match.opponent.name;
  const competition = match.competition.shortName || match.competition.name;
  const joue = estJoue(match);
  const usap = match.players.filter((p) => !p.isOpponent);
  const adverse = match.players.filter((p) => p.isOpponent);
  const affiche = match.isHome ? `USAP – ${oppName}` : `${oppName} – USAP`;

  // L'intitulé : compétition, journée ou tour, date, coup d'envoi.
  const intitule = match.matchday
    ? t(match.matchday === 1 ? "match.journee" : "match.journeeN", { competition, n: match.matchday })
    : match.round
      ? t("match.tour", { competition, tour: match.round })
      : competition;
  const quand = `${t("match.le", { date: formatDateFR(match.date) })}${match.kickoffTime ? ` ${t("match.a", { heure: match.kickoffTime })}` : ""}`;

  // Le résultat et ses bonus, en une phrase.
  const resultat =
    match.result === "VICTOIRE" ? t("match.victoire") : match.result === "NUL" ? t("match.nul") : match.result === "DEFAITE" ? t("match.defaite") : null;
  const bonus =
    match.bonusOffensif && match.bonusDefensif
      ? t("match.bonusLesDeux")
      : match.bonusOffensif
        ? t("match.bonusOffensif")
        : match.bonusDefensif
          ? t("match.bonusDefensif")
          : null;
  const faits = [
    resultat && `${resultat}${bonus ? `, ${bonus}` : ""}`,
    match.halfTimeUsap != null && match.halfTimeOpponent != null && t("match.miTemps", { usap: match.halfTimeUsap, adversaire: match.halfTimeOpponent }),
  ].filter(Boolean) as string[];

  const scoringEvents = match.matchEvents.filter((e) => ["ESSAI", "TRANSFORMATION", "PENALITE", "DROP", "ESSAI_PENALITE"].includes(e.type));
  const detailScore = match.triesUsap != null || match.triesOpponent != null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav className="mb-8 flex flex-wrap gap-1 text-sm text-muted-foreground">
        <Link href="/matchs" className="hover:text-usap-sang">
          {t("match.filAriane")}
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/saisons/${match.season.label}`} className="hover:text-usap-sang">
          {match.season.label}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{affiche}</span>
      </nav>

      {/* Le tableau d'affichage */}
      <header className="mb-10">
        <p className="text-sm text-muted-foreground">
          {intitule}, {quand}.
        </p>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 sm:gap-x-8">
          <Equipe usap={match.isHome} nom={oppName} slug={match.opponent.slug} align="right" />
          <p className="font-display text-7xl leading-none text-foreground tabular-nums sm:text-9xl">
            {joue ? (
              <>
                {match.isHome ? match.scoreUsap : match.scoreOpponent}
                <span className="mx-2 text-muted-foreground sm:mx-4">–</span>
                {match.isHome ? match.scoreOpponent : match.scoreUsap}
              </>
            ) : (
              <span className="text-3xl text-muted-foreground sm:text-5xl">{t("match.aVenir")}</span>
            )}
          </p>
          <Equipe usap={!match.isHome} nom={oppName} slug={match.opponent.slug} align="left" />
        </div>
        {trophee && (
          <p className="mt-4 font-display text-2xl uppercase text-usap-or">
            {t(trophee.achievement === "CHAMPION" ? "match.champion" : "match.finaliste", { competition: trophee.competition, annee: trophee.year })}
            <Link href="/palmares" className="ml-3 text-base normal-case text-muted-foreground underline hover:text-usap-sang">
              {t("match.palmares")}
            </Link>
          </p>
        )}
        {faits.length > 0 && <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{faits.join(". ")}.</p>}
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {[
            match.venue && (
              <Link key="stade" href={`/stades/${match.venue.slug}`} className="hover:text-usap-sang">
                {match.venue.name}, {match.venue.city}
              </Link>
            ),
            match.attendance != null && t("match.spectateurs", { n: nombre(match.attendance) }),
            match.referee && (
              <Link key="arbitre" href={`/arbitres/${match.referee.slug}`} className="hover:text-usap-sang">
                {t("match.arbitre", { nom: `${match.referee.firstName} ${match.referee.lastName}` })}
              </Link>
            ),
            match.manOfTheMatch && t("match.hommeDuMatch", { nom: match.manOfTheMatch }),
          ]
            .filter(Boolean)
            .map((x, i, tous) => (
              <span key={i}>
                {x}
                {i < tous.length - 1 ? ", " : "."}
              </span>
            ))}
        </p>
      </header>

      {/* Le score minute par minute, et son détail */}
      {(scoringEvents.length > 0 || detailScore) && joue && (
        <section className="mb-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
          {scoringEvents.length > 0 && (
            <div>
              <Titre>{t("match.evolutionTitre")}</Titre>
              <ScoreEvolution
                events={match.matchEvents}
                finalScoreUsap={match.scoreUsap!}
                finalScoreOpponent={match.scoreOpponent!}
                opponentName={oppName}
                isHome={match.isHome}
                bareme={baremeDeMatch(match.season.startYear)}
                libelleMiTemps={t("match.legendeMiTemps")}
              />
            </div>
          )}
          {detailScore && (
            <div>
              <Titre>{t("match.detailTitre")}</Titre>
              <table className="w-full border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 text-left font-medium" />
                    <th scope="col" className="py-2 pr-3 text-right font-semibold text-usap-sang">USAP</th>
                    <th scope="col" className="py-2 text-right font-semibold text-foreground">{oppName}</th>
                  </tr>
                </thead>
                <tbody>
                  <ScoreRow label={t("match.essais")} usap={match.triesUsap} opp={match.triesOpponent} />
                  <ScoreRow label={t("match.transformations")} usap={match.conversionsUsap} opp={match.conversionsOpponent} />
                  <ScoreRow label={t("match.penalites")} usap={match.penaltiesUsap} opp={match.penaltiesOpponent} />
                  <ScoreRow label={t("match.drops")} usap={match.dropGoalsUsap} opp={match.dropGoalsOpponent} />
                  {(match.penaltyTriesUsap || match.penaltyTriesOpponent) ? (
                    <ScoreRow label={t("match.essaisDePenalite")} usap={match.penaltyTriesUsap} opp={match.penaltyTriesOpponent} />
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Les deux XV */}
      {(usap.length > 0 || adverse.length > 0) && (
        <section className="mb-10 grid gap-10 lg:grid-cols-2">
          {usap.length > 0 && (
            <div>
              <Titre>USAP</Titre>
              <Composition lignes={usap} t={t} />
            </div>
          )}
          {adverse.length > 0 && (
            <div>
              <Titre encre>
                <Link href={`/adversaires/${match.opponent.slug}`} className="hover:text-usap-sang">
                  {oppName}
                </Link>
              </Titre>
              <Composition lignes={adverse} t={t} adverse />
            </div>
          )}
        </section>
      )}

      {/* Les faits, minute par minute */}
      {match.matchEvents.length > 0 && (
        <section className="mb-10">
          <Titre>{t("match.faitsTitre")}</Titre>
          <ol className="max-w-3xl text-sm">
            {match.matchEvents.map((event) => (
              <li key={event.id} className="flex gap-4 border-b border-border py-1.5">
                <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">{event.minute}&apos;</span>
                <span className={event.isUsap ? "text-foreground" : "text-muted-foreground"}>
                  {event.description || event.type.replace(/_/g, " ").toLowerCase()}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {match.videoUrl && (
        <section className="mb-10">
          <Titre>{t("match.videoTitre")}</Titre>
          <VideoEmbed url={match.videoUrl} title={t("match.videoLibelle", { affiche })} />
        </section>
      )}

      {match.report && (
        <section className="mb-10">
          <Titre>{t("match.compteRenduTitre")}</Titre>
          <p className="max-w-prose text-sm leading-relaxed text-foreground">{match.report}</p>
        </section>
      )}

      {/* D'où vient ce que la page affirme, quand ce n'est pas de la feuille */}
      <Provenance entite="Match" id={match.id} />
    </div>
  );
}

/** Une équipe du tableau d'affichage : l'USAP en rouge, l'adversaire en encre et lié à sa fiche. */
function Equipe({ usap, nom, slug, align }: { usap: boolean; nom: string; slug: string; align: "left" | "right" }) {
  const classes = `font-display text-3xl uppercase leading-none sm:text-5xl ${align === "right" ? "text-right" : "text-left"}`;
  return usap ? (
    <p className={`${classes} text-usap-sang`}>USAP</p>
  ) : (
    <p className={`${classes} text-foreground`}>
      <Link href={`/adversaires/${slug}`} className="hover:text-usap-sang">
        {nom}
      </Link>
    </p>
  );
}

/** Le titre d'une section : la voix condensée de la liste, sous un filet. */
function Titre({ children, encre = false }: { children: React.ReactNode; encre?: boolean }) {
  return (
    <h2
      className={`mb-3 border-b-2 pb-1 font-display text-3xl uppercase leading-none ${
        encre ? "border-foreground text-foreground" : "border-usap-sang text-usap-sang"
      }`}
    >
      {children}
    </h2>
  );
}

function ScoreRow({ label, usap, opp }: { label: string; usap: number | null | undefined; opp: number | null | undefined }) {
  if (usap == null && opp == null) return null;
  return (
    <tr className="border-b border-border">
      <td className="py-1.5 pr-3 text-muted-foreground">{label}</td>
      <td className="py-1.5 pr-3 text-right text-foreground">{usap ?? "—"}</td>
      <td className="py-1.5 text-right text-foreground">{opp ?? "—"}</td>
    </tr>
  );
}

type Ligne = {
  id: string;
  shirtNumber: number | null;
  isStarter: boolean;
  isCaptain: boolean;
  positionPlayed: string | null;
  minutesPlayed: number | null;
  subIn: number | null;
  subOut: number | null;
  tries: number;
  totalPoints: number;
  yellowCard: boolean;
  orangeCard: boolean;
  redCard: boolean;
  opponentPlayerName: string | null;
  player: { slug: string; firstName: string; lastName: string } | null;
};

/**
 * Une composition : les titulaires, puis les remplaçants, en un tableau
 * serré. Les minutes disent l'entrée et la sortie ; un joueur peut sortir
 * puis revenir (sang, protocole commotion), les deux minutes sont alors
 * données dans l'ordre du match. Les cartons sont des mots, pas des emojis.
 */
function Composition({ lignes, t, adverse = false }: { lignes: Ligne[]; t: Traduire; adverse?: boolean }) {
  const titulaires = lignes.filter((l) => l.isStarter);
  const remplacants = lignes.filter((l) => !l.isStarter);
  const groupe = (libelle: string, l: Ligne[]) =>
    l.length > 0 && (
      <tbody className="tabular-nums">
        <tr>
          <th scope="rowgroup" colSpan={7} className="pt-3 pb-1 text-left text-xs font-medium text-muted-foreground">
            {libelle} ({l.length})
          </th>
        </tr>
        {l.map((mp) => {
          const nom = mp.player ? `${mp.player.firstName} ${mp.player.lastName}` : (mp.opponentPlayerName ?? "?");
          const mouvements = [
            mp.subOut != null && mp.isStarter ? t("match.sorti", { minute: mp.subOut }) : null,
            mp.subIn != null ? t("match.entre", { minute: mp.subIn }) : null,
            mp.subOut != null && !mp.isStarter ? t("match.sorti", { minute: mp.subOut }) : null,
          ].filter(Boolean);
          const cartons = [
            mp.yellowCard && t("match.cartonJaune"),
            mp.orangeCard && t("match.cartonOrange"),
            mp.redCard && t("match.cartonRouge"),
          ].filter(Boolean);
          return (
            <tr key={mp.id} className="border-b border-border hover:bg-muted">
              <td className={`w-8 py-1 pr-2 text-right font-semibold ${adverse ? "text-foreground" : "text-usap-sang"}`}>{mp.shirtNumber ?? ""}</td>
              <td className="py-1 pr-3">
                {mp.player ? (
                  <Link href={`/joueurs/${mp.player.slug}`} className="text-foreground hover:text-usap-sang">
                    {nom}
                  </Link>
                ) : (
                  <span className="text-foreground">{nom}</span>
                )}
                {mp.isCaptain && <span className="ml-1.5 text-xs text-usap-or">{t("match.capitaine")}</span>}
              </td>
              <td className="hidden py-1 pr-3 text-xs text-muted-foreground md:table-cell">
                {mp.positionPlayed ? (POSITIONS[mp.positionPlayed]?.label ?? mp.positionPlayed) : ""}
              </td>
              <td className="py-1 pr-3 text-right text-muted-foreground whitespace-nowrap">
                {mp.minutesPlayed != null && mp.minutesPlayed}
                {mouvements.length > 0 && <span className="ml-1 text-xs">({mouvements.join(", ")})</span>}
              </td>
              <td className="py-1 pr-3 text-right text-foreground">{mp.tries || ""}</td>
              <td className="py-1 pr-3 text-right font-semibold text-foreground">{mp.totalPoints || ""}</td>
              <td className="py-1 text-xs text-muted-foreground">{cartons.join(", ")}</td>
            </tr>
          );
        })}
      </tbody>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-2 text-right font-medium">{t("match.colNumero")}</th>
            <th scope="col" className="py-2 pr-3 text-left font-medium">{t("match.colJoueur")}</th>
            <th scope="col" className="hidden py-2 pr-3 text-left font-medium md:table-cell">{t("match.colPoste")}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{t("match.colMinutes")}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{t("match.colEssais")}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{t("match.colPoints")}</th>
            <th scope="col" className="py-2 text-left font-medium">{t("match.colCartons")}</th>
          </tr>
        </thead>
        {groupe(t("match.compositionTitulaires"), titulaires)}
        {groupe(t("match.compositionRemplacants"), remplacants)}
      </table>
    </div>
  );
}
