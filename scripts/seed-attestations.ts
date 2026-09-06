/**
 * Les attestations que CLAUDE.md portait à la place de la base.
 *
 * Jusqu'au 6 septembre 2026, chaque fait venu d'ailleurs que de la feuille
 * officielle — un stade posé d'après Wikipédia, un arbitre donné par Jérémy,
 * un poste tranché à la main, une campagne européenne lue chez ESPN — vivait
 * dans ce fichier et dans les messages de commit. Ce script les écrit dans
 * la table `attestations`, par `lib/attestations.ts`, pour que le site puisse
 * les afficher et que le lecteur sache ce que vaut ce qu'il lit.
 *
 * **Rien ici n'est nouveau** : chaque ligne reprend un arbitrage déjà rendu
 * et documenté, avec sa date et sa source. Le script est idempotent — une
 * attestation par entité et par champ, remplacée à chaque passage — et se
 * relance sans risque.
 *
 * Ce qu'il pose, par famille :
 *   - **les postes tranchés** : Amituanai (Jérémy), Riccioni (Wikipédia),
 *     Halaifonua (Jérémy) ;
 *   - **ce que Jérémy a donné à la main** : l'arbitre du barrage 2022, la
 *     mi-temps du barrage 2023, l'arbitre de la première journée 2026-2027,
 *     la composition du barrage 2022, le stade de la finale 2018 ;
 *   - **les terrains d'aujourd'hui posés sur des rencontres d'hier** :
 *     Dax, Massy, Narbonne, Albi, Bourgoin par Jérémy ; Carcassonne, Rouen,
 *     Agen, Tarbes et les quinze clubs européens par Wikipédia ou la LNR
 *     hors feuille ;
 *   - **les terrains neutres** : Mosson 2006, Gerland 2009, Stade de France
 *     2009 et 2010, Mosson 2010, Montjuïc et Milton Keynes 2011, Ernest-
 *     Wallon 2018, GGL 2021 — et le Madejski 2008 ;
 *   - **les écussons** venus d'ailleurs que de la LNR et de l'EPCR ;
 *   - **les scores corrigés contre la LNR** : Narbonne 2006, Bourgoin 2004 ;
 *     les cinq journées de 2005-2006 hors calendrier, d'après Wikipédia ;
 *   - **les couperets renseignés par Wikipédia** : arbitres et affluences de
 *     2008, 2011 et 2013, la demi-finale de 2006 entière ;
 *   - **les campagnes européennes d'avant 2020-2021** : ESPN validé par la
 *     poule, ou l'ERC par la Wayback Machine ;
 *   - **les saisons dont le garde-fou n'est pas la LNR** : 2005-2006,
 *     2007-2008, 2008-2009 par Wikipédia ; le cinquième bonus de 2006-2007
 *     par allrugby.
 *
 * Usage :
 *   npx tsx scripts/seed-attestations.ts --dry
 *   npx tsx scripts/seed-attestations.ts
 */

import { PrismaClient } from "@prisma/client";
import { attester, type Attestation } from "./lib/attestations";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const WIKI = (page: string) => `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.replace(/ /g, "_"))}`;

async function matchDuJour(jour: string): Promise<string> {
  const debut = new Date(`${jour}T00:00:00Z`);
  const fin = new Date(debut.getTime() + 86_400_000);
  const m = await prisma.match.findMany({ where: { date: { gte: debut, lt: fin } }, select: { id: true } });
  if (m.length !== 1) throw new Error(`${jour} : ${m.length} rencontre(s), il en faut une`);
  return m[0].id;
}

async function club(shortName: string): Promise<string> {
  const c = await prisma.opponent.findFirst({ where: { shortName }, select: { id: true } });
  if (!c) throw new Error(`club « ${shortName} » introuvable`);
  return c.id;
}

async function joueur(prenom: string, nom: string): Promise<string> {
  const j = await prisma.player.findMany({ where: { firstName: prenom, lastName: nom }, select: { id: true } });
  if (j.length !== 1) throw new Error(`${prenom} ${nom} : ${j.length} fiche(s)`);
  return j[0].id;
}

async function saison(label: string): Promise<string> {
  const s = await prisma.season.findFirst({ where: { label }, select: { id: true } });
  if (!s) throw new Error(`saison ${label} introuvable`);
  return s.id;
}

