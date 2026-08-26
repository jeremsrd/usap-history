/**
 * Réalisations et cartons des joueurs adverses de Challenge européen,
 * saison 2024-2025.
 *
 * ⚠ Ce script ne traite plus que les matchs de coupe d'Europe. Les rencontres
 * de Top 14 et le barrage sont désormais repris de la LNR, source officielle,
 * par seed-opponent-sheet-2024-2025.ts : elle nomme correctement les auteurs
 * là où ESPN s'est trompé deux fois (essai de Théo Ntamack attribué à Romain,
 * transformation et pénalité de Jérémy Fernandez portées à Louis Le Brun) et
 * date les cartons à la minute officielle. Le laisser tourner sur ces matchs
 * réécraserait la donnée officielle par celle d'ESPN.
 *
 * Ces cinq rencontres n'avaient aucun marqueur adverse : les compteurs du
 * match annonçaient des essais que personne n'avait marqués, et les fiches des
 * adversaires en sortaient vides. L'EPCR reste à explorer pour leur donner
 * aussi les temps de jeu, qu'ESPN ne permet pas de reconstituer ici.
 *
 * Source : API ESPN, `summary?event={id}` — le bloc
 * `header.competitions[0].details` donne chaque action avec sa minute, son
 * auteur et le score courant. Les identifiants ont été retrouvés via
 * `scoreboard?dates=AAAAMMJJ` sur la ligue 272073, puis vérifiés un par un.
 *
 * Deux garde-fous avant toute écriture, par match :
 *   - le score ESPN doit correspondre au score en base, sinon l'identifiant
 *     pointe sur une autre rencontre ;
 *   - la somme des points des joueurs doit retomber sur le score de l'équipe,
 *     essai de pénalité déduit (7 points sans marqueur, cf. CLAUDE.md), et le
 *     nombre d'essais sur le compteur du match.
 * Un match qui échoue est signalé et sauté : les autres sont écrits.
 *
 * ESPN oublie les essais de pénalité dans sa chronologie : c'est sans effet
 * ici, puisqu'ils ne sont attribués à personne et sont déjà en base.
 *
 * Usage :
 *   npx tsx scripts/seed-opponent-scorers-2024-2025.ts --dry
 *   npx tsx scripts/seed-opponent-scorers-2024-2025.ts
 *
 * Idempotent : les réalisations adverses du match sont remises à zéro avant
 * d'être réécrites.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SEASON = "2024-2025";

/** Identifiants ESPN, par date de match. */
const ESPN_EVENTS: Record<string, { league: string; event: string }> = {
  "2024-12-08": { league: "272073", event: "599836" }, // Cheetahs
  "2024-12-15": { league: "272073", event: "599853" }, // Connacht
  "2025-01-11": { league: "272073", event: "599858" }, // Cardiff
  "2025-01-19": { league: "272073", event: "599888" }, // Zebre
  "2025-04-05": { league: "272073", event: "599889" }, // Racing 92
};

interface Action {
  minute: number;
  /** Nom de l'auteur tel qu'écrit par la source. */
  athlete: string;
  kind: "try" | "conversion" | "penalty" | "drop" | "yellow" | "red";
}

const POINTS = { try: 5, conversion: 2, penalty: 3, drop: 3 } as const;

const TYPES_ESPN: Record<string, Action["kind"]> = {
  try: "try",
  conversion: "conversion",
  "penalty goal": "penalty",
  "drop goal": "drop",
  "yellow card": "yellow",
  "red card": "red",
};

// =============================================================================
// OUTILLAGE
// =============================================================================

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

async function fetchJson(url: string): Promise<any> {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const reponse = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (reponse.ok) return await reponse.json();
    } catch {
      // on retente
    }
  }
  throw new Error(`ESPN injoignable : ${url}`);
}

