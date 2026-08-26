/**
 * Feuille adverse complète de la saison 2024-2025, depuis la LNR.
 *
 * Les minutes adverses de cette saison étaient une fiction : 474 titulaires à
 * exactement 80' et 256 remplaçants à 0', aucune entrée renseignée sur les
 * 32 matchs. Des joueurs figuraient donc comme marqueurs sans avoir joué une
 * minute. Ce script reconstitue les temps de jeu à partir des changements
 * officiels, et réécrit dans la foulée les réalisations et les cartons.
 *
 * Les réalisations avaient été importées depuis ESPN par
 * seed-opponent-scorers-2024-2025.ts. La LNR est la source de référence : ses
 * noms sont ceux des feuilles officielles, ses essais portent leur
 * transformateur, et elle n'oublie pas les essais de pénalité — trois points
 * sur lesquels ESPN s'est montré fautif. Toute divergence est signalée, et
 * c'est la LNR qui l'emporte.
 *
 * Source : top14.lnr.fr/feuille-de-match/2024-2025/{phase}/{id}-{dom}-{ext}
 *          /resumes-replays, via scripts/lib/lnr.ts
 *
 * Couverture : les 26 journées de Top 14 et le barrage d'accession. Les
 * quatre matchs de Challenge européen n'y figurent pas — ils relèvent de
 * l'EPCR et gardent leurs réalisations ESPN, sans minutes.
 *
 * Contrôles avant écriture, par match :
 *   - le camp de l'USAP déduit de l'URL doit correspondre à `isHome` ;
 *   - tout auteur ou remplaçant absent de la composition en base fait échouer
 *     le match entier : un nom non apparié fausserait les temps de jeu des
 *     deux joueurs concernés ;
 *   - la somme des points doit retomber sur le score, essais de pénalité
 *     déduits, et le nombre d'essais sur le compteur du match.
 * Les temps de jeu font l'objet d'un simple avertissement : un carton rouge
 * ou un remplacement temporaire non refermé décale le total sans invalider
 * la feuille.
 *
 * Usage :
 *   npx tsx scripts/seed-opponent-sheet-2024-2025.ts --dry
 *   npx tsx scripts/seed-opponent-sheet-2024-2025.ts
 *
 * Idempotent : la feuille adverse est remise à zéro avant d'être réécrite.
 */

import { PrismaClient } from "@prisma/client";
import {
  chercherFeuille,
  lireFeuille,
  type Camp,
  type LnrFeuille,
  type LnrJoueur,
} from "./lib/lnr";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2024-2025";
const DUREE = 80;

interface Ligne {
  id: string;
  firstName: string;
  lastName: string;
  shirtNumber: number | null;
  isStarter: boolean;
}

interface Bilan {
  minutes: number | null;
  subIn: number | null;
  subOut: number | null;
  tries: number;
  conversions: number;
  penalties: number;
  drops: number;
  points: number;
  jaune: number | null;
  rouge: number | null;
}

const normalize = (valeur: string) =>
  valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

/**
 * Rattache un joueur LNR à une ligne de la composition en base. Les noms
 * officiels sont parfois plus longs que ceux enregistrés — « Lewis Wesley
 * LUDLAM » pour Lewis Ludlam, « Dany PRISO MOUANGUE » pour Dany Priso : on
 * accepte qu'un nom soit contenu dans l'autre, à condition que la
 * correspondance reste unique.
 */