async function main() {
  console.log(`=== Attestations${DRY ? " (simulation)" : ""} ===\n`);
  const lignes: Attestation[] = [];

  // --- Les postes tranchés -------------------------------------------------
  lignes.push(
    {
      entite: "Player", entiteId: await joueur("Bradley", "Amituanai"), champ: "position", degre: "ARBITRE",
      source: "Jérémy, le 2 septembre 2026", decidePar: "Jérémy",
      note: "La LNR s'arrête à « 1ère ligne », Wikipédia à « Prop », aucune feuille ne tranchait. Sa première feuille de Top 14 confirmera ou infirmera : un n°1 vaudrait correction.",
    },
    {
      entite: "Player", entiteId: await joueur("Marco", "Riccioni"), champ: "position", degre: "CONCORDANT",
      source: "Wikipédia, « Marco Riccioni »", sourceUrl: WIKI("Marco Riccioni"),
      note: "Pilier droit aux Saracens d'après l'article ; la LNR s'arrête à « 1ère ligne ».",
    },
    {
      entite: "Player", entiteId: await joueur("Tanginoa", "Halaifonua"), champ: "position", degre: "ARBITRE",
      source: "Jérémy, le 6 septembre 2026", decidePar: "Jérémy",
      note: "Fiche fusionnée de deux écritures de la LNR ; ses neuf feuilles vont du 4 au 6 et du 18 au 19, la fiche portait « numéro 8 » sans qu'aucune ne le justifie.",
    },
  );

  // --- Ce que Jérémy a donné à la main --------------------------------------
  lignes.push(
    { entite: "Match", entiteId: await matchDuJour("2022-06-12"), champ: "refereeId", degre: "ARBITRE", source: "Jérémy", decidePar: "Jérémy",
      note: "La LNR ne publie pas la feuille d'un access match ; cf. fix-barrages-access-match.ts." },
    { entite: "Match", entiteId: await matchDuJour("2022-06-12"), champ: "composition", degre: "PROBABLE", source: "Listes fournies à la main, recoupées avec les changements de la feuille officielle",
      note: "Seule composition de la saison qu'aucune source ne publie ; ses numéros restent incertains, cf. seed-lineup-barrage-2022.ts." },
    { entite: "Match", entiteId: await matchDuJour("2023-06-03"), champ: "halfTime", degre: "ARBITRE", source: "Jérémy", decidePar: "Jérémy",
      note: "« Grenoble menait 16-11 à la pause » — et la confrontation à la chronologie a révélé une transformation manquante, depuis rétablie." },
    { entite: "Match", entiteId: await matchDuJour("2026-09-05"), champ: "refereeId", degre: "OFFICIEL", source: "Désignation de la LNR, donnée par Jérémy le 5 septembre 2026", decidePar: "Jérémy",
      note: "La LNR ne désigne l'arbitre sur sa feuille qu'après le match ; cf. set-arbitre.ts." },
    { entite: "Match", entiteId: await matchDuJour("2018-05-06"), champ: "venueId", degre: "ARBITRE", source: "Jérémy, qui y était", decidePar: "Jérémy",
      note: "Finale de Pro D2 sur terrain neutre, stade Ernest-Wallon de Toulouse ; la feuille de la LNR désigne quand même un recevant." },
  );

  // --- Les terrains d'aujourd'hui, posés sur des rencontres d'hier ---------
  for (const c of ["Dax", "Massy", "Narbonne", "Albi", "Bourgoin"]) {
    lignes.push({ entite: "Opponent", entiteId: await club(c), champ: "venueId", degre: "ARBITRE", source: "Jérémy", decidePar: "Jérémy",
      note: "Club sorti de Pro D2, dont la page de la LNR ne nomme plus le stade : c'est le terrain d'aujourd'hui, sans preuve qu'il y recevait déjà à l'époque." });
  }
  lignes.push(
    { entite: "Opponent", entiteId: await club("Carcassonne"), champ: "venueId", degre: "PROBABLE", source: "Wikipédia, « US Carcassonne XV »", sourceUrl: WIKI("Union sportive carcassonnaise XV"),
      note: "Le stade d'aujourd'hui, Albert-Domec ; rien ne vérifie par machine qu'il y recevait déjà." },
    { entite: "Opponent", entiteId: await club("Rouen"), champ: "venueId", degre: "PROBABLE", source: "Wikipédia, « Rouen Normandie rugby »", sourceUrl: WIKI("Rouen Normandie rugby"),
      note: "Le stade d'aujourd'hui, Robert-Diochon ; même réserve sur 2020-2021." },
    { entite: "Opponent", entiteId: await club("Agen"), champ: "venueId", degre: "PROBABLE", source: "La LNR, dans un article — ni sa page de club ni ses feuilles ne portent de lieu",
      note: "Le stade d'aujourd'hui, Armandie ; même réserve sur le 2 septembre 2018." },
    { entite: "Opponent", entiteId: await club("Tarbes"), champ: "venueId", degre: "PROBABLE", source: "Wikipédia et l'adresse publiée par la FFR sur Mon Club House, concordantes", sourceUrl: WIKI("Stade Maurice-Trélut"),
      note: "Deux sources, aucune officielle au sens du projet, et la même réserve sur l'époque." },
  );
  const europeens: [string, string][] = [
    ["Leicester", "Welford Road"], ["Munster", "Thomond Park"], ["Northampton", "Franklin's Gardens"], ["Scarlets", "Parc y Scarlets"],
    ["Exeter", "Sandy Park"], ["Cavalieri Prato", "Stadio Lungobisenzio"], ["Edinburgh", "Murrayfield"], ["Sale", "AJ Bell Stadium"],
    ["Connacht", "The Sportsground"], ["London Irish", "Madejski Stadium"], ["Worcester", "Sixways"], ["Rovigo", "Stadio Mario Battaglini"],
    ["Gernika", "Estadio Urbieta"], ["Ulster", "Ravenhill Stadium"], ["Dragons", "Rodney Parade"],
  ];
  for (const [c, stade] of europeens) {
    lignes.push({ entite: "Opponent", entiteId: await club(c), champ: "venueId", degre: "PROBABLE", source: `Wikipédia, « ${stade} »`, sourceUrl: WIKI(stade),
      note: "Terrain posé à la main d'après Wikipédia, l'EPCR et ESPN ne donnant pas le stade ; c'est le terrain d'aujourd'hui." });
  }

  // --- Les terrains neutres des couperets -----------------------------------
  const neutres: [string, string, Attestation["degre"], string][] = [
    ["2006-06-02", "Wikipédia, « Championnat de France de rugby à XV 2005-2006 »", "CONCORDANT", "Demi-finale au stade de la Mosson, Montpellier ; la LNR ne publie rien de ce match."],
    ["2008-04-05", "ESPN et Wikipédia", "CONCORDANT", "Quart de finale de Heineken Cup au Madejski Stadium de Reading."],
    ["2009-05-30", "Presse d'époque", "PROBABLE", "Demi-finale à Gerland, Lyon."],
    ["2009-06-06", "Presse d'époque", "CONCORDANT", "Finale au Stade de France ; sur terrain neutre, le drapeau « à domicile » est conventionnel."],
    ["2010-05-14", "Presse d'époque", "PROBABLE", "Demi-finale au stade de la Mosson, Montpellier."],
    ["2010-05-29", "Presse d'époque", "CONCORDANT", "Finale au Stade de France."],
    ["2011-04-09", "Wikipédia, « Coupe d'Europe de rugby à XV 2010-2011 »", "CONCORDANT", "Quart de finale à l'Estadi Olímpic Lluís Companys de Montjuïc ; ESPN écrit « Cornella de Llobregat » et se trompe, l'affluence de 55 000 le dément."],
    ["2011-05-01", "Wikipédia, « Coupe d'Europe de rugby à XV 2010-2011 »", "CONCORDANT", "Demi-finale au Stadium MK de Milton Keynes."],
    ["2021-06-05", "Presse d'époque", "CONCORDANT", "Finale de Pro D2 au GGL Stadium de Montpellier ; la feuille de la LNR désigne quand même un recevant."],
  ];
  for (const [jour, source, degre, note] of neutres) {
    lignes.push({ entite: "Match", entiteId: await matchDuJour(jour), champ: "venueId", degre, source, note });
  }

  // --- Ce que Wikipédia donne des couperets ---------------------------------
  for (const [jour, page] of [
    ["2008-04-05", "Coupe d'Europe de rugby à XV 2007-2008"],
    ["2011-04-09", "Coupe d'Europe de rugby à XV 2010-2011"],
    ["2011-05-01", "Coupe d'Europe de rugby à XV 2010-2011"],
    ["2013-04-05", "Challenge européen de rugby à XV 2012-2013"],
    ["2013-04-26", "Challenge européen de rugby à XV 2012-2013"],
  ] as const) {
    const id = await matchDuJour(jour);
    for (const champ of ["refereeId", "attendance"]) {
      lignes.push({ entite: "Match", entiteId: id, champ, degre: "CONCORDANT", source: `Wikipédia, « ${page} »`, sourceUrl: WIKI(page),
        note: "ESPN ne donne ni arbitre ni affluence sur ces rencontres ; l'ERC archivé, quand il existe, concorde." });
    }
  }
  {
    const id = await matchDuJour("2006-06-02");
    for (const champ of ["halfTime", "realisations", "refereeId"]) {
      lignes.push({ entite: "Match", entiteId: id, champ, degre: "CONCORDANT", source: "Wikipédia, « Championnat de France de rugby à XV 2005-2006 »", sourceUrl: WIKI("Championnat de France de rugby à XV 2005-2006"),
        note: "La LNR ne publie ni fait, ni composition, ni officiel sur cette demi-finale ; trois pénalités de chaque côté et un drop biarrot, mi-temps 6-3." });
    }
  }

  // --- Les scores corrigés contre la LNR, et ceux qu'elle ne publie pas -----
  lignes.push(
    { entite: "Match", entiteId: await matchDuJour("2006-08-30"), champ: "score", degre: "CONCORDANT", source: "Démonstration arithmétique sur le classement officiel, contre le 40-6 de la LNR",
      note: "Avec les scores de la LNR, les points marqués de la saison font 488 pour 493 au classement, et J3 est la seule rencontre où les sources divergent, de cinq points. Cf. SCORES_CORRIGES de seed-season-2006-2007.ts." },
    { entite: "Match", entiteId: await matchDuJour("2004-12-23"), champ: "score", degre: "CONCORDANT", source: "Wikipédia et la démonstration arithmétique, contre le 29-23 de la LNR", sourceUrl: WIKI("Championnat de France de rugby à XV 2004-2005"),
      note: "33-23 : les points encaissés de la saison font 579 pour 583 avec la LNR, et le compte des bonus défensifs le confirme — quatre avec son score, trois avec celui-ci, comme au classement." },
  );
  for (const jour of ["2005-08-26", "2005-09-23", "2006-01-28", "2006-02-18", "2006-03-03"]) {
    lignes.push({ entite: "Match", entiteId: await matchDuJour(jour), champ: "score", degre: "CONCORDANT", source: "Wikipédia, tableau croisé de la saison 2005-2006", sourceUrl: WIKI("Championnat de France de rugby à XV 2005-2006"),
      note: "Journée amputée sur le site de la LNR. Les cinq scores manquants doivent valoir 87 marqués, 94 encaissés, 2 victoires et 3 défaites pour retomber sur le classement, et ceux de Wikipédia les donnent exactement." });
  }
  lignes.push(
    { entite: "Match", entiteId: await matchDuJour("2009-11-05"), champ: "realisations", degre: "CONCORDANT", source: "ESPN, pour un essai de pénalité à la 26e que la feuille LNR omet",
      note: "Le garde-fou de la saison l'atteste : le total officiel exige douze bonus, et le compte n'y arrive qu'avec cet essai. Cf. REALISATIONS_COMPLETEES." },
    { entite: "Match", entiteId: await matchDuJour("2006-09-23"), champ: "bonusOffensif", degre: "CONCORDANT", source: "allrugby.com, qui marque le bonus match par match",
      note: "Le cinquième bonus offensif de 2006-2007, que trois feuilles muettes pouvaient porter ; la lecture des vingt-six journées d'allrugby redonne sans écart les quatre déjà établis." },
  );

  // --- Les saisons dont le garde-fou n'est pas la LNR -----------------------
  for (const [label, note] of [
    ["2005-2006", "La LNR publie bien un classement, mais cinq journées manquent à son site : le classement de Wikipédia a servi de garde-fou, et retombe."],
    ["2007-2008", "Le garde-fou sépare bonus offensifs et défensifs d'après Wikipédia."],
    ["2008-2009", "La LNR ne publie aucun classement pour cette saison : Wikipédia, dont la table s'était révélée exacte au point près sur 2009-2010."],
  ] as const) {
    lignes.push({ entite: "Season", entiteId: await saison(label), champ: "agregats", degre: "CONCORDANT", source: `Wikipédia, « Championnat de France de rugby à XV ${label} »`, sourceUrl: WIKI(`Championnat de France de rugby à XV ${label}`), note });
  }

  // --- Les écussons venus d'ailleurs ----------------------------------------
  const ecussons: [string, Attestation["degre"], string, string][] = [
    ["Albi", "OFFICIEL", "Site officiel du club, sca-albi.fr", "La LNR n'a plus que le bouclier gris pour ce club."],
    ["Bourgoin", "OFFICIEL", "Site officiel du club, csbj-rugby.fr", "Le dauphin seul, sans le nom : l'écusson complet de la FFR a un fond blanc incrusté. Arbitré le 31 août 2026."],
    ["Tarbes", "OFFICIEL", "Site officiel du club, stado-tpr.fr", "Sans transparence : le blanc fait partie du dessin, l'ours étant blanc."],
    ["Auch", "PROBABLE", "Wikipédia, « FC Auch Gers », marque déposée", "Le club a été liquidé en 2017 ; celui d'aujourd'hui est un autre club. 80 par 80 pixels, JPEG sans transparence. Arbitré par Jérémy le 1er septembre 2026."],
    ["Rovigo", "OFFICIEL", "Site officiel du club, rugbyrovigodelta.it", "SVG rendu en PNG ; l'écusson porte 1935 et 2010, c'est la même marque qu'en 2012-2013."],
    ["Gernika", "PROBABLE", "Wikipédia, « Gernika RT », marque déposée", "Le site du club n'affiche plus qu'un logo générique de 2024 ; c'est l'écusson porté en 2013."],
    ["Cavalieri Prato", "PROBABLE", "Wikipédia, « Cavalieri Prato », marque déposée", "Club fusionné en 2015 dans une autre entité ; écusson du club d'alors, détouré par remplissage du blanc extérieur."],
  ];
  for (const [c, degre, source, note] of ecussons) {
    lignes.push({ entite: "Opponent", entiteId: await club(c), champ: "logoUrl", degre, source, note });
  }

  // --- Les campagnes européennes d'avant 2020-2021 --------------------------
  const ERC = new Set([
    "2007-11-17", "2007-12-09", "2007-12-15", "2008-01-12", "2008-01-19", "2008-04-05",
    "2010-10-17", "2010-12-11", "2010-12-19", "2011-01-15", "2011-01-23", "2011-04-09",
    "2011-11-11", "2012-01-21",
    "2012-10-13", "2012-10-20", "2012-12-15", "2013-01-12", "2013-01-17",
  ]);
  const coupes = await prisma.match.findMany({
    where: {
      season: { label: { in: ["2007-2008", "2008-2009", "2009-2010", "2010-2011", "2011-2012", "2012-2013", "2013-2014", "2018-2019"] } },
      competition: { shortName: { in: ["H-Cup", "Challenge Européen"] } },
    },
    select: { id: true, date: true, season: { select: { label: true } } },
  });
  for (const m of coupes) {
    const jour = m.date.toISOString().slice(0, 10);
    if (ERC.has(jour)) {
      lignes.push({ entite: "Match", entiteId: m.id, champ: "", degre: "OFFICIEL",
        source: jour < "2009" ? "ERC, compte rendu officiel, par la Wayback Machine" : "ERC, Match Centre officiel, par la Wayback Machine",
        note: "L'organisateur, dont le site n'existe plus qu'en archive ; score contrôlé par le classement de poule de Wikipédia. Minutes de jeu non publiées. Cf. lib/erc.ts." });
    } else {
      lignes.push({ entite: "Match", entiteId: m.id, champ: "", degre: "CONCORDANT",
        source: "ESPN, validé par le classement de poule de Wikipédia",
        note: "Source non officielle, admise faute de mieux : les réalisations d'un camp ne sont écrites que si leur somme retombe sur son score ; ni minutes, ni arbitre, ni affluence. Cf. seed-cup-espn.ts." });
    }
  }

  // --- Écriture -------------------------------------------------------------
  const parDegre = new Map<string, number>();
  for (const a of lignes) parDegre.set(a.degre, (parDegre.get(a.degre) ?? 0) + 1);
  for (const a of lignes) await attester(prisma, a, DRY);
  console.log(`\n=== ${lignes.length} attestation(s) ${DRY ? "à poser" : "posées"} — ${[...parDegre].map(([d, n]) => `${d} ${n}`).join(", ")} ===`);
  if (DRY) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
