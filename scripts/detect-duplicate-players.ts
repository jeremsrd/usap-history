/**
 * Cherche les fiches Player qui désignent le même homme. Lecture seule.
 *
 * **Pourquoi il existe.** Tous les doublons du projet ont été trouvés par
 * hasard, parce qu'un nom coinçait sur autre chose : « Max Hicks » à côté de
 * « Maxwell Hicks » après une fusion, neuf fiches dans la seule composition de
 * Grenoble au barrage 2024-2025, dix autres révélées le 30 août 2026 en
 * relisant des feuilles officielles. Aucun contrôle ne les cherchait.
 *
 * **Et rien ne les rattraperait.** Un doublon recréé par un script d'import
 * relancé porte le nom que la feuille officielle écrit : `audit-opponent-
 * lineups.ts` le lit alors conforme et ne dit rien. `delete-orphan-players.ts`
 * non plus, la fiche portant un vrai match. C'est le trou que ce script bouche.
 *
 * **Ce qu'il ne fait pas.** Il ne fusionne rien et ne propose rien : il
 * classe et il montre ses preuves. C'est ce qui le sépare de
 * `fix-duplicate-players.ts`, qui apparie les prénoms par préfixe et par
 * inclusion — trop large pour être lancé sans revue. Ici l'arbitrage reste à
 * l'œil humain, et la fusion à `merge-players.ts`.
 *
 * **Sur quoi il s'appuie**, dans l'ordre de force :
 *
 *   CERTAIN   deux fiches au nom complet identique une fois normalisé. Rien à
 *             arbitrer : c'est le même nom écrit deux fois
 *   FORT      même patronyme, jamais sur la même feuille, **même club**, et
 *             même dossard ou même poste. C'est la signature du doublon né
 *             d'un import : un homme, deux écritures de son prénom
 *   À VOIR    même patronyme, jamais sur la même feuille, même poste, mais
 *             des clubs différents — un transfert, ou deux hommes
 *
 * **Jamais sur la même feuille** est le garde-fou central : deux joueurs d'un
 * même match sont deux hommes. Il écarte les frères qui se sont croisés —
 * Richie et Rory Arnold le 5 février 2022, Moses et Paul Alo Emile.
 *
 * **Mais il ne suffit pas**, et le premier passage l'a montré : deux frères
 * qui n'ont jamais joué le même match restent proposés. Sacha et Mathys
 * Lotrian sortaient en tête du lot FORT, Grégory et Mattéo Le Corvec juste
 * après. C'est pourquoi le script ne fusionne rien : la table `DISTINCTS`
 * ci-dessous garde la trace des paires déjà arbitrées, et le reste demande
 * une lecture des feuilles officielles.
 *
 * Usage :
 *   npx tsx scripts/detect-duplicate-players.ts             # CERTAIN et FORT
 *   npx tsx scripts/detect-duplicate-players.ts --tout      # + À VOIR
 *
 * À relancer après tout import de masse, et après toute fusion : c'est
 * précisément une fusion qui réarme les scripts à usage unique dont le nom en
 * dur ne répond plus.
 */

import { PrismaClient } from "@prisma/client";
import { normalize } from "./lib/noms";

const prisma = new PrismaClient();

const TOUT = process.argv.includes("--tout");

