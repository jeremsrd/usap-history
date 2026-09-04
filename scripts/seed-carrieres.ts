/**
 * Carrières et passages à l'USAP, déduits des feuilles de match en base.
 *
 * **CE QUE CE SCRIPT ÉCRIT N'EST PAS UNE CARRIÈRE, C'EST UNE TRACE.** Les
 * modèles `CareerClub` et `PlayerStint` décrivent des contrats — arrivée,
 * départ, prêt, montant du transfert. La base, elle, ne connaît que des
 * apparitions : telle feuille, tel jour, tel club. On ne peut donc en tirer
 * qu'un encadrement, et chaque ligne le dit dans ses `notes`.
 *
 * Trois règles en découlent, arbitrées par Jérémy le 4 septembre 2026.
 *
 * **1. LES DEUX CAMPS, MAIS PAS LES MÊMES COMPTEURS.** La carrière porte le
 * passage à l'USAP et les clubs sous lesquels le joueur a affronté l'USAP.
 * Seules les lignes catalanes portent `appearances` et `tries` : là, le
 * compte est complet sur les saisons couvertes, et les colonnes « Matchs » et
 * « Essais » de la fiche disent vrai. Sur un club adverse, elles voudraient
 * dire « contre l'USAP », ce que l'en-tête ne dit pas — elles restent donc
 * **nulles**, et la fiche les rend « — ». Le détail des rencontres contre
 * l'USAP a déjà son tableau, correctement intitulé.
 *
 * **2. RIEN NE COMMENCE À LA PREMIÈRE SAISON EN BASE.** L'archive de la LNR
 * s'arrête à 2004-2005 : un joueur qui y apparaît pour la première fois peut
 * être au club depuis dix ans — Bernard Goutta est à l'USAP depuis 1997. Une
 * ligne dont la première apparition tombe en 2004-2005 n'est donc **pas
 * écrite** : mieux vaut pas de carrière qu'une année d'arrivée fausse. Une
 * quarantaine de joueurs catalans sont dans ce cas, et des figures du club
 * avec eux.
 *
 * **ET C'EST LE JOUEUR ENTIER QUI SORT, PAS SEULEMENT LA LIGNE.** Écarter le
 * seul passage catalan de Nicolas Mas lui laissait une carrière réduite à
 * « Montpellier 2013-2014 » : le pilier aux cent vingt-huit feuilles y
 * paraissait n'avoir jamais porté le maillot. Une carrière tronquée ment plus
 * qu'une carrière absente — dès qu'un passage n'est pas bornable, le joueur
 * n'a pas de carrière du tout.
 *
 * La borne haute se traite autrement, parce qu'elle est réversible : une
 * dernière apparition dans la **saison la plus récente** ne prouve aucun
 * départ, et `endYear` reste alors `null` — « encore au club », ce que le
 * modèle sait dire.
 *
 * **3. UN TROU DE TROIS SAISONS OUVRE UN SECOND PASSAGE — CÔTÉ CATALAN
 * SEULEMENT.** Un trou d'apparitions n'est pas un trou de contrat : un joueur
 * blessé toute une saison ne quitte pas son club, et vingt et un Catalans ont
 * un trou de deux saisons. À partir de trois, le retour est manifeste — douze
 * joueurs, dont des trous de huit et dix saisons.
 *
 * **Mais un trou de saisons ne se compte pas en saisons.** Sur un club
 * adverse, la base ne voit que les rencontres contre l'USAP, et le trou
 * mesurerait alors la **division de l'USAP**, pas la carrière du joueur :
 * quand l'USAP est en Pro D2 — quatre saisons de 2014 à 2018, deux de 2019 à
 * 2021 —, aucun club de Top 14 ne la croise, et tous leurs joueurs
 * paraissent avoir déménagé. Apisai Naqalevu s'en trouvait à Clermont « de
 * 2018 à 2019 » puis « de 2021 à 2022 », quand il n'en avait pas bougé.
 *
 * Ne plus découper du tout était pire : Maxime Mermoz, toulousain en
 * 2007-2008 puis de nouveau en 2018-2019, paraissait l'être « de 2007 à
 * 2019 », par-dessus ses passages à l'USAP et à Toulon. Deux clubs à la fois,
 * ce que rien n'autorise.
 *
 * **Le trou se compte donc en occasions manquées** : les saisons, entre deux
 * apparitions, où ce club-là a bien rencontré l'USAP sans que le joueur y
 * figure. Trois de suite ouvrent un second passage. La règle se lit
 * entièrement dans la base, et elle vaut des deux côtés — pour l'USAP, toute
 * saison est une occasion, et l'on retrouve le seuil de trois saisons.
 *
 * `PlayerStint` ne concerne que l'USAP, et c'est ce que le modèle décrit. Ses
 * dates sont celles de la première et de la dernière feuille, jamais celles
 * d'une signature : `arrivalType` et `departureType` restent nuls, la base
 * n'en sait rien.
 *
 * Idempotent : seules les lignes que ce script a écrites sont effacées avant
 * réécriture, reconnues à leur `notes`.
 *
 * Usage : npx tsx scripts/seed-carrieres.ts [--dry] [--joueur="Prénom Nom"]
 */