/** Minute d'une action ESPN : « 47' », « 80'+2 »… */
function parseMinute(clock: string): number {
  const m = clock.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

interface RosterRow {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Rattache un nom de source à une ligne de la composition. ESPN raccourcit
 * volontiers les noms composés — « Dany Priso » pour Dany Priso Mouangue,
 * « Levani Botia » pour Levani Botia Veivuke : l'égalité stricte du nom de
 * famille ne suffit pas, on accepte un nom contenu dans l'autre à condition
 * que la correspondance soit unique.
 */
function apparier(roster: RosterRow[], nom: string): RosterRow | null {
  const complet = normalize(nom);
  const exact = roster.filter(
    (r) => normalize(`${r.firstName} ${r.lastName}`) === complet,
  );
  if (exact.length === 1) return exact[0];

  const tokens = nom.trim().split(/\s+/);
  const prenom = normalize(tokens[0]);
  const famille = normalize(tokens.slice(1).join(" "));

  const parNom = roster.filter((r) => normalize(r.lastName) === famille);
  if (parNom.length === 1) return parNom[0];
  if (parNom.length > 1) {
    const avecPrenom = parNom.filter((r) => normalize(r.firstName) === prenom);
    if (avecPrenom.length === 1) return avecPrenom[0];
  }

  // Nom de famille tronqué d'un côté ou de l'autre
  const contenus = roster.filter((r) => {
    const dbNom = normalize(r.lastName);
    const dbComplet = normalize(`${r.firstName} ${r.lastName}`);
    return (
      (famille.length >= 4 && (dbNom.startsWith(famille) || famille.startsWith(dbNom))) ||
      dbComplet.startsWith(complet) ||
      complet.startsWith(dbComplet)
    );
  });
  if (contenus.length === 1) return contenus[0];

  const avecPrenom = contenus.filter((r) => normalize(r.firstName) === prenom);
  if (avecPrenom.length === 1) return avecPrenom[0];

  return null;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log(
    `=== Réalisations adverses ${SEASON}${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const season = await prisma.season.findFirstOrThrow({ where: { label: SEASON } });
  const matchs = await prisma.match.findMany({
    where: { seasonId: season.id },
    orderBy: { date: "asc" },
    include: {
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { shortName: true } },
    },
  });

  let traites = 0;
  let ignores = 0;
  const echecs: string[] = [];

  for (const match of matchs) {
    // Top 14 et barrage : traités par seed-opponent-sheet-2024-2025.ts
    if (match.competition.shortName !== "Challenge Européen") continue;

    const jour = match.date.toISOString().slice(0, 10);
    const adversaire = match.opponent.shortName ?? match.opponent.name;
    const etiquette = `${jour} ${adversaire.padEnd(16)} ${match.scoreUsap}-${match.scoreOpponent}`;

    const roster = (
      await prisma.matchPlayer.findMany({
        where: { matchId: match.id, isOpponent: true },
        select: { id: true, playerId: true, player: { select: { firstName: true, lastName: true } } },
      })
    )
      .filter((r) => r.player)
      .map((r) => ({ id: r.id, firstName: r.player!.firstName, lastName: r.player!.lastName }));

    // Rien à faire si le détail est déjà complet
    const dejaSaisi = await prisma.matchPlayer.aggregate({
      where: { matchId: match.id, isOpponent: true },
      _sum: { totalPoints: true },
    });
    const attendu = match.scoreOpponent - 7 * match.penaltyTriesOpponent;
    if ((dejaSaisi._sum.totalPoints ?? 0) === attendu && attendu > 0) {
      ignores++;
      continue;
    }

    // ---- Collecte des actions -------------------------------------------
    let actions: Action[];
    const espn = ESPN_EVENTS[jour];

    if (espn) {
      const resume = await fetchJson(
        `https://site.api.espn.com/apis/site/v2/sports/rugby/${espn.league}/summary?event=${espn.event}`,
      );
      const rencontre = resume?.header?.competitions?.[0];
      const equipes: any[] = rencontre?.competitors ?? [];
      const usap = equipes.find((t) => (t.team?.displayName ?? "").includes("Perpignan"));
      const autre = equipes.find((t) => t !== usap);

      if (!usap || !autre) {
        echecs.push(`${etiquette} : l'événement ESPN ${espn.event} ne concerne pas l'USAP`);
        continue;
      }
      if (Number(usap.score) !== match.scoreUsap || Number(autre.score) !== match.scoreOpponent) {
        echecs.push(
          `${etiquette} : score ESPN ${usap.score}-${autre.score}, l'identifiant pointe ailleurs`,
        );
        continue;
      }

      actions = (rencontre.details ?? [])
        .filter((d: any) => d.team?.id === autre.team?.id && TYPES_ESPN[d.type?.text])
        .map((d: any) => ({
          minute: parseMinute(d.clock?.displayValue ?? "0"),
          athlete: d.participants?.[0]?.athlete?.displayName ?? "",
          kind: TYPES_ESPN[d.type.text],
        }))
        .filter((a: Action) => a.athlete);
    } else {
      echecs.push(`${etiquette} : aucune source`);
      continue;
    }

    // ---- Agrégation par joueur -------------------------------------------
    const parLigne = new Map<
      string,
      {
        row: RosterRow;
        tries: number;
        conversions: number;
        penalties: number;
        drops: number;
        points: number;
        yellow: number | null;
        red: number | null;
      }
    >();
    const inconnus: string[] = [];

    for (const action of actions) {
      const row = apparier(roster, action.athlete);
      if (!row) {
        inconnus.push(`${action.athlete} (${action.kind} ${action.minute}')`);
        continue;
      }
      const acc =
        parLigne.get(row.id) ??
        {
          row,
          tries: 0,
          conversions: 0,
          penalties: 0,
          drops: 0,
          points: 0,
          yellow: null as number | null,
          red: null as number | null,
        };
      switch (action.kind) {
        case "try":
          acc.tries++;
          acc.points += POINTS.try;
          break;
        case "conversion":
          acc.conversions++;
          acc.points += POINTS.conversion;
          break;
        case "penalty":
          acc.penalties++;
          acc.points += POINTS.penalty;
          break;
        case "drop":
          acc.drops++;
          acc.points += POINTS.drop;
          break;
        case "yellow":
          acc.yellow = action.minute;
          break;
        case "red":
          acc.red = action.minute;
          break;
      }
      parLigne.set(row.id, acc);
    }

    // ---- Contrôles --------------------------------------------------------
    const lignes = [...parLigne.values()];
    const points = lignes.reduce((s, l) => s + l.points, 0);
    const essais = lignes.reduce((s, l) => s + l.tries, 0);

    if (inconnus.length > 0) {
      echecs.push(`${etiquette} : auteur(s) hors composition — ${inconnus.join(", ")}`);
      continue;
    }
    if (points !== attendu) {
      echecs.push(
        `${etiquette} : ${points} points reconstitués pour ${attendu} attendus` +
          (match.penaltyTriesOpponent > 0
            ? ` (essai(s) de pénalité déduit(s) : ${match.penaltyTriesOpponent})`
            : ""),
      );
      continue;
    }
    if (match.triesOpponent != null && essais !== match.triesOpponent) {
      echecs.push(
        `${etiquette} : ${essais} essais reconstitués pour ${match.triesOpponent} au compteur du match`,
      );
      continue;
    }

    const cartons = lignes.filter((l) => l.yellow != null || l.red != null).length;
    console.log(
      `${etiquette} → ${lignes.length} joueur(s), ${essais} essai(s), ${points} pts` +
        (cartons ? `, ${cartons} carton(s)` : ""),
    );
    for (const l of lignes) {
      const detail = [
        l.tries ? `${l.tries}E` : null,
        l.conversions ? `${l.conversions}T` : null,
        l.penalties ? `${l.penalties}P` : null,
        l.drops ? `${l.drops}D` : null,
        l.yellow != null ? `🟨${l.yellow}'` : null,
        l.red != null ? `🟥${l.red}'` : null,
      ]
        .filter(Boolean)
        .join(" ");
      console.log(`    ${l.row.firstName} ${l.row.lastName} — ${detail} (${l.points} pts)`);
    }

    if (DRY_RUN) {
      traites++;
      continue;
    }

    // ---- Écriture ---------------------------------------------------------
    await prisma.matchPlayer.updateMany({
      where: { matchId: match.id, isOpponent: true },
      data: {
        tries: 0,
        conversions: 0,
        penalties: 0,
        dropGoals: 0,
        totalPoints: 0,
        yellowCard: false,
        yellowCardMin: null,
        redCard: false,
        redCardMin: null,
      },
    });

    for (const l of lignes) {
      await prisma.matchPlayer.update({
        where: { id: l.row.id },
        data: {
          tries: l.tries,
          conversions: l.conversions,
          penalties: l.penalties,
          dropGoals: l.drops,
          totalPoints: l.points,
          yellowCard: l.yellow != null,
          yellowCardMin: l.yellow,
          redCard: l.red != null,
          redCardMin: l.red,
        },
      });
    }

    const verif = await prisma.matchPlayer.aggregate({
      where: { matchId: match.id, isOpponent: true },
      _sum: { totalPoints: true, tries: true },
    });
    if ((verif._sum.totalPoints ?? 0) !== attendu) {
      throw new Error(`${etiquette} : ${verif._sum.totalPoints} points écrits pour ${attendu} attendus`);
    }
    traites++;
  }

  console.log(
    `\n=== ${traites} match(s) ${DRY_RUN ? "prêts" : "complétés"}, ${ignores} déjà à jour, ${echecs.length} en échec ===`,
  );
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