/**
 * Paires déjà arbitrées : deux hommes, malgré le patronyme et le club.
 *
 * Vérifiée à la main comme `NOMS_DUSAGE` et `VARIANTES_DAFFICHAGE` : y ajouter
 * une ligne, c'est affirmer que ce sont deux personnes. Sans elle, le script
 * reproposerait les mêmes faux positifs à chaque passage, et l'on prendrait
 * l'habitude de sauter son résultat — ce qui le rendrait inutile.
 *
 *   Lotrian   Sacha et Mathys sont frères, tous deux passés par l'USAP, Sacha
 *             aussi par Clermont. Ils ne se croisent sur aucune feuille, d'où
 *             la proposition.
 *   Le Corvec Grégory, troisième ligne de la finale 2009, et Mattéo, de
 *             l'effectif 2025-2026. Leur confusion a déjà été démêlée par
 *             merge-duplicate-players-2026.ts, qui avait rattaché à Grégory
 *             quatre matchs de Mattéo.
 *
 * **Les seize suivantes viennent du lot À VOIR**, arbitrées le 30 août 2026 par
 * le même test que les paires FORT : lire la feuille officielle de chaque
 * fiche et voir quel prénom la source écrit. Les deux ont été confirmés à
 * chaque fois, et ce sont deux prénoms différents — souvent deux frères. Une
 * seule paire du lot était un vrai doublon, Elliott / Elliot Stooke, que les
 * deux sources écrivent « Elliott » : fusionnée, elle ne figure pas ici.
 *
 * Le club sert de repère quand le patronyme ne suffit plus : Jonathan Gray est
 * à l'UBB quand Richie est à Glasgow puis Toulouse, Jack Willis à Toulouse
 * quand Tom est à l'UBB.
 *
 * **La dernière est venue avec 2015-2016**, et le même club ne la départageait
 * pas : les deux Marty ont porté le maillot catalan, et tous deux le n°21, ce
 * qui suffit au niveau FORT. Ce sont pourtant deux hommes, et la LNR les nomme
 * l'un et l'autre en toutes lettres : « David Marty » le 21 août et le 29
 * novembre 2015, « Paul Marty » le 17 novembre et le 9 décembre 2016. Leurs
 * carrières ne se recouvrent pas — David finit en mai 2016, Paul commence en
 * novembre — et leurs postes non plus : David est le centre international,
 * n°13 sur douze de ses quinze feuilles ; Paul est ouvreur et arrière, n°10
 * puis n°15.
 *
 * **Et la suivante avec 2014-2015**, où le même club et le même n°5 ne
 * départageaient pas davantage : Henry Tuilagi, deuxième ligne et numéro 8 de
 * l'USAP sur les douze feuilles de 2014-2015, et Posolo, deuxième ligne de
 * l'effectif actuel, soixante-quatre feuilles depuis 2022-2023. Huit ans
 * séparent la dernière de l'un de la première de l'autre, et la LNR écrit
 * « Henry Tuilagi » en toutes lettres sur les feuilles de 2014-2015. Ce sont
 * le père et le fils.
 *
 * **Les deux dernières viennent de 2013-2014**, et tiennent du même motif :
 * deux hommes du même patronyme passés par l'USAP, séparés par des années et
 * rapprochés par un dossard partagé.
 *
 *   Perez     Jean-Pierre Pérez, troisième ligne aile, cinquante-cinq feuilles
 *             de 2009 à 2018 ; Alexandre Perez, demi d'ouverture, neuf
 *             feuilles de 2021 à 2023. Trois ans les séparent, et la LNR écrit
 *             « Jean Pierre Perez » sur les feuilles de 2013-2014.
 *   Fernandez Patricio Fernández, l'ouvreur argentin de 2020 à 2023, et Romain
 *             Fernandez, une seule feuille — Toulon, le 22 novembre 2013, où
 *             la LNR l'inscrit ainsi au n°22. Une fiche à feuille unique
 *             mérite qu'on regarde à deux fois : ici c'est bien la source qui
 *             écrit ce prénom, huit ans avant l'arrivée de Patricio.
 */
const DISTINCTS: [string, string][] = [
  ["Sacha Lotrian", "Mathys Lotrian"],
  ["Grégory Le Corvec", "Mattéo Le Corvec"],
  // Lot À VOIR, arbitré le 30 août 2026 sur les feuilles officielles.
  ["Jonathan Gray", "Richie Gray"],
  ["Guillaume Marchand", "Julien Marchand"],
  ["Jules Le Bail", "Clovis Le Bail"],
  ["Pagakalasio Tafili", "Paulo Tafili"],
  ["Nathanaël Hulleu", "Wilfried Hulleu"],
  ["Jack Willis", "Tom Willis"],
  ["Teddy Thomas", "Ben Thomas"],
  ["Michael Ruru", "Jonathan Ruru"],
  ["Timothé Mezou", "Corentin Mezou"],
  ["Pierre Garcia", "Gonzalo Garcia"],
  ["Keiran Williams", "James Williams"],
  ["Gareth Thomas", "Yann Thomas"],
  ["Aled Davies", "Luke Davies"],
  ["Andrew Smith", "Ollie Smith"],
  ["Chris Smith", "Fletcher Smith"],
  ["Johannes Jonker", "Rynhardt Jonker"],
  // Venue avec 2015-2016, arbitrée le 31 août 2026 sur les feuilles officielles.
  ["David Marty", "Paul Marty"],
  // Venue avec 2014-2015, arbitrée de même : le père et le fils.
  ["Henry Tuilagi", "Posolo Tuilagi"],
  // Venues avec 2013-2014, arbitrées le 31 août 2026 sur les feuilles.
  ["Jean-Pierre Pérez", "Alexandre Perez"],
  ["Patricio Fernández", "Romain Fernandez"],
];

const ARBITREES = new Set(
  DISTINCTS.flatMap(([a, b]) => [
    `${normalize(a)}|${normalize(b)}`,
    `${normalize(b)}|${normalize(a)}`,
  ]),
);

type Force = "CERTAIN" | "FORT" | "À VOIR";

interface Fiche {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  /** Clubs pour lesquels la fiche a joué — « USAP », ou l'identifiant du club adverse. */
  clubs: Set<string>;
  /** Dossards portés, par club. */
  dossards: Map<string, Set<number>>;
  matchs: Set<string>;
  feuilles: number;
}

interface Paire {
  force: Force;
  a: Fiche;
  b: Fiche;
  preuve: string;
}

