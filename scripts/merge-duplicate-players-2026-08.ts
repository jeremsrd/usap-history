/**
 * Les vingt-cinq fusions du 30 août 2026, avec leur démonstration.
 *
 * **Pourquoi ce fichier existe.** Ces fusions ont été passées une à une par
 * `merge-players.ts`, en ligne de commande. Rien n'en serait resté dans le
 * dépôt : ni les paires, ni les identifiants, ni la preuve. Or supprimer une
 * fiche est irréversible, et l'affirmation « ces deux-là sont le même homme »
 * doit pouvoir se relire. C'est ce que fait ce script, sur le modèle de
 * `merge-duplicate-players-2026.ts` : il porte le lot en dur, chaque ligne
 * accompagnée du nom que la source officielle écrit.
 *
 * **D'où venaient ces paires.** De `detect-duplicate-players.ts`, dont c'était
 * le premier passage : 4 en CERTAIN, 21 en FORT et 17 en À VOIR, sur 2 186
 * fiches. Aucune n'avait été trouvée par les contrôles existants — un doublon
 * porte le nom de la feuille officielle, et `audit-opponent-lineups.ts` le lit
 * conforme. Le lot À VOIR n'a rendu qu'un seul doublon, Stooke, en queue de
 * liste ; ses seize autres paires étaient bien deux hommes, et sont passées
 * dans la table `DISTINCTS` du détecteur.
 *
 * **Le test qui a tranché**, et il est mécanique : lire la feuille officielle
 * de chaque match de la fiche la moins fournie, et compter combien d'hommes y
 * portent ce patronyme. Un seul à chaque fois, sur les vingt-trois paires dont
 * une feuille était lisible. La fiche la mieux fournie est conservée, et porte
 * le nom d'usage — jamais l'orthographe de la LNR, qui ampute les accents.
 *
 * **Six étaient des joueurs de l'USAP**, ce qui change l'effectif historique :
 * Duguivalu, Halanukonuka, Crossdale, Sawailau, Fia, Shields. 192 hommes ont
 * porté le maillot, et non 198.
 *
 * **La seule sans source : « Ioane Simone ».** Sa feuille unique, Clermont le
 * 7 janvier 2023, est l'une des neuf de 2022-2023 que la LNR ne publie pas —
 * donc une composition devinée. Tranchée par la méthode du projet et non par
 * une source : un prénom inventé ne paraît que sur cette feuille-là, quand
 * celui de la source a une carrière au même club et souvent au même dossard.
 * « Irae » a six feuilles à Clermont dont le même n°12, « Ioane » une seule.
 *
 * Usage :
 *   npx tsx scripts/merge-duplicate-players-2026-08.ts --dry
 *   npx tsx scripts/merge-duplicate-players-2026-08.ts
 *
 * Idempotent, et **déjà appliqué** : relancé sur la base de production, il ne
 * trouve plus aucune fiche absorbée et ne touche à rien. Il ne vaut que par ce
 * qu'il atteste, et pour rejouer le lot sur une base repartie de zéro.
 */

import { PrismaClient } from "@prisma/client";
import { fusionner, type Fusion } from "./lib/fusion";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

