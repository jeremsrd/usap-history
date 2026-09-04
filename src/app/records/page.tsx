import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateFR } from "@/lib/utils";
import { CalendarDays, Flame, Trophy } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Records - USAP Historia",
  description:
    "Les records de l'USA Perpignan sur un match et sur une saison : plus larges victoires, plus gros scores, meilleures séries.",
};

export default async function RecordsPage() {
  const matchs = await prisma.match.findMany({
    where: { result: { not: null }, scoreUsap: { not: null } },
    select: {
      slug: true,
      date: true,
      isHome: true,
      scoreUsap: true,
      scoreOpponent: true,
      result: true,
      triesUsap: true,
      attendance: true,
      opponent: { select: { shortName: true } },
      season: { select: { label: true } },
    },
    orderBy: { date: "asc" },
  });

  // `scoreUsap` est nullable en base — un calendrier à venir n'en porte pas —,
  // mais le filtre l'exclut : on resserre le type pour la suite.
  type Rencontre = (typeof matchs)[number] & {
    scoreUsap: number;
    scoreOpponent: number;
  };
  const joues = matchs as Rencontre[];

  const lignes = await prisma.matchPlayer.findMany({
    where: {
      isOpponent: false,
      playerId: { not: null },
      match: { result: { not: null } },
    },
    select: {
      totalPoints: true,
      tries: true,
      penalties: true,
      player: { select: { firstName: true, lastName: true, slug: true } },
      match: {
        select: {
          slug: true,
          date: true,
          isHome: true,
          scoreUsap: true,
          scoreOpponent: true,
          opponent: { select: { shortName: true } },
        },
      },
    },
  });

  const saisons = await prisma.season.findMany({
    where: { matchesPlayed: { not: null } },
    orderBy: { startYear: "asc" },
  });

  // ── Fabrique de records ────────────────────────────────────────────
  const meilleur = <T,>(liste: T[], valeur: (x: T) => number): T | null =>
    liste.reduce<T | null>(
      (a, b) => (a === null || valeur(b) > valeur(a) ? b : a),
      null,
    );

  const affiche = (m: Rencontre) =>
    `${m.isHome ? "" : "à "}${m.opponent?.shortName ?? "?"} — ${m.scoreUsap}-${m.scoreOpponent}`;

  const victoires = joues.filter((m) => m.result === "VICTOIRE");
  const defaites = joues.filter((m) => m.result === "DEFAITE");
  const avecEssais = joues.filter((m) => m.triesUsap != null);
  const avecAffluence = joues.filter((m) => m.attendance != null);

  const plusLargeVictoire = meilleur(victoires, (m) => m.scoreUsap - m.scoreOpponent);
  const plusLourdeDefaite = meilleur(defaites, (m) => m.scoreOpponent - m.scoreUsap);
  const plusDePoints = meilleur(joues, (m) => m.scoreUsap);
  const plusEncaisses = meilleur(joues, (m) => m.scoreOpponent);
  const totalLePlusHaut = meilleur(joues, (m) => m.scoreUsap + m.scoreOpponent);
  const plusDEssais = meilleur(avecEssais, (m) => m.triesUsap!);
  const plusGrosseAffluence = meilleur(avecAffluence, (m) => m.attendance!);

  const plusDePointsJoueur = meilleur(lignes, (l) => l.totalPoints);
  const plusDEssaisJoueur = meilleur(lignes, (l) => l.tries);
  const plusDePenalites = meilleur(lignes, (l) => l.penalties);

  // ── Records de saison ──────────────────────────────────────────────
  type Saison = (typeof saisons)[number];
  const parSaison = (valeur: (s: Saison) => number) => meilleur(saisons, valeur);
  const diff = (s: Saison) => (s.pointsFor ?? 0) - (s.pointsAgainst ?? 0);

  const plusDePointsSaison = parSaison((s) => s.totalPoints ?? 0);
  const plusDeVictoires = parSaison((s) => s.wins ?? 0);
  const plusDeDefaites = parSaison((s) => s.losses ?? 0);
  const plusMarques = parSaison((s) => s.pointsFor ?? 0);
  const plusEncaissesSaison = parSaison((s) => s.pointsAgainst ?? 0);
  const meilleureDiff = parSaison(diff);
  const pireDiff = parSaison((s) => -diff(s));
  const plusDeBonus = parSaison((s) => s.bonusOffensif ?? 0);

  // Meilleur total individuel d'une saison, essais et points.
  const parJoueurEtSaison = new Map<
    string,
    { nom: string; slug: string; saison: string; essais: number; points: number }
  >();
  for (const l of lignes) {
    const saison = joues.find((m) => m.slug === l.match.slug)?.season.label;
    if (!saison || !l.player) continue;
    const cle = `${l.player.slug}|${saison}`;
    const b = parJoueurEtSaison.get(cle) ?? {
      nom: `${l.player.firstName} ${l.player.lastName}`,
      slug: l.player.slug,
      saison,
      essais: 0,
      points: 0,
    };
    b.essais += l.tries;
    b.points += l.totalPoints;
    parJoueurEtSaison.set(cle, b);
  }
  const totaux = [...parJoueurEtSaison.values()];
  const meilleurMarqueurSaison = meilleur(totaux, (t) => t.essais);
  const meilleurRealisateurSaison = meilleur(totaux, (t) => t.points);

  // ── Séries ─────────────────────────────────────────────────────────
  /** La plus longue suite de rencontres consécutives vérifiant `ok`. */
  function serie(ok: (resultat: string) => boolean) {
    let courante = 0;
    let record = { longueur: 0, debut: joues[0]?.date, fin: joues[0]?.date };
    let debut = joues[0]?.date;
    for (const m of joues) {
      if (!ok(m.result!)) {
        courante = 0;
        continue;
      }
      if (courante === 0) debut = m.date;
      courante++;
      if (courante > record.longueur) {
        record = { longueur: courante, debut, fin: m.date };
      }
    }
    return record;
  }
  const series = [
    { label: "Victoires d'affilée", ...serie((r) => r === "VICTOIRE") },
    { label: "Sans défaite", ...serie((r) => r !== "DEFAITE") },
    { label: "Défaites d'affilée", ...serie((r) => r === "DEFAITE") },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold uppercase tracking-wider text-foreground">
        <Flame className="h-8 w-8 text-usap-or" />
        Records
      </h1>
      <p className="mb-6 text-muted-foreground">
        Ce que l&apos;USAP a fait de mieux et de pire, sur une rencontre et sur
        une saison.
      </p>

      <div className="mb-10 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">
            Ce sont les records de la période couverte, pas ceux du club.
          </span>{" "}
          La base commence en 2004-2005 pour les rencontres, en 2005-2006 pour
          les bilans de saison : un siècle d&apos;histoire lui échappe encore.
        </p>
        <p className="mt-2">
          Les bilans de saison portent sur le <strong>championnat seul</strong>,
          phases finales exclues, et les saisons ne se comparent pas à armes
          égales : une saison de Pro D2 compte trente journées quand le Top 14
          en compte vingt-six. Le nombre de matchs est rappelé à chaque ligne.
        </p>
      </div>

      {/* ── Sur un match ────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
          <CalendarDays className="h-5 w-5 text-usap-or" />
          Sur un match
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plusLargeVictoire && (
            <Carte
              label="Plus large victoire"
              valeur={`+${plusLargeVictoire.scoreUsap - plusLargeVictoire.scoreOpponent}`}
              detail={affiche(plusLargeVictoire)}
              contexte={`${plusLargeVictoire.season.label} — ${formatDateFR(plusLargeVictoire.date)}`}
              href={`/matchs/${plusLargeVictoire.slug}`}
            />
          )}
          {plusLourdeDefaite && (
            <Carte
              label="Plus lourde défaite"
              valeur={`−${plusLourdeDefaite.scoreOpponent - plusLourdeDefaite.scoreUsap}`}
              detail={affiche(plusLourdeDefaite)}
              contexte={`${plusLourdeDefaite.season.label} — ${formatDateFR(plusLourdeDefaite.date)}`}
              href={`/matchs/${plusLourdeDefaite.slug}`}
            />
          )}
          {plusDePoints && (
            <Carte
              label="Plus de points marqués"
              valeur={plusDePoints.scoreUsap}
              detail={affiche(plusDePoints)}
              contexte={`${plusDePoints.season.label} — ${formatDateFR(plusDePoints.date)}`}
              href={`/matchs/${plusDePoints.slug}`}
            />
          )}
          {plusEncaisses && (
            <Carte
              label="Plus de points encaissés"
              valeur={plusEncaisses.scoreOpponent}
              detail={affiche(plusEncaisses)}
              contexte={`${plusEncaisses.season.label} — ${formatDateFR(plusEncaisses.date)}`}
              href={`/matchs/${plusEncaisses.slug}`}
            />
          )}
          {plusDEssais && (
            <Carte
              label="Plus d'essais marqués"
              valeur={plusDEssais.triesUsap!}
              detail={affiche(plusDEssais)}
              contexte={`${plusDEssais.season.label} — ${formatDateFR(plusDEssais.date)}`}
              href={`/matchs/${plusDEssais.slug}`}
            />
          )}
          {totalLePlusHaut && (
            <Carte
              label="Match le plus prolifique"
              valeur={totalLePlusHaut.scoreUsap + totalLePlusHaut.scoreOpponent}
              detail={affiche(totalLePlusHaut)}
              contexte={`${totalLePlusHaut.season.label} — ${formatDateFR(totalLePlusHaut.date)}`}
              href={`/matchs/${totalLePlusHaut.slug}`}
            />
          )}
          {plusDePointsJoueur?.player && (
            <Carte
              label="Points d'un joueur"
              valeur={plusDePointsJoueur.totalPoints}
              detail={plusDePointsJoueur.player.firstName + " " + plusDePointsJoueur.player.lastName}
              contexte={`${plusDePointsJoueur.match.isHome ? "" : "à "}${plusDePointsJoueur.match.opponent?.shortName} — ${formatDateFR(plusDePointsJoueur.match.date)}`}
              href={`/joueurs/${plusDePointsJoueur.player.slug}`}
            />
          )}
          {plusDEssaisJoueur?.player && (
            <Carte
              label="Essais d'un joueur"
              valeur={plusDEssaisJoueur.tries}
              detail={plusDEssaisJoueur.player.firstName + " " + plusDEssaisJoueur.player.lastName}
              contexte={`${plusDEssaisJoueur.match.isHome ? "" : "à "}${plusDEssaisJoueur.match.opponent?.shortName} — ${formatDateFR(plusDEssaisJoueur.match.date)}`}
              href={`/joueurs/${plusDEssaisJoueur.player.slug}`}
            />
          )}
          {plusDePenalites?.player && (
            <Carte
              label="Pénalités d'un joueur"
              valeur={plusDePenalites.penalties}
              detail={plusDePenalites.player.firstName + " " + plusDePenalites.player.lastName}
              contexte={`${plusDePenalites.match.isHome ? "" : "à "}${plusDePenalites.match.opponent?.shortName} — ${formatDateFR(plusDePenalites.match.date)}`}
              href={`/joueurs/${plusDePenalites.player.slug}`}
            />
          )}
          {plusGrosseAffluence && (
            <Carte
              label="Plus forte affluence"
              valeur={plusGrosseAffluence.attendance!.toLocaleString("fr-FR")}
              detail={affiche(plusGrosseAffluence)}
              contexte={`${plusGrosseAffluence.season.label} — ${formatDateFR(plusGrosseAffluence.date)}`}
              href={`/matchs/${plusGrosseAffluence.slug}`}
              note="36 matchs seulement ont une affluence renseignée."
            />
          )}
        </div>
      </section>

      {/* ── Sur une saison ──────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
          <Trophy className="h-5 w-5 text-usap-or" />
          Sur une saison
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Plus de points au classement", s: plusDePointsSaison, v: (s: Saison) => s.totalPoints },
            { label: "Plus de victoires", s: plusDeVictoires, v: (s: Saison) => s.wins },
            { label: "Plus de défaites", s: plusDeDefaites, v: (s: Saison) => s.losses },
            { label: "Plus de points marqués", s: plusMarques, v: (s: Saison) => s.pointsFor },
            { label: "Plus de points encaissés", s: plusEncaissesSaison, v: (s: Saison) => s.pointsAgainst },
            { label: "Meilleure différence", s: meilleureDiff, v: (s: Saison) => `+${diff(s)}` },
            { label: "Pire différence", s: pireDiff, v: (s: Saison) => `${diff(s)}` },
            { label: "Plus de bonus offensifs", s: plusDeBonus, v: (s: Saison) => s.bonusOffensif },
          ].map(
            ({ label, s, v }) =>
              s && (
                <Carte
                  key={label}
                  label={label}
                  valeur={v(s) ?? "—"}
                  detail={s.label}
                  contexte={`${s.division === "PRO_D2" ? "Pro D2" : "Top 14"} — ${s.matchesPlayed} matchs`}
                  href={`/saisons/${s.label}`}
                />
              ),
          )}
          {meilleurMarqueurSaison && (
            <Carte
              label="Essais sur une saison"
              valeur={meilleurMarqueurSaison.essais}
              detail={meilleurMarqueurSaison.nom}
              contexte={meilleurMarqueurSaison.saison}
              href={`/joueurs/${meilleurMarqueurSaison.slug}`}
            />
          )}
          {meilleurRealisateurSaison && (
            <Carte
              label="Points sur une saison"
              valeur={meilleurRealisateurSaison.points}
              detail={meilleurRealisateurSaison.nom}
              contexte={meilleurRealisateurSaison.saison}
              href={`/joueurs/${meilleurRealisateurSaison.slug}`}
            />
          )}
        </div>
      </section>

      {/* ── Séries ──────────────────────────────────────────── */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
          <Flame className="h-5 w-5 text-usap-or" />
          Séries
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Rencontres consécutives, toutes compétitions confondues et sans
          coupure entre les saisons.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {series.map((s) => (
            <Carte
              key={s.label}
              label={s.label}
              valeur={s.longueur}
              detail={
                s.debut && s.fin
                  ? `${formatDateFR(s.debut)} → ${formatDateFR(s.fin)}`
                  : "—"
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Une carte de record : la valeur, ce qu'elle désigne, et où la vérifier. */
function Carte({
  label,
  valeur,
  detail,
  contexte,
  href,
  note,
}: {
  label: string;
  valeur: number | string;
  detail: string;
  contexte?: string;
  href?: string;
  note?: string;
}) {
  const corps = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-usap-sang">{valeur}</p>
      <p className="mt-1 font-medium text-foreground">{detail}</p>
      {contexte && (
        <p className="text-sm text-muted-foreground">{contexte}</p>
      )}
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </>
  );

  const classes =
    "block rounded-lg border border-border bg-usap-carte p-4 transition-colors";

  return href ? (
    <Link href={href} className={`${classes} hover:border-usap-or/40`}>
      {corps}
    </Link>
  ) : (
    <div className={classes}>{corps}</div>
  );
}