import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const JOUEUR = process.argv.find((a) => a.startsWith("--joueur="))?.slice("--joueur=".length);

/** Marque des lignes dérivées : elles seules sont effacées à la relance. */
const PROVENANCE =
  "Période établie sur les feuilles de match en base — première et dernière " +
  "apparition. Le passage réel peut déborder de part et d'autre.";

/** Occasions manquées d'affilée à partir desquelles on tient le retour pour un
 *  second passage. Une occasion est une saison où le club a rencontré l'USAP. */
const OCCASIONS_QUI_SEPARENT = 3;

interface Apparition {
  date: Date;
  startYear: number;
  endYear: number;
  tries: number;
  position: Position | null;
}

interface Passage {
  debut: Apparition;
  fin: Apparition;
  matchs: number;
  essais: number;
  postes: Map<Position, number>;
}

/**
 * Découpe les apparitions d'un joueur à un club en passages distincts.
 *
 * `occasions` donne les saisons où ce club a rencontré l'USAP : c'est là, et
 * là seulement, que l'absence du joueur veut dire quelque chose. Cf. la
 * règle 3 de l'en-tête.
 */
function decouper(apparitions: Apparition[], occasions: Set<number>): Passage[] {
  const manquees = (depuis: number, jusqu: number) =>
    [...occasions].filter((s) => s > depuis && s < jusqu).length;

  const passages: Passage[] = [];
  for (const a of apparitions) {
    const courant = passages[passages.length - 1];
    if (
      courant &&
      manquees(courant.fin.startYear, a.startYear) < OCCASIONS_QUI_SEPARENT
    ) {
      courant.fin = a;
      courant.matchs++;
      courant.essais += a.tries;
      if (a.position) courant.postes.set(a.position, (courant.postes.get(a.position) ?? 0) + 1);
      continue;
    }
    const postes = new Map<Position, number>();
    if (a.position) postes.set(a.position, 1);
    passages.push({ debut: a, fin: a, matchs: 1, essais: a.tries, postes });
  }
  return passages;
}