async function main() {
  console.log(`=== Fiches joueur en double${TOUT ? " (tout)" : ""} ===\n`);

  const joueurs = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true, position: true },
  });
  const lignes = await prisma.matchPlayer.findMany({
    select: {
      playerId: true,
      shirtNumber: true,
      isOpponent: true,
      matchId: true,
      match: { select: { opponentId: true } },
    },
  });

  const fiches = new Map<string, Fiche>(
    joueurs.map((j) => [
      j.id,
      {
        ...j,
        clubs: new Set<string>(),
        dossards: new Map<string, Set<number>>(),
        matchs: new Set<string>(),
        feuilles: 0,
      },
    ]),
  );

  for (const l of lignes) {
    const f = l.playerId && fiches.get(l.playerId);
    if (!f) continue;
    // Le club d'une ligne : l'adversaire du match, ou l'USAP.
    const club = l.isOpponent ? l.match.opponentId : "USAP";
    f.clubs.add(club);
    f.matchs.add(l.matchId);
    f.feuilles++;
    if (l.shirtNumber != null) {
      if (!f.dossards.has(club)) f.dossards.set(club, new Set());
      f.dossards.get(club)!.add(l.shirtNumber);
    }
  }

  // Regroupement par patronyme normalisé : seules ces fiches-là se comparent.
  const parNom = new Map<string, Fiche[]>();
  for (const f of fiches.values()) {
    const cle = normalize(f.lastName);
    if (!cle) continue;
    if (!parNom.has(cle)) parNom.set(cle, []);
    parNom.get(cle)!.push(f);
  }

  const paires: Paire[] = [];

  for (const groupe of parNom.values()) {
    if (groupe.length < 2) continue;
    for (let i = 0; i < groupe.length; i++) {
      for (let j = i + 1; j < groupe.length; j++) {
        const a = groupe[i];
        const b = groupe[j];

        const nomComplet = (f: Fiche) => normalize(`${f.firstName} ${f.lastName}`);
        if (ARBITREES.has(`${nomComplet(a)}|${nomComplet(b)}`)) continue;
        if (nomComplet(a) === nomComplet(b)) {
          paires.push({ force: "CERTAIN", a, b, preuve: "nom complet identique une fois normalisé" });
          continue;
        }

        // Deux joueurs d'une même feuille sont deux hommes. Le garde-fou qui
        // écarte les frères d'office.
        const communs = [...a.matchs].filter((m) => b.matchs.has(m));
        if (communs.length > 0) continue;

        const clubsCommuns = [...a.clubs].filter((c) => b.clubs.has(c));
        const memePoste = a.position != null && a.position === b.position;

        if (clubsCommuns.length > 0) {
          const dossardsCommuns = clubsCommuns.flatMap((c) =>
            [...(a.dossards.get(c) ?? [])].filter((n) => b.dossards.get(c)?.has(n)),
          );
          if (dossardsCommuns.length > 0) {
            paires.push({
              force: "FORT",
              a,
              b,
              preuve: `même club, même dossard (n°${[...new Set(dossardsCommuns)].sort((x, y) => x - y).join(", n°")})`,
            });
          } else if (memePoste) {
            paires.push({ force: "FORT", a, b, preuve: `même club, même poste (${a.position})` });
          }
        } else if (memePoste) {
          paires.push({ force: "À VOIR", a, b, preuve: `même poste (${a.position}), clubs différents` });
        }
      }
    }
  }

  const noms = await prisma.opponent.findMany({ select: { id: true, shortName: true, name: true } });
  const club = (id: string) =>
    id === "USAP" ? "USAP" : (noms.find((o) => o.id === id)?.shortName ?? noms.find((o) => o.id === id)?.name ?? "?");

  const ORDRE: Force[] = ["CERTAIN", "FORT", "À VOIR"];
  const retenues = TOUT ? ORDRE : ORDRE.slice(0, 2);

  for (const force of retenues) {
    const lot = paires.filter((p) => p.force === force);
    if (lot.length === 0) continue;
    console.log(`--- ${force} — ${lot.length} paire(s)\n`);
    for (const p of lot.sort((x, y) => y.a.feuilles + y.b.feuilles - (x.a.feuilles + x.b.feuilles))) {
      console.log(`  ${p.a.firstName} ${p.a.lastName} / ${p.b.firstName} ${p.b.lastName} — ${p.preuve}`);
      for (const f of [p.a, p.b]) {
        console.log(
          `      ${f.id}  ${f.feuilles} feuille(s)` +
            `  ${[...f.clubs].map(club).join(", ") || "aucun club"}` +
            `  ${f.position ?? "poste inconnu"}`,
        );
      }
      console.log(
        `      npx tsx scripts/merge-players.ts --keep=<id> --drop=<id> --nom="Prénom|Nom" --dry\n`,
      );
    }
  }

  const total = ORDRE.map((f) => `${f} ${paires.filter((p) => p.force === f).length}`).join("  ");
  console.log(`=== ${joueurs.length} fiches examinées — ${total} ===`);
  if (!TOUT && paires.some((p) => p.force === "À VOIR")) {
    console.log("    « --tout » ajoute les paires À VOIR (même poste, clubs différents).");
  }
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
