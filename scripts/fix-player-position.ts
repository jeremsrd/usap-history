/**
 * Corrige le poste de référence d'un joueur — fiche, effectifs de saison et
 * lignes de remplaçant.
 *
 * Usage :
 *   npx tsx scripts/fix-player-position.ts --joueur="Marco Riccioni" --poste=PILIER_DROIT --dry
 *   npx tsx scripts/fix-player-position.ts --joueur="Marco Riccioni" --poste=PILIER_DROIT
 *
 * ------------------------------------------------------------------------
 * POURQUOI IL NE SUFFIT PAS D'ÉCRIRE `Player.position`
 *
 * **Un poste de référence faux se propage.** Le numéro de maillot ne dit rien
 * du poste d'un remplaçant — 16 à 23 ne désignent aucune place sur le terrain
 * —, si bien que `MatchPlayer.positionPlayed` reprend alors `Player.position`.
 * Matteo Rodor, fiché numéro 8 alors qu'il est demi de mêlée, portait ainsi
 * quatorze lignes fausses sur cinquante-huit, toutes des lignes de banc.
 *
 * Corriger la seule fiche laisse donc les lignes derrière. Ce script reprend
 * les trois endroits : `Player.position`, les `SeasonPlayer` du joueur, et
 * les `MatchPlayer` **de remplaçant**.
 *
 * IL NE TOUCHE PAS AUX TITULAIRES. Leur `positionPlayed` se déduit du numéro
 * de maillot — un joueur fiché troisième ligne qui porte le 4 a bien tenu la
 * deuxième ligne ce jour-là, et c'est un fait de la feuille, pas une
 * conséquence de sa fiche. Seules les lignes dont le dossard est ≥ 16, ou
 * sans dossard, sont reprises.
 *
 * ------------------------------------------------------------------------
 * IL REFUSE DE DEVINER
 *
 * Le nom doit désigner **une** fiche et une seule, sur le nom complet exact :
 * un patronyme partagé fait échouer plutôt que choisir. Et le poste doit être
 * une valeur de l'enum — « pilier » n'en est pas une, la base distingue le
 * gauche du droit.
 */
import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const simulation = args.includes("--dry");
  const nom = args.find((a) => a.startsWith("--joueur="))?.split("=")[1];
  const poste = args.find((a) => a.startsWith("--poste="))?.split("=")[1];

  if (!nom || !poste) {
    throw new Error('Usage : --joueur="Prénom Nom" --poste=PILIER_DROIT [--dry]');
  }
  if (!(poste in Position)) {
    throw new Error(
      `« ${poste} » n'est pas un poste. Valeurs : ${Object.keys(Position).join(", ")}`,
    );
  }
  const cible = Position[poste as keyof typeof Position];

  // Recherche large puis égalité stricte : la base coupe prénom et nom à des
  // endroits variables, et un `where` composé raterait « Jean Bernard Pujol ».
  const candidats = await prisma.player.findMany({
    where: { lastName: { contains: nom.split(" ").pop()!, mode: "insensitive" } },
    select: { id: true, firstName: true, lastName: true, position: true },
  });
  const fiches = candidats.filter(
    (c) => `${c.firstName} ${c.lastName}`.toLowerCase() === nom.toLowerCase(),
  );
  if (fiches.length !== 1) {
    throw new Error(
      `« ${nom} » désigne ${fiches.length} fiche(s), il en faut une` +
        (candidats.length
          ? ` — approchantes : ${candidats.map((c) => `${c.firstName} ${c.lastName}`).join(", ")}`
          : ""),
    );
  }
  const fiche = fiches[0];

  const saisons = await prisma.seasonPlayer.findMany({
    where: { playerId: fiche.id },
    select: { id: true, position: true, season: { select: { label: true } } },
  });
  // Le poste de référence ne sert de repli que là où le dossard ne dit rien.
  const remplacements = await prisma.matchPlayer.findMany({
    where: {
      playerId: fiche.id,
      OR: [{ shirtNumber: { gte: 16 } }, { shirtNumber: null }],
    },
    select: {
      id: true,
      shirtNumber: true,
      positionPlayed: true,
      match: { select: { date: true } },
    },
  });

  console.log(`=== ${fiche.firstName} ${fiche.lastName} ===`);
  console.log(`  fiche          : ${fiche.position ?? "aucun"} → ${cible}`);
  console.log(`  effectifs      : ${saisons.length} ligne(s)`);
  for (const s of saisons) {
    console.log(`    ${s.season.label}  ${s.position ?? "aucun"} → ${cible}`);
  }
  const aReprendre = remplacements.filter((m) => m.positionPlayed !== cible);
  console.log(
    `  remplacements  : ${remplacements.length} ligne(s), ${aReprendre.length} à reprendre`,
  );
  for (const m of aReprendre.slice(0, 12)) {
    console.log(
      `    ${m.match.date.toISOString().slice(0, 10)}  n°${m.shirtNumber ?? "?"}  ` +
        `${m.positionPlayed ?? "aucun"} → ${cible}`,
    );
  }
  if (aReprendre.length > 12) console.log(`    … et ${aReprendre.length - 12} autres`);

  if (simulation) {
    console.log("\nSimulation — relancer sans --dry pour appliquer.");
    return;
  }

  await prisma.player.update({ where: { id: fiche.id }, data: { position: cible } });
  await prisma.seasonPlayer.updateMany({
    where: { playerId: fiche.id },
    data: { position: cible },
  });
  for (const m of aReprendre) {
    await prisma.matchPlayer.update({ where: { id: m.id }, data: { positionPlayed: cible } });
  }
  console.log(
    `\nÉcrit : la fiche, ${saisons.length} effectif(s) de saison, ` +
      `${aReprendre.length} ligne(s) de remplacement.`,
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
