/**
 * Dates et lieux de naissance de l'effectif 1999-2000, d'après la page
 * « Perpignan » d'un guide de la saison (photo transmise par Jérémy le
 * 20 oct. 2026, lue à la main).
 *
 * **Seuls les champs vides sont écrits.** Une date déjà en base qui diffère
 * de celle du guide est signalée, jamais remplacée : c'est à trancher.
 *
 * **L'identité se prouve par le maillot.** Une fiche n'est retenue que si son
 * nom complet, une fois normalisé, est celui du guide, et si elle porte au
 * moins une ligne USAP — feuille de match ou effectif de saison. Le reste
 * est listé, pas écrit.
 *
 * **Exception, tranchée par Jérémy le 21 oct. 2026** : les joueurs de
 * `SUR_LE_NOM` n'ont en base qu'une fiche d'adversaire, faute de composition
 * USAP avant 2004-05. Leur nom est assez rare pour les retenir sur le nom
 * complet seul, à condition qu'une seule fiche le porte.
 *
 * Les Pradal sont frères, nés tous deux un 27 août ; Basset et Arenas, nés un
 * 16 juillet, sont deux joueurs distincts : vérifié par Jérémy, pas une coquille.
 *
 * Usage : npx tsx scripts/set-naissances-effectif-1999-2000.ts [--dry]
 */
import { PrismaClient } from "@prisma/client";
import { attester } from "./lib/attestations";
import { normalize } from "./lib/noms";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

const SOURCE = "Midi Olympique, guide de la saison 1999-2000, page Perpignan (photo transmise par Jérémy)";
const ANCIENNE_SOURCE = "Guide de la saison 1999-2000, page Perpignan (photo transmise par Jérémy)";

/** Retenus sur le nom complet seul (cf. en-tête). */
const SUR_LE_NOM = new Set(
  ["Grégory Tutard", "Julien Tilloles", "Thomas Lievremont", "Patrick Furet", "Stéphane De Besombes", "Raphaël Ibanez", "Frédéric Benazech"]
    .map(normalize),
);

/** Nom, prénom, date JJ.MM.AA, lieu tel qu'on l'écrit en base (null : le guide ne donne qu'un pays). */
const EFFECTIF: [string, string, string, string | null][] = [
  ["Benazech", "Frédéric", "13.11.72", "Bédarieux"],
  ["Cermeno", "Frédéric", "20.06.79", "Perpignan"],
  ["Lafue", "Philippe", "30.09.79", "Perpignan"],
  ["Joubert", "Alewyn", "08.07.67", null],
  ["Martin", "Nicolas", "20.08.71", "Foix"],
  ["Sid", "Farid", "27.03.79", "Perpignan"],
  ["Tutard", "Grégory", "02.01.75", "Villeneuve-sur-Lot"],
  ["Criscuolo", "Luis", "10.09.70", "Buenos Aires"],
  ["Plana", "Didier", "21.08.72", "Perpignan"],
  ["Sabardeil", "Vincent", "13.07.79", "Perpignan"],
  ["Whitford", "Tom", "15.09.71", "Birmingham"],
  ["Bellot", "Benoît", "13.03.71", "Albi"],
  ["Camberabero", "Didier", "09.01.61", "Valence"],
  ["Basset", "Jacques", "16.07.70", "Perpignan"],
  ["Tilloles", "Julien", "29.10.77", "Bordeaux"],
  ["Lièvremont", "Thomas", "06.11.73", "Perpignan"],
  ["Pradal", "Maxime", "27.08.77", "Perpignan"],
  ["Arenas", "Freddy", "16.07.76", "Perpignan"],
  ["Deroeux", "Sylvain", "31.03.72", "Paris"],
  ["Furet", "Patrick", "10.07.73", "Porto-Vecchio"],
  ["Goutta", "Bernard", "28.09.72", "Perpignan"],
  ["Fourny", "Alain", "20.11.66", "Saint-Germain-en-Laye"],
  ["James", "Michaël", "21.07.73", "Vancouver"],
  ["Els", "Braam", "01.11.71", "Kroonstad"],
  ["Olibeau", "Olivier", "13.04.77", "Perpignan"],
  ["Pradal", "Jérôme", "27.08.70", "Revel"],
  ["Peillard", "Renaud", "18.11.72", "Perpignan"],
  ["De Besombes", "Stéphane", "02.01.72", "Perpignan"],
  ["Meya", "Pascal", "03.06.73", "Perpignan"],
  ["Nikolaenko", "Soso", "18.05.75", null],
  ["Ibanez", "Raphaël", "17.02.73", "Dax"],
  ["Konieckiewicz", "Michel", "14.10.72", "Avignon"],
];

