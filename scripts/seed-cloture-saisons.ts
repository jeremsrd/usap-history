/**
 * Clôture éditoriale des saisons reprises : entraîneur, président, bilan.
 *
 * C'est ce qui manquait aux dix-huit saisons entrées en base depuis 2004-2005,
 * et que ni la feuille de match ni le classement ne donnent.
 *
 * **C'est la clôture éditoriale, et elle ne se déduit d'aucune feuille de
 * match.** Ni la LNR ni l'EPCR ne publient le staff d'un club : ce script est
 * le premier du projet dont la source entière soit **Wikipédia**, avec la
 * réserve habituelle — ce n'est pas une source officielle. Elle a l'avantage
 * de donner ses propres références, article de presse ou communiqué du club,
 * pour chaque changement en cours de saison.
 *
 * CE QU'IL ÉCRIT, ET OÙ. Le modèle porte deux choses distinctes :
 *
 *   - `Season.coachId` et `Season.presidentId`, un seul de chaque, hérités
 *     d'un temps où l'on ne notait que l'entraîneur principal ;
 *   - `SeasonCoach`, qui accepte plusieurs hommes par saison, avec un rôle,
 *     des dates et un ordre d'affichage.
 *
 * La page de saison affiche `seasonCoaches` dès qu'il y en a, et retombe sinon
 * sur `Season.coach`. Les deux sont donc écrits : le détail pour l'affichage,
 * le champ simple pour tout ce qui l'interroge encore.
 *
 * **LES DATES NE SONT PAS TOUJOURS CONNUES AU JOUR PRÈS, ET LE MODÈLE EXIGE UN
 * JOUR.** Wikipédia donne « 8/12/2015 » et « 28/09/2016 » pour certains
 * changements, « mai 2006 » ou « novembre 2011 » pour d'autres. Là où seul le
 * mois est connu, la date est posée au **premier du mois** et la ligne porte
 * une note qui le dit. L'affichage n'en montre de toute façon que le mois —
 * `toLocaleDateString(..., { month: "short" })` —, si bien que la précision
 * affichée est exactement celle de la source ; c'est la valeur stockée qui
 * mentirait sans la note.
 *
 * **UN SEUL PRÉSIDENT PAR SAISON, LÀ OÙ IL Y EN A EU DEUX.** Le modèle n'en
 * porte qu'un. Sur 2012-2013, Paul Goze démissionne le 23 novembre 2012 après
 * son élection à la présidence de la LNR, et Daniel Besson lui succède : c'est
 * Besson qui est retenu, ayant tenu le poste sur la plus grande partie de la
 * saison. Sur 2015-2016, Luc Lacoste assure l'intérim à partir du 12 janvier
 * 2016, le temps de la convalescence de François Rivière : c'est Rivière qui
 * est retenu, l'intérim n'étant pas une succession. Les deux nuances sont
 * dites dans le bilan de la saison.
 *
 * Idempotent : les lignes `SeasonCoach` d'une saison traitée sont effacées
 * avant d'être réécrites.
 *
 * LE BILAN, LUI, SE TIENT À CE QUE LA BASE ÉTABLIT. Chaque phrase chiffrée —
 * classement, bilan de victoires, points marqués et encaissés, scores des
 * phases finales, plus large succès — se relit dans les rencontres déjà
 * écrites et contrôlées. Ce qui vient de Wikipédia, ce sont les faits que la
 * feuille de match ne porte pas : un entraîneur démis en cours de saison, une
 * présidence qui change de mains, le nom du champion.
 *
 * Il n'écrase pas un bilan existant : les saisons déjà closes à la main
 * gardent le leur, et la table ci-dessous ne porte que celles qui n'en
 * avaient pas.
 *
 * Source : Wikipédia, « Union sportive Arlequins perpignanais », sections
 * « Présidents », « Entraîneurs » et « Historique ».
 *
 * Usage : npx tsx scripts/seed-cloture-saisons.ts [--dry] [--saison=AAAA-AAAA]
 */