function apparier(roster: Ligne[], joueur: LnrJoueur): Ligne | null {
  const nom = normalize(joueur.lastName);
  const prenom = normalize(joueur.firstName);
  const complet = nom + prenom;

  const exact = roster.filter(
    (l) => normalize(l.lastName) === nom && normalize(l.firstName) === prenom,
  );
  if (exact.length === 1) return exact[0];

  const parNom = roster.filter((l) => normalize(l.lastName) === nom);
  if (parNom.length === 1) return parNom[0];
  if (parNom.length > 1) {
    // Deux frères sur la même feuille (Moses et Paul Alo Emile) : le prénom
    // tranche, la LNR ajoutant volontiers un second prénom.
    const parPrenom = parNom.filter((l) => {
      const dbPrenom = normalize(l.firstName);
      return dbPrenom.startsWith(prenom) || prenom.startsWith(dbPrenom);
    });
    if (parPrenom.length === 1) return parPrenom[0];
  }

  const contenus = roster.filter((l) => {
    const dbNom = normalize(l.lastName);
    const dbComplet = dbNom + normalize(l.firstName);
    return (
      (dbNom.length >= 4 && (dbNom.startsWith(nom) || nom.startsWith(dbNom))) ||
      dbComplet.startsWith(complet) ||
      complet.startsWith(dbComplet)
    );
  });
  if (contenus.length === 1) return contenus[0];

  const avecPrenom = contenus.filter((l) => normalize(l.firstName) === prenom);
  return avecPrenom.length === 1 ? avecPrenom[0] : null;
}

/**
 * Temps de jeu de chaque ligne, reconstitué à partir des changements.
 * Un joueur peut sortir puis revenir : on additionne les intervalles, et on
 * ne garde comme `subIn` / `subOut` que la première entrée et la première
 * sortie, seules valeurs que porte le modèle.
 */
function calculerTempsDeJeu(
  roster: Ligne[],
  feuille: LnrFeuille,
  campAdverse: Camp,
  bilans: Map<string, Bilan>,
  echecs: string[],
) {
  const surLeTerrain = new Map<string, number | null>();
  const total = new Map<string, number>();

  for (const ligne of roster) {
    surLeTerrain.set(ligne.id, ligne.isStarter ? 0 : null);
    total.set(ligne.id, 0);
  }

  /**
   * @param sortie vraie sortie (remplacement, carton rouge) plutôt que la
   *   fin de la rencontre : seule une vraie sortie se note dans `subOut`.
   */
  const fermer = (id: string, minute: number, sortie: boolean) => {
    const depuis = surLeTerrain.get(id);
    if (depuis == null) return;
    total.set(id, (total.get(id) ?? 0) + Math.max(0, minute - depuis));
    surLeTerrain.set(id, null);
    const bilan = bilans.get(id)!;
    if (sortie && bilan.subOut == null) bilan.subOut = minute;
  };

  for (const changement of feuille.changements.filter((c) => c.club === campAdverse)) {
    const entrant = apparier(roster, changement.entrant);
    const sortant = apparier(roster, changement.sortant);
    if (!entrant || !sortant) {
      echecs.push(
        `changement ${changement.minute}' non apparié : ` +
          `${changement.entrant.firstName} ${changement.entrant.lastName} ← ` +
          `${changement.sortant.firstName} ${changement.sortant.lastName}`,
      );
      continue;
    }
    fermer(sortant.id, changement.minute, true);
    if (surLeTerrain.get(entrant.id) == null) {
      surLeTerrain.set(entrant.id, changement.minute);
      const bilan = bilans.get(entrant.id)!;
      if (bilan.subIn == null) bilan.subIn = changement.minute;
    }
  }

  for (const ligne of roster) {
    // Un carton rouge met fin au match du joueur
    const rouge = bilans.get(ligne.id)!.rouge;
    fermer(ligne.id, rouge ?? DUREE, rouge != null);
    const joue = total.get(ligne.id) ?? 0;
    const bilan = bilans.get(ligne.id)!;
    // Remplaçant jamais entré : minutes inconnues plutôt que zéro
    bilan.minutes = !ligne.isStarter && bilan.subIn == null ? null : joue;
  }
}

