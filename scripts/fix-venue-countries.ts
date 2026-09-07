/**
 * Donne un pays aux stades qui n'en ont pas, et fusionne deux doublons.
 *
 * Au 7 septembre 2026, 54 stades sur 72 étaient sans pays, et la page des
 * stades les rangeait sous « Pays inconnu » — Aimé-Giral compris. Aucun
 * n'exige de recherche : **le club qui y reçoit a un pays en base**, et
 * c'est lui qu'on recopie ; les quatre terrains neutres — Montjuïc, Milton
 * Keynes, les Ponts-Jumeaux, Maraussan — se situent par leur ville, qui
 * n'a pas d'homonyme. Un stade dont les occupants ne s'accordent pas, ou
 * dont ni l'occupant ni la ville ne disent rien, est laissé tel quel et
 * nommé.
 *
 * Deux doublons, nés de deux scripts qui ne cherchaient pas le même nom :
 * - « Murrayfield » (seed-challenge-2022-2023, le Glasgow-USAP de 2022) et
 *   « Murrayfield Stadium » (seed-cup-espn, l'Edinburgh-USAP de 2014), le
 *   même stade sous deux noms ; on garde le second, qui porte l'occupant,
 *   et le premier script cherche désormais ce nom-là ;
 * - « Stade Olympique de Montjuïc » (seed.ts, aucun match) et « Estadi
 *   Olímpic Lluís Companys » (lib/stades.ts, le quart de 2011) ; on garde
 *   le nom officiel, et seed.ts l'écrit désormais.
 * Les matchs, clubs et périodes d'occupation du doublon sont repointés,
 * puis la fiche est supprimée. Idempotent ; `--dry` pour simuler.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

/** Les terrains sans occupant, situés par leur ville. */
const PAR_VILLE: Record<string, string> = {
  Barcelone: "Espagne",
  Édimbourg: "Écosse",
  "Milton Keynes": "Angleterre",
  Narbonne: "France",
  Toulouse: "France",
};

/** Doublons : le nom à absorber → le nom à garder. */
const DOUBLONS: Record<string, string> = {
  Murrayfield: "Murrayfield Stadium",
  "Stade Olympique de Montjuïc": "Estadi Olímpic Lluís Companys",
};

async function fusionnerDoublons() {
  console.log("--- doublons");
  for (const [perduNom, gardeNom] of Object.entries(DOUBLONS)) {
    const perdu = await prisma.venue.findFirst({ where: { name: perduNom }, include: { _count: { select: { matches: true, opponents: true, opponentStints: true } } } });
    const garde = await prisma.venue.findFirst({ where: { name: gardeNom } });
    if (!perdu) {
      console.log(`  ${perduNom} : absent, rien à fusionner`);
      continue;
    }
    if (!garde) {
      console.log(`  ${perduNom} : « ${gardeNom} » introuvable, laissé tel quel`);
      continue;
    }
    console.log(`  ${perduNom} → ${gardeNom} : ${perdu._count.matches} match(s), ${perdu._count.opponents} club(s), ${perdu._count.opponentStints} période(s) repointés`);
    if (DRY_RUN) continue;
    await prisma.match.updateMany({ where: { venueId: perdu.id }, data: { venueId: garde.id } });
    await prisma.opponent.updateMany({ where: { venueId: perdu.id }, data: { venueId: garde.id } });
    await prisma.opponentVenue.updateMany({ where: { venueId: perdu.id }, data: { venueId: garde.id } });
    await prisma.venue.delete({ where: { id: perdu.id } });
  }
}

async function situer() {
  console.log("\n--- pays");
  const pays = new Map((await prisma.country.findMany()).map((c) => [c.name, c.id]));
  const stades = await prisma.venue.findMany({
    where: { countryId: null },
    orderBy: { name: "asc" },
    include: {
      opponents: { select: { name: true, country: { select: { name: true } } } },
      opponentStints: { select: { opponent: { select: { name: true, country: { select: { name: true } } } } } },
    },
  });
  let situes = 0;
  const restes: string[] = [];
  for (const s of stades) {
    const occupants = [...s.opponents, ...s.opponentStints.map((o) => o.opponent)];
    const candidats = new Set(occupants.map((o) => o.country?.name).filter(Boolean) as string[]);
    let nom: string | null = null;
    let raison = "";
    if (candidats.size === 1) {
      nom = [...candidats][0];
      raison = `terrain de ${occupants.map((o) => o.name).join(", ")}`;
    } else if (candidats.size > 1) {
      restes.push(`${s.name} (${s.city}) : occupants de pays différents, ${[...candidats].join(" / ")}`);
      continue;
    } else if (s.isHomeGround) {
      nom = "France";
      raison = "le terrain de l'USAP";
    } else if (PAR_VILLE[s.city]) {
      nom = PAR_VILLE[s.city];
      raison = `par la ville, ${s.city}`;
    } else {
      restes.push(`${s.name} (${s.city}) : ni occupant ni ville connue`);
      continue;
    }
    const id = pays.get(nom);
    if (!id) {
      restes.push(`${s.name} : le pays « ${nom} » n'est pas en base`);
      continue;
    }
    console.log(`  ${s.name} (${s.city}) → ${nom} — ${raison}`);
    situes++;
    if (!DRY_RUN) await prisma.venue.update({ where: { id: s.id }, data: { countryId: id } });
  }
  console.log(`\n${situes} stade(s) situé(s)${DRY_RUN ? " (simulation)" : ""}, ${restes.length} laissé(s) tel(s) quel(s)`);
  for (const r of restes) console.log(`  ✗ ${r}`);
}

async function main() {
  if (DRY_RUN) console.log("SIMULATION — rien ne sera écrit\n");
  await fusionnerDoublons();
  await situer();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