import { PrismaClient, CoachRole } from "@prisma/client";
import { generateCoachSlug, generatePresidentSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const SAISON_DEMANDEE = process.argv
  .find((a) => a.startsWith("--saison="))
  ?.slice("--saison=".length);

interface Poste {
  nom: string;
  role: CoachRole;
  /** Prise de fonction en cours de saison. */
  du?: string;
  /** Fin de fonction en cours de saison. */
  au?: string;
  /** Ce que la source dit exactement, quand la date est approchée. */
  note?: string;
}

interface Staff {
  entraineurs: Poste[];
  president: string;
}

const P = CoachRole.ENTRAINEUR_PRINCIPAL;
const A = CoachRole.ENTRAINEUR_ADJOINT;

/** Mois seul connu : la note accompagne toute date posée au premier du mois. */
const MOIS = (quoi: string) => `Wikipédia ne donne que le mois : ${quoi}.`;

const STAFF: Record<string, Staff> = {
  // Philippe Boher et Philippe Ducousso de 2004 à mai 2006.
  "2004-2005": {
    entraineurs: [
      { nom: "Philippe Boher", role: P },
      { nom: "Philippe Ducousso", role: P },
    ],
    president: "Marcel Dagrenat",
  },
  // Ducousso cède la place à Azéma en mai 2006, Boher restant en poste : la
  // demi-finale du 2 juin est donc dirigée par Boher et Azéma.
  "2005-2006": {
    entraineurs: [
      { nom: "Philippe Boher", role: P },
      { nom: "Philippe Ducousso", role: P, au: "2006-05-01", note: MOIS("mai 2006") },
      { nom: "Franck Azéma", role: P, du: "2006-05-01", note: MOIS("mai 2006") },
    ],
    president: "Marcel Dagrenat",
  },
  "2006-2007": {
    entraineurs: [
      { nom: "Philippe Boher", role: P },
      { nom: "Franck Azéma", role: P },
    ],
    president: "Marcel Dagrenat",
  },
  // Paul Goze prend la présidence le 14 juillet 2007, avant le coup d'envoi.
  "2007-2008": {
    entraineurs: [
      { nom: "Jacques Brunel", role: P },
      { nom: "Bernard Goutta", role: A },
      { nom: "Franck Azéma", role: A },
    ],
    president: "Paul Goze",
  },
  // Déjà close, mais son staff n'était qu'un nom : le détail la rend
  // semblable aux autres à l'affichage.
  "2008-2009": {
    entraineurs: [
      { nom: "Jacques Brunel", role: P },
      { nom: "Bernard Goutta", role: A },
      { nom: "Franck Azéma", role: A },
    ],
    president: "Paul Goze",
  },
  "2009-2010": {
    entraineurs: [
      { nom: "Jacques Brunel", role: P },
      { nom: "Bernard Goutta", role: A },
      { nom: "Franck Azéma", role: A },
    ],
    president: "Paul Goze",
  },
  "2010-2011": {
    entraineurs: [
      { nom: "Jacques Brunel", role: P },
      { nom: "Bernard Goutta", role: A },
      { nom: "Christophe Manas", role: A },
    ],
    president: "Paul Goze",
  },
  // Jacques Delmas est démis en novembre 2011 ; ses deux adjoints prennent la
  // suite (communiqué du club, cité par Wikipédia).
  "2011-2012": {
    entraineurs: [
      { nom: "Jacques Delmas", role: P, au: "2011-11-01", note: MOIS("novembre 2011") },
      {
        nom: "Bernard Goutta",
        role: P,
        du: "2011-11-01",
        note: `${MOIS("novembre 2011")} Adjoint de Jacques Delmas jusque-là.`,
      },
      {
        nom: "Christophe Manas",
        role: P,
        du: "2011-11-01",
        note: `${MOIS("novembre 2011")} Adjoint de Jacques Delmas jusque-là.`,
      },
    ],
    president: "Paul Goze",
  },
  "2012-2013": {
    entraineurs: [
      { nom: "Marc Delpoux", role: P },
      { nom: "Giampiero De Carli", role: A },
      { nom: "Patrick Arlettaz", role: A },
    ],
    president: "Daniel Besson",
  },
  "2013-2014": {
    entraineurs: [
      { nom: "Marc Delpoux", role: P },
      { nom: "Giampiero De Carli", role: A },
      { nom: "Patrick Arlettaz", role: A },
    ],
    president: "François Rivière",
  },
  "2014-2015": {
    entraineurs: [
      { nom: "Alain Hyardet", role: P },
      { nom: "Grégory Patat", role: A },
      { nom: "François Gelez", role: A },
    ],
    president: "François Rivière",
  },
  // Patat s'arrête le 7 décembre 2015, Benetton arrive le 8 — Wikipédia donne
  // les deux jours.
  "2015-2016": {
    entraineurs: [
      { nom: "Grégory Patat", role: P, au: "2015-12-07" },
      { nom: "François Gelez", role: P },
      { nom: "Philippe Benetton", role: P, du: "2015-12-08" },
    ],
    president: "François Rivière",
  },
  // Christian Lanta reste, ses adjoints changent le 28 septembre 2016.
  "2016-2017": {
    entraineurs: [
      { nom: "Christian Lanta", role: P },
      { nom: "Philippe Benetton", role: A, au: "2016-09-28" },
      { nom: "François Gelez", role: A, au: "2016-09-28" },
      { nom: "Perry Freshwater", role: A, du: "2016-09-28" },
      { nom: "Patrick Arlettaz", role: A, du: "2016-09-28" },
    ],
    president: "François Rivière",
  },
  "2017-2018": {
    entraineurs: [
      { nom: "Christian Lanta", role: P },
      { nom: "Perry Freshwater", role: A },
      { nom: "Patrick Arlettaz", role: A },
    ],
    president: "François Rivière",
  },
  "2018-2019": {
    entraineurs: [
      { nom: "Christian Lanta", role: P },
      { nom: "Perry Freshwater", role: A },
      { nom: "Patrick Arlettaz", role: A },
    ],
    president: "François Rivière",
  },
  "2019-2020": {
    entraineurs: [
      { nom: "Patrick Arlettaz", role: P },
      { nom: "Perry Freshwater", role: A },
      { nom: "Gérald Bastide", role: A },
    ],
    president: "François Rivière",
  },
  "2020-2021": {
    entraineurs: [
      { nom: "Patrick Arlettaz", role: P },
      { nom: "Perry Freshwater", role: A },
      { nom: "Gérald Bastide", role: A },
    ],
    president: "François Rivière",
  },
  "2021-2022": {
    entraineurs: [
      { nom: "Patrick Arlettaz", role: P },
      { nom: "Perry Freshwater", role: A },
      { nom: "Gérald Bastide", role: A },
      { nom: "David Marty", role: A },
    ],
    president: "François Rivière",
  },
  // L'entraîneur y était déjà ; le président manquait.
  "2022-2023": {
    entraineurs: [
      { nom: "Patrick Arlettaz", role: P },
      { nom: "David Marty", role: A },
      { nom: "Perry Freshwater", role: A },
      { nom: "Guillaume Vilaceca", role: A },
      { nom: "Gérald Bastide", role: A },
    ],
    president: "François Rivière",
  },
  // « Depuis 2023 » chez Wikipédia : Azéma et les trois mêmes adjoints. Ces
  // deux saisons étaient closes avec le seul nom de l'entraîneur principal.
  // **2025-2026 n'est pas ici** : son détail existe déjà, et il porte le
  // changement d'Azéma à Labit du 2 novembre 2025 que ce script effacerait.
  "2023-2024": {
    entraineurs: [
      { nom: "Franck Azéma", role: P },
      { nom: "David Marty", role: A },
      { nom: "Perry Freshwater", role: A },
      { nom: "Gérald Bastide", role: A },
    ],
    president: "François Rivière",
  },
  "2024-2025": {
    entraineurs: [
      { nom: "Franck Azéma", role: P },
      { nom: "David Marty", role: A },
      { nom: "Perry Freshwater", role: A },
      { nom: "Gérald Bastide", role: A },
    ],
    president: "François Rivière",
  },
};

/**
 * Bilans de saison. Tout chiffre s'y relit dans la base ; le reste vient de
 * l'historique du club (cf. l'en-tête). Une saison qui a déjà un bilan n'est
 * pas touchée.
 */
const BILANS: Record<string, string> = {
  "2004-2005":
    "Dernière saison du Top 16, qui compte alors seize clubs et trente " +
    "journées. Cinquième avec 18 victoires, 1 nul et 11 défaites, 688 points " +
    "marqués pour 583, l'USAP manque la phase finale, réservée aux quatre " +
    "premiers, mais se qualifie pour la Coupe d'Europe. Plus large succès : " +
    "43-10 contre Clermont. C'est aussi la première saison du barème à quatre " +
    "points la victoire, avec bonus offensif et défensif.",
  "2005-2006":
    "Première saison du Top 14, le championnat passant de seize clubs à " +
    "quatorze. Quatrième avec 84 points — 18 victoires, 8 défaites, 671 " +
    "points marqués pour 398 —, l'USAP atteint la demi-finale et s'incline " +
    "12-9 devant Biarritz, futur champion, au stade de la Mosson de " +
    "Montpellier, sur une rencontre sans le moindre essai. Plus large " +
    "succès : 52-0 contre Toulon. Philippe Ducousso cède sa place à Franck " +
    "Azéma aux côtés de Philippe Boher en mai.",
  "2006-2007":
    "Cinquième avec 75 points, à une place de la phase finale. Seize " +
    "victoires, un nul, neuf défaites, et 398 points encaissés seulement — " +
    "le même total que la saison précédente. Plus large succès : 45-6 contre " +
    "Narbonne dès la troisième journée.",
  "2007-2008":
    "Quatrième de la phase régulière avec 79 points, dix-sept victoires et " +
    "deux nuls. L'USAP retrouve la demi-finale et tombe 21-7 devant Clermont, " +
    "au stade Vélodrome de Marseille. La saison laisse le souvenir d'un 50-6 " +
    "infligé à Toulouse à Aimé-Giral.",
  "2009-2010":
    "Première de la phase régulière avec 80 points, à égalité avec Toulon " +
    "mais devant lui à la différence de points, +170 contre +85. L'USAP " +
    "écarte Toulouse 21-13 en demi-finale au stade de la Mosson, puis " +
    "s'incline 19-6 devant Clermont en finale, au Stade de France.",
  "2010-2011":
    "Neuvième avec 63 points, hors de la phase finale. La saison la plus " +
    "équilibrée de la période — 538 points marqués pour 543 encaissés — et " +
    "trois matchs nuls. Plus large succès : 34-16 contre La Rochelle.",
  "2011-2012":
    "Onzième avec 49 points : neuf victoires, deux nuls, quinze défaites. " +
    "Jacques Delmas est démis de ses fonctions en novembre ; ses deux " +
    "adjoints, Bernard Goutta et Christophe Manas, terminent la saison. Le " +
    "0-38 concédé à Toulon en octobre est la seule rencontre de la saison où " +
    "l'USAP ne marque pas un point.",
  "2012-2013":
    "Septième avec 61 points, treize victoires pour treize défaites. Paul " +
    "Goze quitte la présidence en novembre, après son élection à la tête de " +
    "la Ligue nationale de rugby ; Daniel Besson lui succède. Plus large " +
    "succès : 39-13 contre Agen.",
  "2013-2014":
    "Treizième avec 51 points — dix victoires, un nul, quinze défaites —, " +
    "l'USAP est reléguée en Pro D2 et quitte l'élite pour la première fois. " +
    "Marc Delpoux dirige l'équipe pour la deuxième et dernière saison.",
  "2014-2015":
    "Première saison au second échelon. Troisième avec 82 points, l'USAP " +
    "atteint la demi-finale et y est éliminée par Agen après un 32-32. Plus " +
    "large succès : 42-0 contre Bourgoin.",
  "2015-2016":
    "Septième avec 73 points, hors des places qualificatives. Grégory Patat " +
    "est écarté le 7 décembre, Philippe Benetton le remplace dès le " +
    "lendemain aux côtés de François Gelez. En janvier, François Rivière, " +
    "victime d'un accident, laisse la présidence à Luc Lacoste le temps de sa " +
    "convalescence.",
  "2016-2017":
    "Sixième avec 79 points, à une place des quatre qualifiés. Les adjoints " +
    "de Christian Lanta changent dès le 28 septembre : Perry Freshwater et " +
    "Patrick Arlettaz remplacent Philippe Benetton et François Gelez. Plus " +
    "large succès : 66-13 contre Narbonne.",
  "2017-2018":
    "Champion de France de Pro D2 et retour immédiat en Top 14. Premier de " +
    "la phase régulière avec 97 points, l'USAP bat Mont-de-Marsan 28-8 en " +
    "demi-finale, puis Grenoble 38-13 en finale, au stade Ernest-Wallon de " +
    "Toulouse. Plus large succès de la saison : 73-7 contre Carcassonne.",
  "2018-2019":
    "Dernière du Top 14 avec 12 points, l'USAP redescend directement, sans " +
    "access match. Deux victoires en vingt-six journées, 433 points marqués " +
    "pour 821 encaissés : un 28-10 à Montpellier le 16 février, un 22-16 " +
    "contre Grenoble le 23 mars.",
  "2019-2020":
    "Saison interrompue à la vingt-troisième journée par la pandémie de " +
    "Covid-19. Deuxième avec 76 points au moment de l'arrêt, l'USAP ne " +
    "dispute aucune phase finale : la Ligue n'en organise pas et ne promeut " +
    "que le premier. Plus large succès : 57-12 contre Rouen.",
  "2020-2021":
    "Champion de France de Pro D2 et retour en Top 14. Vingt-quatre " +
    "victoires, un nul, cinq défaites et 107 points en phase régulière, puis " +
    "Oyonnax écarté 27-15 en demi-finale et Biarritz battu 33-14 en finale, " +
    "au GGL Stadium de Montpellier. Plus large succès : 49-0 contre " +
    "Angoulême.",
  "2021-2022":
    "Treizième du Top 14 avec 43 points, l'USAP se maintient à l'access " +
    "match en battant Mont-de-Marsan 41-16. La saison marque le retour en " +
    "Challenge européen, refermé dès le huitième de finale par Benetton " +
    "(7-17), après un 19-68 concédé à Gloucester.",
};

function separer(nom: string): { firstName: string; lastName: string } {
  // Les noms de la table sont écrits « Prénom Nom », le nom de famille pouvant
  // être composé — « De Carli ». Le prénom est le premier mot, et lui seul.
  const [prenom, ...reste] = nom.split(" ");
  return { firstName: prenom, lastName: reste.join(" ") };
}

async function trouverOuCreerEntraineur(nom: string): Promise<string> {
  const { firstName, lastName } = separer(nom);
  const existant = await prisma.coach.findFirst({ where: { firstName, lastName } });
  if (existant) return existant.id;
  if (DRY_RUN) {
    console.log(`  [entraîneur] à créer : ${nom}`);
    return "";
  }
  const cree = await prisma.coach.create({
    data: { firstName, lastName, slug: `temp-${Date.now()}-${Math.random()}` },
  });
  await prisma.coach.update({
    where: { id: cree.id },
    data: { slug: generateCoachSlug(firstName, lastName, cree.id) },
  });
  console.log(`  [entraîneur] créé : ${nom}`);
  return cree.id;
}

async function trouverOuCreerPresident(nom: string): Promise<string> {
  const { firstName, lastName } = separer(nom);
  const existant = await prisma.president.findFirst({ where: { firstName, lastName } });
  if (existant) return existant.id;
  if (DRY_RUN) {
    console.log(`  [président] à créer : ${nom}`);
    return "";
  }
  const cree = await prisma.president.create({
    data: { firstName, lastName, slug: `temp-${Date.now()}-${Math.random()}` },
  });
  await prisma.president.update({
    where: { id: cree.id },
    data: { slug: generatePresidentSlug(firstName, lastName, cree.id) },
  });
  console.log(`  [président] créé : ${nom}`);
  return cree.id;
}

async function main() {
  console.log(`=== Staff des saisons reprises${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const labels = Object.keys(STAFF)
    .filter((l) => !SAISON_DEMANDEE || l === SAISON_DEMANDEE)
    .sort();
  let traitees = 0;
  const echecs: string[] = [];

  for (const label of labels) {
    const staff = STAFF[label];
    const saison = await prisma.season.findFirst({ where: { label } });
    if (!saison) {
      echecs.push(`${label} : saison absente de la base`);
      continue;
    }

    const presidentId = await trouverOuCreerPresident(staff.president);
    const lignes: Array<{ coachId: string; poste: Poste; ordre: number }> = [];
    for (const [ordre, poste] of staff.entraineurs.entries()) {
      lignes.push({ coachId: await trouverOuCreerEntraineur(poste.nom), poste, ordre });
    }

    const principal = lignes.find((l) => l.poste.role === P);
    if (!principal) {
      echecs.push(`${label} : aucun entraîneur principal`);
      continue;
    }

    // Le bilan n'écrase jamais celui d'une saison déjà close à la main.
    const bilan = BILANS[label];
    const bilanAEcrire = bilan && !saison.notes ? bilan : null;

    const rendu = staff.entraineurs
      .map((e) => {
        const p = [e.du ? `du ${e.du}` : null, e.au ? `au ${e.au}` : null]
          .filter(Boolean)
          .join(" ");
        return `${e.nom}${e.role === A ? " (adj.)" : ""}${p ? ` [${p}]` : ""}`;
      })
      .join(", ");
    console.log(`${label} | ${staff.president} | ${rendu}`);
    if (bilanAEcrire) console.log(`  bilan : ${bilanAEcrire.slice(0, 96)}…`);
    else if (bilan) console.log("  bilan : déjà écrit, laissé tel quel");

    if (DRY_RUN) {
      traitees++;
      continue;
    }

    await prisma.seasonCoach.deleteMany({ where: { seasonId: saison.id } });
    for (const { coachId, poste, ordre } of lignes) {
      await prisma.seasonCoach.create({
        data: {
          seasonId: saison.id,
          coachId,
          role: poste.role,
          startDate: poste.du ? new Date(`${poste.du}T00:00:00Z`) : null,
          endDate: poste.au ? new Date(`${poste.au}T00:00:00Z`) : null,
          displayOrder: ordre,
          notes: poste.note ?? null,
        },
      });
    }
    await prisma.season.update({
      where: { id: saison.id },
      data: {
        coachId: principal.coachId,
        presidentId,
        ...(bilanAEcrire ? { notes: bilanAEcrire } : {}),
      },
    });
    traitees++;
  }

  console.log(`\n=== ${traitees} saison(s) traitée(s), ${echecs.length} en échec ===`);
  for (const e of echecs) console.log(`  ⚠ ${e}`);
}

main().finally(() => prisma.$disconnect());