async function main() {
  console.log(`=== Carrières déduites des feuilles${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const saisons = await prisma.season.findMany({
    where: { matches: { some: { result: { not: null } } } },
    orderBy: { startYear: "asc" },
    select: { startYear: true },
  });
  const PREMIERE = saisons[0].startYear;
  const DERNIERE = saisons[saisons.length - 1].startYear;
  console.log(`Saisons jouées en base : ${PREMIERE} à ${DERNIERE}\n`);

  /** Toutes les saisons jouées : les occasions du camp catalan. */
  const saisonsJouees = new Set(saisons.map((s) => s.startYear));
  /** Saisons où chaque club adverse a rencontré l'USAP. */
  const occasionsParClub = new Map<string, Set<number>>();
  for (const m of await prisma.match.findMany({
    where: { result: { not: null } },
    select: { opponentId: true, season: { select: { startYear: true } } },
  })) {
    if (!m.opponentId) continue;
    if (!occasionsParClub.has(m.opponentId)) occasionsParClub.set(m.opponentId, new Set());
    occasionsParClub.get(m.opponentId)!.add(m.season.startYear);
  }

  const france = await prisma.country.findFirstOrThrow({ where: { code: "FR" } });
  const clubs = new Map(
    (await prisma.opponent.findMany()).map((o) => [o.id, o]),
  );

  const lignes = await prisma.matchPlayer.findMany({
    where: {
      playerId: { not: null },
      ...(JOUEUR
        ? {
            player: {
              is: {
                firstName: JOUEUR.split(" ")[0],
                lastName: JOUEUR.split(" ").slice(1).join(" "),
              },
            },
          }
        : {}),
    },
    select: {
      playerId: true,
      isOpponent: true,
      tries: true,
      positionPlayed: true,
      match: {
        select: {
          date: true,
          opponentId: true,
          season: { select: { startYear: true, endYear: true } },
        },
      },
    },
  });

  /** Apparitions groupées par joueur puis par club — `null` désigne l'USAP. */
  const parJoueur = new Map<string, Map<string | null, Apparition[]>>();
  for (const l of lignes) {
    const club = l.isOpponent ? l.match.opponentId : null;
    if (l.isOpponent && !club) continue;
    if (!parJoueur.has(l.playerId!)) parJoueur.set(l.playerId!, new Map());
    const parClub = parJoueur.get(l.playerId!)!;
    if (!parClub.has(club)) parClub.set(club, []);
    parClub.get(club)!.push({
      date: l.match.date,
      startYear: l.match.season.startYear,
      endYear: l.match.season.endYear,
      tries: l.tries ?? 0,
      position: l.positionPlayed,
    });
  }

  let ecrites = 0;
  let stints = 0;
  let ecarteesBorne = 0;
  let joueursTouches = 0;
  let joueursEcartes = 0;

  if (!DRY_RUN) {
    // **Les passages partent d'abord, et par leur lien.** `PlayerStint` ne
    // porte qu'un `careerClubId` scalaire, sans relation ni cascade : effacer
    // les carrières d'abord laisserait des passages orphelins, pointant une
    // ligne disparue. Une relance en a laissé trois cent douze avant que ce
    // ne soit corrigé.
    const derivees = await prisma.careerClub.findMany({
      where: { notes: PROVENANCE },
      select: { id: true },
    });
    const orphelins = await prisma.playerStint.deleteMany({
      where: {
        OR: [
          { careerClubId: { in: derivees.map((c) => c.id) } },
          // Les orphelins d'avant la correction : leur lien ne mène nulle part.
          { careerClubId: { notIn: derivees.map((c) => c.id) }, arrivalType: null },
        ],
      },
    });
    const efface = await prisma.careerClub.deleteMany({ where: { notes: PROVENANCE } });
    if (efface.count > 0 || orphelins.count > 0) {
      console.log(
        `  ${efface.count} carrière(s) et ${orphelins.count} passage(s) dérivé(s) effacé(s)\n`,
      );
    }
  }

  for (const [playerId, parClub] of parJoueur) {
    /** Passages retenus, tous clubs confondus, pour l'ordre d'affichage. */
    const retenus: Array<{ club: string | null; passage: Passage }> = [];
    /** Un seul passage non bornable, et le joueur entier sort. */
    let horsBornes = 0;

    for (const [club, apparitions] of parClub) {
      apparitions.sort((a, b) => a.date.getTime() - b.date.getTime());
      // `club` vaut `null` pour l'USAP, dont toute saison jouée est une occasion.
      const occasions = club === null
        ? saisonsJouees
        : (occasionsParClub.get(club) ?? saisonsJouees);
      for (const passage of decouper(apparitions, occasions)) {
        // Un passage qui commence à la première saison en base ne dit pas
        // quand le joueur est arrivé.
        if (passage.debut.startYear === PREMIERE) {
          horsBornes++;
          continue;
        }
        retenus.push({ club, passage });
      }
    }
    if (horsBornes > 0) {
      ecarteesBorne += horsBornes;
      joueursEcartes++;
      continue;
    }
    if (retenus.length === 0) continue;
    joueursTouches++;

    retenus.sort((a, b) => a.passage.debut.date.getTime() - b.passage.debut.date.getTime());

    for (const [ordre, { club, passage }] of retenus.entries()) {
      const opponent = club ? clubs.get(club) : null;
      const isUsap = club === null;
      // Une dernière apparition dans la saison la plus récente ne prouve
      // aucun départ : « encore au club ».
      const encore = passage.fin.startYear === DERNIERE;
      const poste =
        [...passage.postes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      if (DRY_RUN) {
        ecrites++;
        if (isUsap) stints++;
        continue;
      }

      const cree = await prisma.careerClub.create({
        data: {
          playerId,
          clubName: isUsap ? "USA Perpignan" : (opponent?.name ?? "?"),
          opponentId: opponent?.id ?? null,
          isUsap,
          countryId: isUsap ? france.id : (opponent?.countryId ?? null),
          city: isUsap ? "Perpignan" : (opponent?.city ?? null),
          startYear: passage.debut.startYear,
          endYear: encore ? null : passage.fin.endYear,
          startDate: passage.debut.date,
          endDate: encore ? null : passage.fin.date,
          displayOrder: ordre,
          // Cf. règle 1 : ces compteurs ne disent vrai que du côté catalan.
          appearances: isUsap ? passage.matchs : null,
          tries: isUsap ? passage.essais : null,
          position: poste,
          notes: PROVENANCE,
        },
      });
      ecrites++;

      if (isUsap) {
        await prisma.playerStint.create({
          data: {
            playerId,
            arrivalDate: passage.debut.date,
            departureDate: encore ? null : passage.fin.date,
            careerClubId: cree.id,
          },
        });
        stints++;
      }
    }
  }

  console.log(
    `=== ${ecrites} ligne(s) de carrière pour ${joueursTouches} joueur(s), ` +
      `${stints} passage(s) à l'USAP ===`,
  );
  console.log(
    `  ${joueursEcartes} joueur(s) sans carrière : ${ecarteesBorne} de leurs passages ` +
      `commencent en ${PREMIERE}-${PREMIERE + 1}, la première saison en base, et rien ne ` +
      "dit depuis quand",
  );
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main().finally(() => prisma.$disconnect());
