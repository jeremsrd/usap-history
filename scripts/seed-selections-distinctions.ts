/**
 * Sélections internationales et distinctions individuelles.
 *
 * **AUCUN DE CES DEUX FAITS NE SE DÉDUIT DE LA BASE.** Une sélection en équipe
 * nationale et un Oscar du Midi olympique sont extérieurs au club : contrairement
 * aux carrières, que les feuilles de match encadrent, il n'y a rien ici à
 * calculer. Tout vient de **Wikipédia**, et les tables ci-dessous sont donc
 * figées dans le script, ligne à ligne, plutôt que relues à chaque exécution.
 *
 * **LE NOMBRE DE SÉLECTIONS EST CELUI OBTENU SOUS LE MAILLOT DE L'USAP**, et
 * non le total d'une carrière. C'est la source qui le dit — « le nombre de
 * sélections indiqué correspond à celles que le joueur a obtenues alors qu'il
 * évoluait au sein du club » — et c'est le chiffre qui a du sens sur un site
 * d'histoire du club. Nicolas Mas compte ainsi 63 sélections ici, quand sa
 * carrière internationale en totalise davantage. La fiche joueur le précise.
 *
 * **LES DEUX LISTES SONT DATÉES, ET ELLES ONT VIEILLI** : celle des Français
 * est arrêtée au 23 février 2016, celle des étrangers au 8 juin 2017. Les
 * internationaux catalans postérieurs n'y sont pas, et ceux qui l'étaient déjà
 * peuvent avoir gagné des sélections depuis.
 *
 * **QUARANTE-TROIS DES QUATRE-VINGT-DOUZE INTERNATIONAUX N'ONT PAS DE FICHE**,
 * et c'est attendu : la base commence en 2004-2005, et la liste remonte à 1920.
 * Eugène Ribère, Jo Maso, André Sanac n'y sont pas. On ne leur crée pas de
 * fiche — elle ne porterait qu'une ligne de sélections, et la page des joueurs
 * ne la montrerait pas, faute de lien avec le club au sens d'`usapCondition`.
 *
 * **L'APPARIEMENT EST FAIT AU NOM EXACT, ET LA TABLE PORTE LE NOM DE LA BASE.**
 * Aucune règle floue n'est appliquée : `memeJoueur` est taillé pour les
 * vingt-trois d'une feuille, pas pour les 3 900 fiches de la table — il
 * rapprochait « Chris Cusiter » de Christophe Manas et de Christophe Porcu.
 * Trois noms que la base écrit autrement ont été vérifiés un à un et corrigés
 * dans la table : Ramiro Efouardo Pez, Faka Anaua Ki Alisona Taumalolo, et
 * Nathan Hines, dont la source fond deux sélections en une ligne.
 *
 * **LES LIONS BRITANNIQUES N'ENTRENT PAS**, faute de pays. `NationalTeam` exige
 * un `countryId`, et les Lions n'en sont pas un ; les cinq sélections de Nathan
 * Hines en 2009 restent donc hors base. Lui inventer un pays serait pire.
 *
 * LES DISTINCTIONS SONT SEPT, ET C'EST TOUT CE QUE LES SOURCES DONNENT. La Nuit
 * du rugby en fournit six, son article étant classé par année et nommant le
 * club de chaque lauréat. Les Oscars du Midi olympique, eux, ne nomment pas le
 * club : un seul lauréat se rattache à l'USAP, et c'est en croisant l'année
 * avec les apparitions en base qu'on l'établit — Maxime Mermoz, Oscar d'or
 * 2009. Guilhem Guirado, primé en 2015, 2016 et 2017, avait quitté le club.
 *
 * Idempotent : les lignes sont effacées avant d'être réécrites.
 *
 * Sources : Wikipédia, « Union sportive Arlequins perpignanais » (sections
 * « Internationaux français » et « Internationaux étrangers »), « Nuit du
 * rugby », « Oscars du Midi olympique ».
 *
 * Usage : npx tsx scripts/seed-selections-distinctions.ts [--dry]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

/** Pays à créer s'ils manquent : code ISO 3166-1 alpha-2 et nom français. */
const PAYS_MANQUANTS: Array<{ code: string; name: string }> = [
  { code: "US", name: "États-Unis" },
  { code: "CA", name: "Canada" },
  { code: "AR", name: "Argentine" },
  { code: "RO", name: "Roumanie" },
  { code: "TO", name: "Tonga" },
  { code: "WS", name: "Samoa" },
  { code: "BE", name: "Belgique" },
  { code: "DE", name: "Allemagne" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espagne" },
];

/** Nom de sélection → nom du pays en base. */
const PAYS_DE_LA_SELECTION: Record<string, string> = {
  France: "France",
  Angleterre: "Angleterre",
  Écosse: "Écosse",
  Galles: "Pays de Galles",
  Italie: "Italie",
  "Afrique du Sud": "Afrique du Sud",
  "États-Unis": "États-Unis",
  Canada: "Canada",
  Argentine: "Argentine",
  Roumanie: "Roumanie",
  Tonga: "Tonga",
  Samoa: "Samoa",
  Belgique: "Belgique",
  Allemagne: "Allemagne",
  Portugal: "Portugal",
  Espagne: "Espagne",
};

interface Selection {
  /** Nom tel que la base l'écrit — l'appariement est exact. */
  joueur: string;
  equipe: string;
  /** Sélections obtenues sous le maillot de l'USAP, pas sur la carrière. */
  caps: number;
  de: number;
  a: number;
  points: number;
  essais: number | null;
}

const INTERNATIONAUX: Selection[] = [
  { joueur: "Joseph Desclaux", equipe: "France", caps: 10, de: 1934, a: 1945, points: 27, essais: 3 },
  { joueur: "Jean-François Imbernon", equipe: "France", caps: 23, de: 1976, a: 1983, points: 0, essais: null },
  { joueur: "Thomas Lievremont", equipe: "France", caps: 21, de: 1996, a: 2000, points: 10, essais: 2 },
  { joueur: "Stephane De Besombes", equipe: "France", caps: 2, de: 1998, a: 1998, points: 0, essais: null },
  { joueur: "Frederic Cermeno", equipe: "France", caps: 1, de: 2000, a: 2000, points: 0, essais: null },
  { joueur: "Jerome Thion", equipe: "France", caps: 5, de: 2003, a: 2003, points: 0, essais: null },
  { joueur: "Nicolas Mas", equipe: "France", caps: 63, de: 2003, a: 2003, points: 0, essais: null },
  { joueur: "Bernard Goutta", equipe: "France", caps: 1, de: 2004, a: 2004, points: 5, essais: 1 },
  { joueur: "Ludovic Loustau", equipe: "France", caps: 1, de: 2004, a: 2004, points: 0, essais: null },
  { joueur: "Jean-Philippe Grandclaude", equipe: "France", caps: 3, de: 2005, a: 2007, points: 0, essais: null },
  { joueur: "Julien Laharrague", equipe: "France", caps: 6, de: 2005, a: 2006, points: 0, essais: null },
  { joueur: "David Marty", equipe: "France", caps: 37, de: 2005, a: 2011, points: 55, essais: 11 },
  { joueur: "Vincent Debaty", equipe: "France", caps: 1, de: 2006, a: 2006, points: 0, essais: null },
  { joueur: "Nicolas Durand", equipe: "France", caps: 2, de: 2007, a: 2007, points: 0, essais: null },
  { joueur: "Grégory Le Corvec", equipe: "France", caps: 1, de: 2007, a: 2007, points: 0, essais: null },
  { joueur: "Olivier Olibeau", equipe: "France", caps: 2, de: 2007, a: 2007, points: 0, essais: null },
  { joueur: "Damien Chouly", equipe: "France", caps: 4, de: 2007, a: 2007, points: 0, essais: null },
  { joueur: "Nicolas Laharrague", equipe: "France", caps: 2, de: 2007, a: 2007, points: 0, essais: null },
  { joueur: "Guilhem Guirado", equipe: "France", caps: 23, de: 2008, a: 2011, points: 0, essais: null },
  { joueur: "Maxime Mermoz", equipe: "France", caps: 19, de: 2009, a: 2012, points: 10, essais: 2 },
  { joueur: "Jérôme Porical", equipe: "France", caps: 4, de: 2010, a: 2010, points: 3, essais: null },
  { joueur: "Jerome Schuster", equipe: "France", caps: 2, de: 2010, a: 2010, points: 0, essais: null },
  { joueur: "Romain Taofifenua", equipe: "France", caps: 3, de: 2012, a: 2012, points: 0, essais: null },
  { joueur: "Sébastien Vahaamahina", equipe: "France", caps: 14, de: 2012, a: 2012, points: 0, essais: null },
  { joueur: "Adrien Plante", equipe: "France", caps: 2, de: 2013, a: 2013, points: 0, essais: null },
  { joueur: "Mike James", equipe: "Canada", caps: 15, de: 1998, a: 1999, points: 10, essais: 2 },
  { joueur: "Rimas Alvarez-Kairelis", equipe: "Argentine", caps: 40, de: 2001, a: 2009, points: 15, essais: 3 },
  { joueur: "Augustin Petrechei", equipe: "Roumanie", caps: 7, de: 2003, a: 2004, points: 5, essais: 1 },
  { joueur: "Dan Luger", equipe: "Angleterre", caps: 4, de: 2003, a: 2003, points: 10, essais: 2 },
  { joueur: "Ovidiu Tonita", equipe: "Roumanie", caps: 24, de: 2005, a: 2011, points: 30, essais: 6 },
  { joueur: "Marius Tincu", equipe: "Roumanie", caps: 26, de: 2005, a: 2011, points: 40, essais: 8 },
  { joueur: "Viliami Vaki", equipe: "Tonga", caps: 14, de: 2005, a: 2008, points: 20, essais: 4 },
  { joueur: "Perry Freshwater", equipe: "Angleterre", caps: 10, de: 2005, a: 2007, points: 0, essais: null },
  { joueur: "Chris Cusiter", equipe: "Écosse", caps: 13, de: 2007, a: 2009, points: 5, essais: 1 },
  { joueur: "Percy Montgomery", equipe: "Afrique du Sud", caps: 13, de: 2007, a: 2008, points: 166, essais: 4 },
  { joueur: "Henry Tuilagi", equipe: "Samoa", caps: 6, de: 2007, a: 2009, points: 5, essais: 1 },
  { joueur: "Federico Martín Aramburu", equipe: "Argentine", caps: 4, de: 2007, a: 2008, points: 10, essais: 2 },
  { joueur: "Kisi Pulu", equipe: "Tonga", caps: 11, de: 2007, a: 2012, points: 5, essais: 1 },
  { joueur: "James Hook", equipe: "Galles", caps: 15, de: 2011, a: 2012, points: 69, essais: 2 },
  { joueur: "Tommaso Allan", equipe: "Italie", caps: 25, de: 2012, a: 2012, points: 104, essais: null },
  { joueur: "Sione Piukala", equipe: "Tonga", caps: 3, de: 2012, a: 2012, points: 5, essais: 1 },
  { joueur: "Alasdair Strokosch", equipe: "Écosse", caps: 19, de: 2012, a: 2015, points: 5, essais: 1 },
  { joueur: "Daniel Leo", equipe: "Samoa", caps: 2, de: 2012, a: 2012, points: 0, essais: null },
  { joueur: "Luke Charteris", equipe: "Galles", caps: 3, de: 2012, a: 2012, points: 0, essais: null },
  { joueur: "Jens Torfs", equipe: "Belgique", caps: 6, de: 2014, a: 2014, points: 0, essais: null },
  { joueur: "Tevita Mailau", equipe: "Tonga", caps: 11, de: 2015, a: 2015, points: 0, essais: null },
  { joueur: "Maxime Oltmann", equipe: "Allemagne", caps: 1, de: 2016, a: 2016, points: 0, essais: null },
  { joueur: "Mathieu Belie", equipe: "Espagne", caps: 5, de: 2016, a: 2016, points: 5, essais: 1 },
  // Trois noms que la base écrit autrement, vérifiés à la main.
  { joueur: "Ramiro Efouardo Pez", equipe: "Italie", caps: 10, de: 2005, a: 2006, points: 106, essais: null },
  { joueur: "Faka Anaua Ki Alisona Taumalolo", equipe: "Tonga", caps: 3, de: 2012, a: 2012, points: 5, essais: 1 },
  // La source fond ses deux sélections en une ligne : l'Écosse ici, les Lions
  // britanniques nulle part, faute de pays (cf. l'en-tête).
  { joueur: "Nathan Hines", equipe: "Écosse", caps: 27, de: 2006, a: 2009, points: 0, essais: null },
];

interface Distinction {
  joueur: string;
  name: string;
  category: string | null;
  year: number;
  details: string;
}

const DISTINCTIONS: Distinction[] = [
  {
    joueur: "Manuel Edmonds",
    name: "Nuit du rugby",
    category: "Meilleur joueur du Top 16",
    year: 2004,
    details: "Première Nuit du rugby, saison 2003-2004.",
  },
  {
    joueur: "Maxime Mermoz",
    name: "Oscar du Midi olympique",
    category: "Oscar d'or",
    year: 2009,
    details:
      "Seul lauréat catalan des Oscars sur la période couverte : la source ne " +
      "nomme pas le club, et c'est le croisement avec ses apparitions en base " +
      "qui l'établit.",
  },
  {
    joueur: "Maxime Mermoz",
    name: "Nuit du rugby",
    category: "XV de rêve — n°13",
    year: 2009,
    details: "Sixième Nuit du rugby, saison 2008-2009.",
  },
  {
    joueur: "Nicolas Mas",
    name: "Nuit du rugby",
    category: "XV de rêve — n°3",
    year: 2010,
    details: "Septième Nuit du rugby, saison 2009-2010.",
  },
  {
    joueur: "Lifeimi Mafi",
    name: "Nuit du rugby",
    category: "Meilleur joueur de la Pro D2",
    year: 2018,
    details: "Quinzième Nuit du rugby, saison 2017-2018, celle du titre de Pro D2.",
  },
  {
    joueur: "Melvyn Jaminet",
    name: "Nuit du rugby",
    category: "Meilleure révélation",
    year: 2021,
    details: "Dix-septième Nuit du rugby, saison 2020-2021.",
  },
  {
    joueur: "Melvyn Jaminet",
    name: "Nuit du rugby",
    category: "Meilleur joueur de la Pro D2",
    year: 2021,
    details: "Dix-septième Nuit du rugby, saison 2020-2021, celle du titre de Pro D2.",
  },
];

async function main() {
  console.log(`=== Sélections et distinctions${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const joueurs = await prisma.player.findMany({ select: { id: true, firstName: true, lastName: true } });
  const parNom = new Map<string, string[]>();
  for (const j of joueurs) {
    const cle = `${j.firstName} ${j.lastName}`;
    parNom.set(cle, [...(parNom.get(cle) ?? []), j.id]);
  }
  const fiche = (nom: string, echecs: string[]): string | null => {
    const t = parNom.get(nom);
    if (!t) { echecs.push(`fiche introuvable : ${nom}`); return null; }
    if (t.length > 1) { echecs.push(`${t.length} fiches pour ${nom} — ambigu, rien écrit`); return null; }
    return t[0];
  };

  const echecs: string[] = [];

  if (!DRY_RUN) {
    for (const p of PAYS_MANQUANTS) {
      if (await prisma.country.findFirst({ where: { code: p.code } })) continue;
      await prisma.country.create({ data: p });
      console.log(`  [pays] créé : ${p.name}`);
    }
  }

  const equipes = new Map<string, string>();
  for (const equipe of new Set(INTERNATIONAUX.map((s) => s.equipe))) {
    const nomPays = PAYS_DE_LA_SELECTION[equipe];
    if (!nomPays) { echecs.push(`sélection « ${equipe} » : pays inconnu`); continue; }
    if (DRY_RUN) { equipes.set(equipe, ""); continue; }
    const pays = await prisma.country.findFirst({ where: { name: nomPays } });
    if (!pays) { echecs.push(`pays « ${nomPays} » absent de la base`); continue; }
    const existante = await prisma.nationalTeam.findFirst({ where: { name: equipe } });
    if (existante) { equipes.set(equipe, existante.id); continue; }
    const creee = await prisma.nationalTeam.create({
      data: { name: equipe, countryId: pays.id, shortName: pays.code },
    });
    equipes.set(equipe, creee.id);
    console.log(`  [sélection] créée : ${equipe}`);
  }

  if (!DRY_RUN) {
    await prisma.playerInternational.deleteMany({});
    await prisma.playerAward.deleteMany({});
  }

  let sel = 0;
  for (const s of INTERNATIONAUX) {
    const id = fiche(s.joueur, echecs);
    if (!id) continue;
    console.log(
      `  ${s.joueur.padEnd(32)} ${s.equipe.padEnd(16)} ${String(s.caps).padStart(3)} sél. ` +
        `${s.de}${s.a !== s.de ? `-${s.a}` : ""}`,
    );
    if (DRY_RUN) { sel++; continue; }
    await prisma.playerInternational.create({
      data: {
        playerId: id,
        nationalTeamId: equipes.get(s.equipe)!,
        totalCaps: s.caps,
        // La source ne donne que l'année : la date est posée au 1er janvier,
        // et la fiche n'en affiche que l'année.
        firstCapDate: new Date(`${s.de}-01-01T00:00:00Z`),
        lastCapDate: new Date(`${s.a}-01-01T00:00:00Z`),
        totalPoints: s.points,
        totalTries: s.essais,
      },
    });
    sel++;
  }

  let dist = 0;
  for (const d of DISTINCTIONS) {
    const id = fiche(d.joueur, echecs);
    if (!id) continue;
    console.log(`  ${d.year} ${d.joueur.padEnd(22)} ${d.name} — ${d.category}`);
    if (DRY_RUN) { dist++; continue; }
    await prisma.playerAward.create({
      data: {
        playerId: id,
        name: d.name,
        category: d.category,
        year: d.year,
        details: d.details,
      },
    });
    dist++;
  }

  console.log(`\n=== ${sel} sélection(s), ${dist} distinction(s), ${echecs.length} en échec ===`);
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main().finally(() => prisma.$disconnect());