async function main() {
  console.log(
    `=== Feuille adverse ${SAISON} depuis la LNR${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  const matchs = await prisma.match.findMany({
    where: { seasonId: saison.id },
    orderBy: { date: "asc" },
    include: {
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { shortName: true } },
    },
  });

  let traites = 0;
  const horsPerimetre: string[] = [];
  const echecs: string[] = [];
  const divergences: string[] = [];

  for (const match of matchs) {
    const jour = match.date.toISOString().slice(0, 10);
    const adversaire = match.opponent.shortName ?? match.opponent.name;
    const etiquette = `${jour} ${adversaire.padEnd(16)} ${match.scoreUsap}-${match.scoreOpponent}`;

    const phase =
      match.matchday != null
        ? `j${match.matchday}`
        : match.competition.shortName === "Barrages"
          ? "access-top-14"
          : null;
    if (!phase) {
      horsPerimetre.push(`${etiquette} (${match.competition.shortName})`);
      continue;
    }

    const url = await chercherFeuille(SAISON, phase);
    if (!url) {
      echecs.push(`${etiquette} : feuille LNR introuvable pour ${phase}`);
      continue;
    }

    const feuille = await lireFeuille(url);
    if ((feuille.campUsap === "home") !== match.isHome) {
      echecs.push(
        `${etiquette} : ${url} donne l'USAP ${feuille.campUsap}, la base dit ${match.isHome ? "home" : "away"}`,
      );
      continue;
    }
    const campAdverse: Camp = feuille.campUsap === "home" ? "away" : "home";

    const roster: Ligne[] = (
      await prisma.matchPlayer.findMany({
        where: { matchId: match.id, isOpponent: true },
        select: {
          id: true,
          isStarter: true,
          shirtNumber: true,
          player: { select: { firstName: true, lastName: true } },
        },
      })
    )
      .filter((l) => l.player)
      .map((l) => ({
        id: l.id,
        firstName: l.player!.firstName,
        lastName: l.player!.lastName,
        shirtNumber: l.shirtNumber,
        isStarter: l.isStarter,
      }));

    const bilans = new Map<string, Bilan>(
      roster.map((l) => [
        l.id,
        {
          minutes: null,
          subIn: null,
          subOut: null,
          tries: 0,
          conversions: 0,
          penalties: 0,
          drops: 0,
          points: 0,
          jaune: null,
          rouge: null,
        },
      ]),
    );

    const ennuis: string[] = [];
    let essaisDePenalite = 0;

    // ---- Réalisations et cartons ------------------------------------------
    for (const fait of feuille.faits.filter((f) => f.club === campAdverse)) {
      if (fait.type === "essai-de-penalite") {
        essaisDePenalite++;
        continue;
      }
      if (!fait.joueur) {
        ennuis.push(`fait ${fait.minute}' ${fait.type} sans auteur`);
        continue;
      }
      const ligne = apparier(roster, fait.joueur);
      if (!ligne) {
        ennuis.push(
          `${fait.type} ${fait.minute}' : ${fait.joueur.firstName} ${fait.joueur.lastName} hors composition`,
        );
        continue;
      }
      const bilan = bilans.get(ligne.id)!;
      switch (fait.type) {
        case "essai":
          bilan.tries++;
          bilan.points += 5;
          break;
        case "penalite":
          bilan.penalties++;
          bilan.points += 3;
          break;
        case "drop":
          bilan.drops++;
          bilan.points += 3;
          break;
        case "jaune":
          bilan.jaune = fait.minute;
          break;
        case "rouge":
          bilan.rouge = fait.minute;
          break;
      }
      if (fait.type === "essai" && fait.transformePar) {
        const buteur = apparier(roster, fait.transformePar);
        if (!buteur) {
          ennuis.push(
            `transformation ${fait.minute}' : ${fait.transformePar.firstName} ${fait.transformePar.lastName} hors composition`,
          );
        } else {
          const b = bilans.get(buteur.id)!;
          b.conversions++;
          b.points += 2;
        }
      }
    }

    // ---- Temps de jeu ------------------------------------------------------
    calculerTempsDeJeu(roster, feuille, campAdverse, bilans, ennuis);

    if (ennuis.length > 0) {
      echecs.push(`${etiquette} :\n      ${ennuis.join("\n      ")}`);
      continue;
    }

    // ---- Contrôles ---------------------------------------------------------
    const lignes = [...bilans.entries()];
    const points = lignes.reduce((s, [, b]) => s + b.points, 0);
    const essais = lignes.reduce((s, [, b]) => s + b.tries, 0);
    const attendu = match.scoreOpponent - 7 * essaisDePenalite;

    if (points !== attendu) {
      echecs.push(
        `${etiquette} : ${points} points reconstitués pour ${attendu} attendus ` +
          `(${match.scoreOpponent} au score, ${essaisDePenalite} essai(s) de pénalité)`,
      );
      continue;
    }
    if (match.triesOpponent != null && essais !== match.triesOpponent) {
      echecs.push(
        `${etiquette} : ${essais} essais reconstitués pour ${match.triesOpponent} au compteur`,
      );
      continue;
    }
    if (essaisDePenalite !== match.penaltyTriesOpponent) {
      divergences.push(
        `${etiquette} : ${essaisDePenalite} essai(s) de pénalité selon la LNR, ${match.penaltyTriesOpponent} en base`,
      );
    }

    const minutes = lignes.reduce((s, [, b]) => s + (b.minutes ?? 0), 0);
    const perduesRouge = lignes.reduce(
      (s, [, b]) => s + (b.rouge != null ? DUREE - b.rouge : 0),
      0,
    );
    const minutesAttendues = 15 * DUREE - perduesRouge;
    const alerte = minutes !== minutesAttendues ? ` ⚠ ${minutes}/${minutesAttendues} minutes` : "";

    const joueurs = lignes.filter(([, b]) => b.points > 0 || b.jaune != null || b.rouge != null);
    const entres = lignes.filter(([, b]) => b.subIn != null).length;
    console.log(
      `${etiquette} → ${essais} essai(s), ${points} pts, ${entres} entrée(s)${alerte}`,
    );
    for (const [id, b] of joueurs) {
      const ligne = roster.find((l) => l.id === id)!;
      const detail = [
        b.tries ? `${b.tries}E` : null,
        b.conversions ? `${b.conversions}T` : null,
        b.penalties ? `${b.penalties}P` : null,
        b.drops ? `${b.drops}D` : null,
        b.jaune != null ? `🟨${b.jaune}'` : null,
        b.rouge != null ? `🟥${b.rouge}'` : null,
      ]
        .filter(Boolean)
        .join(" ");
      console.log(
        `    ${String(ligne.shirtNumber ?? "").padStart(2)} ${ligne.firstName} ${ligne.lastName} — ${detail} (${b.minutes ?? "?"}')`,
      );
    }

    if (DRY_RUN) {
      traites++;
      continue;
    }

    // ---- Écriture -----------------------------------------------------------
    for (const [id, b] of lignes) {
      await prisma.matchPlayer.update({
        where: { id },
        data: {
          minutesPlayed: b.minutes,
          subIn: b.subIn,
          subOut: b.subOut,
          tries: b.tries,
          conversions: b.conversions,
          penalties: b.penalties,
          dropGoals: b.drops,
          totalPoints: b.points,
          yellowCard: b.jaune != null,
          yellowCardMin: b.jaune,
          redCard: b.rouge != null,
          redCardMin: b.rouge,
        },
      });
    }

    const verif = await prisma.matchPlayer.aggregate({
      where: { matchId: match.id, isOpponent: true },
      _sum: { totalPoints: true },
    });
    if ((verif._sum.totalPoints ?? 0) !== attendu) {
      throw new Error(`${etiquette} : ${verif._sum.totalPoints} points écrits pour ${attendu}`);
    }
    traites++;
  }

  console.log(
    `\n=== ${traites} match(s) ${DRY_RUN ? "prêts" : "écrits"}, ` +
      `${horsPerimetre.length} hors périmètre, ${echecs.length} en échec ===`,
  );
  for (const h of horsPerimetre) console.log(`  — ${h}`);
  for (const d of divergences) console.log(`  ⚠ ${d}`);
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