/** `preuve` : ce que la feuille officielle écrit, ou pourquoi elle manque. */
const LOT: (Fusion & { label: string; preuve: string })[] = [
  { label: "Mathis Castro-Ferreira ← Mathis Castro Ferreira",
    keepId: "cmmltrb9i005c1uxdq3qzulce", dropId: "cmmucf2jm000a1u0aavmfyrbi",
    nom: { firstName: "Mathis", lastName: "Castro-Ferreira" },
    preuve: "Toulouse 2026-01-03 n°6 « Mathis Castro Ferreira » — le trait d'union est de la base, la LNR ne le met pas" },
  { label: "Loïs Guérois-Galisson ← Loïs Guerois Galisson",
    keepId: "cmmubdifd00101u0dry2zxdoz", dropId: "cmmc6lweu001c1uv2ixiupi4i",
    nom: { firstName: "Loïs", lastName: "Guérois-Galisson" },
    preuve: "Castres 2024-09-21 n°17 « Lois Guerois Galisson » — accents et trait d'union amputés" },
  { label: "Giacomo da Re ← Giacomo Da Re",
    keepId: "cmmltscgf012w1uxdgg7us4ha", dropId: "cmteizmpx000841i70aa1lwqj",
    nom: { firstName: "Giacomo", lastName: "da Re" },
    preuve: "EPCR, Zebre 2025-01-19 n°15 « Giacomo da Re » ; transfert Zebre → Benetton" },
  { label: "Ali Oz ← Ali Oz",
    keepId: "cmt8due6o008t41kzr92x179x", dropId: "cmtftkf7y0001416nocuo8ue7",
    nom: { firstName: "Ali", lastName: "Oz" },
    preuve: "Racing 92 2023-04-22 n°23 « Ali Oz » ; nom identique, Grenoble puis Racing" },
  { label: "Alivereti Duguivalu ← Freddy Duguivalu  [USAP]",
    keepId: "cmmby9suw00451ucdgp6z4u0r", dropId: "cmnedgo06000o1u5bpx6514tq",
    nom: { firstName: "Alivereti", lastName: "Duguivalu" },
    preuve: "EPCR seul, 3 feuilles « Freddy Duguivalu » — nom d'usage du flux Opta" },
  { label: "Siosiua Halanukonuka ← Siua Halanukonuka  [USAP]",
    keepId: "cmneodpy200051ubdesq2u4xj", dropId: "cmnno96c3000w1u7i8eom7z8p",
    nom: { firstName: "Siosiua", lastName: "Halanukonuka" },
    preuve: "la fiche absorbée porte « Siosiua » sur trois de ses cinq feuilles" },
  { label: "Alistair Crossdale ← Ali Crossdale  [USAP]",
    keepId: "cmmby9rsc003e1ucdli6st6ho", dropId: "cmnedfm4w000k1u3dh64ru38g",
    nom: { firstName: "Alistair", lastName: "Crossdale" },
    preuve: "EPCR, Bristol 2022-12-09 n°14 « Ali Crossdale » ; les feuilles LNR de 2022-2023 ne sont pas publiées" },
  { label: "Eddie Sawailau ← Edward Sawailau  [USAP]",
    keepId: "cmnedgopo001c1u5byvlrrz7s", dropId: "cmn4umv2k000q1u9k4qyd4cts",
    nom: { firstName: "Eddie", lastName: "Sawailau" },
    preuve: "« Edward Dratai Sawailau » sur les quatre feuilles lues, Valence-Romans puis USAP" },
  { label: "Maafu Fia ← Siosiaia Fia  [USAP]",
    keepId: "cmnh9vdag000z1ukwkpyvp3ao", dropId: "cmneodr59001f1ubdavjx91f7",
    nom: { firstName: "Maafu", lastName: "Fia" },
    preuve: "« Siosiaia Ma'afu Fia » — le nom complet contient les deux écritures" },
  { label: "Brad Shields ← Bradley Shields  [USAP]",
    keepId: "cmnhgasfw00121u2emprzphej", dropId: "cmt8fpthr000c41h7lwu6fv25",
    nom: { firstName: "Brad", lastName: "Shields" },
    preuve: "Grenoble 2023-06-03 n°6 « Bradley Shields »" },
  { label: "Ben Tameifuna ← Benjamin Tameifuna",
    keepId: "cmmltrqay00i31uxdh4imxs73", dropId: "cmt8dt9z8001841kz2aobv6id",
    nom: { firstName: "Ben", lastName: "Tameifuna" },
    preuve: "« Benjamin Tameifuna » sur trois feuilles UBB, n°3 et n°23" },
  { label: "Pita Ahki ← Pita Jordan Ahki",
    keepId: "cmmltrajv004r1uxd5vf2qrup", dropId: "cmt8dtkip003341kz43ual43z",
    nom: { firstName: "Pita", lastName: "Ahki" },
    preuve: "Toulouse 2024-03-09 n°12 « Pita Jordan Ahki »" },
  { label: "Will Skelton ← Will Skelton (fiche doublée)",
    keepId: "cmmlts10x00t51uxd66sn5vby", dropId: "cmt8dt45j000141kzkvt5v4jy",
    nom: { firstName: "Will", lastName: "Skelton" },
    preuve: "« William Skelton » sur les feuilles La Rochelle, n°5 à chaque fois" },
  { label: "Josaia Raisuqe ← Josaia Winimaivunidawa Raisuqe",
    keepId: "cmmltrn8x00fd1uxdh3o1g9jq", dropId: "cmt8dtmpp003h41kz6u36oiyl",
    nom: { firstName: "Josaia", lastName: "Raisuqe" },
    preuve: "« Josaia Winimaivunidawa Raisuqe » sur les feuilles Castres" },
  { label: "Dan Robson ← Daniel Robson",
    keepId: "cmt8dtao9001d41kzttyht26i", dropId: "cmmltrptq00ho1uxdz8yfhw2y",
    nom: { firstName: "Dan", lastName: "Robson" },
    preuve: "« Daniel Robson » à Pau, n°9 et n°20 ; la fiche conservée porte le bon poste, demi de mêlée" },
  { label: "Irae Simone ← Irae Vincynt Simone",
    keepId: "cmt8dt8zd001241kzbjgs2rzr", dropId: "cmmlts0p600sr1uxdoen6ptqq",
    nom: { firstName: "Irae", lastName: "Simone" },
    preuve: "« Irae Vincynt Simone » sur les trois feuilles Clermont de la fiche absorbée" },
  { label: "Joël Sclavi ← Joël Antonio Sclavi",
    keepId: "cmt8dtb65001f41kz9dslgvuu", dropId: "cmmltrgrh009r1uxdw63mycuc",
    nom: { firstName: "Joël", lastName: "Sclavi" },
    preuve: "« Joël Antonio Sclavi » à La Rochelle ; il porte le 1 et le 3, son poste de référence est bien pilier gauche" },
  { label: "David Ribbans ← David George Ribbans",
    keepId: "cmmltrc4400601uxd5d7jvuzh", dropId: "cmt8dtjfl002x41kzvq99farj",
    nom: { firstName: "David", lastName: "Ribbans" },
    preuve: "Toulon 2024-03-02 n°4 « David George Ribbans »" },
  { label: "Irae Simone ← Ioane Simone",
    keepId: "cmt8dt8zd001241kzbjgs2rzr", dropId: "cmt8du8kk008141kz66tdssu7",
    nom: { firstName: "Irae", lastName: "Simone" },
    preuve: "AUCUNE SOURCE : Clermont 2023-01-07, composition non publiée par la LNR, donc devinée. « Ioane » n'y paraît qu'une fois, « Irae » a six feuilles au même club dont le même n°12" },
  { label: "Manu Tuilagi ← Etuale Manusamoa Tuilagi",
    keepId: "cmmndx79q001y1ui4ke14a3ff", dropId: "cmmltrljj00du1uxdauu9saci",
    nom: { firstName: "Manu", lastName: "Tuilagi" },
    preuve: "Bayonne 2025-01-25 n°12 « Etuale Manusamoa Tuilagi »" },
  { label: "Alex Moon ← Alexander Moon",
    keepId: "cmmndx6u0001i1ui49odrrx93", dropId: "cmt8dujvw009c41kzcjdrgx0a",
    nom: { firstName: "Alex", lastName: "Moon" },
    preuve: "Bayonne 2026-06-06 n°5 « Alexander James Moon »" },
  { label: "Rob Simmons ← Robert Simmons",
    keepId: "cmmltrz9m00rh1uxdzfh9me7m", dropId: "cmt8dt8l3000y41kzikiq3ue4",
    nom: { firstName: "Rob", lastName: "Simmons" },
    preuve: "Clermont 2023-08-26 n°5 « Robert Simmons »" },
  { label: "Ben Tapuai ← Benjamin Nouata Lupe Tapuai",
    keepId: "cmt8dtvqn005041kzjwi0np6r", dropId: "cmmltrrsm00jf1uxdiagbs118",
    nom: { firstName: "Ben", lastName: "Tapuai" },
    preuve: "UBB 2025-03-01 n°22 « Benjamin Nouata Lupe Tapuai »" },
  { label: "Conrad van Vuuren ← Conraad van Vuuren",
    keepId: "cmt8dty0d005j41kzex71lwfo", dropId: "cmmulr1z7001f1umwop0zws0a",
    nom: { firstName: "Conrad", lastName: "van Vuuren" },
    preuve: "EPCR, Lions 2026-01-17 n°18 « Conrad van Vuuren »" },
  // Venue du lot À VOIR, que le niveau FORT avait manquée : les clubs
  // diffèrent, Bristol en 2022 puis Montpellier en 2023. Une lettre d'écart.
  { label: "Elliott Stooke ← Elliot Stooke",
    keepId: "cmt8dt5zx000g41kzqy5m9iqk", dropId: "cmt8fic1n002r878pz0t8j4tv",
    nom: { firstName: "Elliott", lastName: "Stooke" },
    preuve: "les DEUX sources écrivent « Elliott » : Montpellier 2023-03-25 n°18 (LNR) et Bristol 2022-12-09 n°19 (EPCR)" },
];