function dateDe(jjmmaa: string): Date {
  const [j, m, a] = jjmmaa.split(".");
  return new Date(`19${a}-${m}-${j}T00:00:00Z`);
}

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

async function main() {
  const noms = new Set(EFFECTIF.map(([nom]) => normalize(nom)));
  const fiches = (
    await prisma.player.findMany({
      select: {
        id: true, firstName: true, lastName: true, birthDate: true, birthPlace: true,
        _count: { select: { seasonSquads: true } },
        matchAppearances: { select: { isOpponent: true } },
      },
    })
  ).filter((f) => noms.has(normalize(f.lastName)));

  let ecrits = 0;
  for (const [nom, prenom, jjmmaa, lieu] of EFFECTIF) {
    const naissance = dateDe(jjmmaa);
    const memeNom = fiches.filter((f) => normalize(f.lastName) === normalize(nom));
    const homonymes = memeNom.filter((f) => normalize(f.firstName) === normalize(prenom));
    let siennes = homonymes.filter(
      (f) => f._count.seasonSquads > 0 || f.matchAppearances.some((l) => !l.isOpponent),
    );
    const surLeNom = !siennes.length && homonymes.length === 1 && SUR_LE_NOM.has(normalize(`${prenom} ${nom}`));
    if (surLeNom) siennes = homonymes;
    const etiquette = `${prenom} ${nom} (${iso(naissance)}${lieu ? `, ${lieu}` : ""})`;

    if (siennes.length !== 1) {
      const autres = memeNom
        .map((f) => {
          const usap = f.matchAppearances.filter((l) => !l.isOpponent).length;
          return `${f.firstName} ${f.lastName} [usap ${usap}, adv ${f.matchAppearances.length - usap}, effectifs ${f._count.seasonSquads}, né ${iso(f.birthDate)}]`;
        })
        .join(" ; ");
      console.log(`✗ ${etiquette} — ${siennes.length} fiche(s) USAP${autres ? ` · même nom : ${autres}` : ""}`);
      continue;
    }

    const f = siennes[0];
    const data: { birthDate?: Date; birthPlace?: string } = {};
    const remarques: string[] = [];
    if (!f.birthDate) data.birthDate = naissance;
    else if (iso(f.birthDate) !== iso(naissance)) remarques.push(`DATE EN BASE ${iso(f.birthDate)} ≠ guide`);
    if (lieu && !f.birthPlace) data.birthPlace = lieu;
    else if (lieu && normalize(f.birthPlace!) !== normalize(lieu)) remarques.push(`lieu en base « ${f.birthPlace} »`);

    const champs = Object.keys(data);
    console.log(
      `${champs.length ? "✓" : "="} ${etiquette}${surLeNom ? " [sur le nom]" : ""} — ${champs.length ? `écrit ${champs.join(", ")}` : "rien à écrire"}` +
        `${remarques.length ? ` · ${remarques.join(" · ")}` : ""}`,
    );
    if (!champs.length) continue;
    ecrits++;
    if (!DRY_RUN) await prisma.player.update({ where: { id: f.id }, data });
    for (const champ of champs) {
      await attester(
        prisma,
        {
          entite: "Player", entiteId: f.id, champ, degre: "PROBABLE", source: SOURCE,
          ...(surLeNom && { note: "Identité retenue sur le nom seul, fiche d'adversaire", decidePar: "Jérémy" }),
        },
        DRY_RUN,
      );
    }
  }
  // Les attestations du premier passage (20 oct. 2026) prennent le nom de la publication.
  const renommees = DRY_RUN
    ? await prisma.attestation.count({ where: { source: ANCIENNE_SOURCE } })
    : (await prisma.attestation.updateMany({ where: { source: ANCIENNE_SOURCE }, data: { source: SOURCE } })).count;
  if (renommees) console.log(`${renommees} attestation(s) ${DRY_RUN ? "à renommer" : "renommée(s)"} au nom du Midi Olympique.`);
  console.log(`\n${ecrits} fiche(s) ${DRY_RUN ? "à compléter" : "complétée(s)"} sur ${EFFECTIF.length}.`);
}

main().finally(() => prisma.$disconnect());