async function main() {
  console.log(
    `=== Doublons du 30 août 2026 — ${LOT.length} fusions${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  let faites = 0;
  let deja = 0;
  let bloquees = 0;

  for (const entree of LOT) {
    const issue = await fusionner(prisma, entree, DRY_RUN);
    if (issue.etat === "deja") {
      deja++;
      console.log(`  ✓ déjà fait  ${entree.label}`);
      continue;
    }
    if (issue.etat === "collision") {
      bloquees++;
      console.log(
        `  ⚠ BLOQUÉE   ${entree.label} — les deux fiches sur ${issue.dates.length} même(s) match(s) : ${issue.dates.join(", ")}`,
      );
      continue;
    }
    faites++;
    console.log(`  ${DRY_RUN ? "→ à faire " : "✔ fusionné"}  ${entree.label}`);
    console.log(`      ${entree.preuve}`);
    console.log(
      `      ${issue.compte.compositions} composition(s), ${issue.compte.evenements} événement(s), ` +
        `${issue.compte.effectifs} effectif(s)${issue.renomme ? `, renommée « ${entree.nom!.firstName} ${entree.nom!.lastName} »` : ""}`,
    );
  }

  console.log(
    `\n=== ${faites} ${DRY_RUN ? "à faire" : "fusionnée(s)"}, ${deja} déjà faite(s), ${bloquees} bloquée(s) ===`,
  );
  if (deja === LOT.length) {
    console.log("    Lot entièrement appliqué : ce script n'est plus qu'une attestation.");
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
