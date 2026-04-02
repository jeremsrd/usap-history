/**
 * Correction des stades manquants pour la saison 2022-2023
 *
 * Ajoute les stades pour tous les matchs extérieurs qui n'en ont pas,
 * et lie les stades aux clubs adverses (opponent.venueId).
 *
 * Usage : npx tsx scripts/fix-venues-2022-2023.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Mapping adversaire → stade avec infos
const VENUE_MAP: Record<string, { venueName: string; city: string; capacity: number }> = {
  "Stade Français Paris":       { venueName: "Stade Jean-Bouin",         city: "Paris",            capacity: 20000 },
  "Aviron Bayonnais":           { venueName: "Stade Jean-Dauger",        city: "Bayonne",          capacity: 18032 },
  "Racing 92":                  { venueName: "Paris La Défense Arena",   city: "Nanterre",         capacity: 40000 },
  "Stade Toulousain":           { venueName: "Stade Ernest-Wallon",      city: "Toulouse",         capacity: 19500 },
  "Glasgow Warriors":           { venueName: "Scotstoun Stadium",        city: "Glasgow",          capacity: 7351 },
  "Montpellier Hérault Rugby":  { venueName: "GGL Stadium",             city: "Montpellier",      capacity: 15600 },
  "ASM Clermont Auvergne":      { venueName: "Stade Marcel-Michelin",   city: "Clermont-Ferrand", capacity: 19000 },
  "Bristol Bears":              { venueName: "Ashton Gate Stadium",      city: "Bristol",          capacity: 27000 },
  "CA Brive":                   { venueName: "Stade Amédée-Domenech",   city: "Brive-la-Gaillarde", capacity: 15000 },
  "Union Bordeaux-Bègles":      { venueName: "Stade Chaban-Delmas",     city: "Bordeaux",         capacity: 31100 },
  "RC Toulon":                  { venueName: "Stade Mayol",             city: "Toulon",           capacity: 18200 },
  "Lyon OU":                    { venueName: "Matmut Stadium de Gerland", city: "Lyon",            capacity: 35029 },
  "Castres Olympique":          { venueName: "Stade Pierre Fabre",      city: "Castres",          capacity: 12300 },
  "FC Grenoble Rugby":          { venueName: "Stade des Alpes",         city: "Grenoble",         capacity: 20068 },
};

async function findOrCreateVenue(name: string, city: string, capacity: number): Promise<string> {
  // Chercher par nom exact
  const existing = await prisma.venue.findFirst({ where: { name, city } });
  if (existing) {
    console.log(`  [stade] Existe : ${name} (${city})`);
    return existing.id;
  }

  const venue = await prisma.venue.create({
    data: { name, city, capacity, slug: "temp" },
  });
  const slug = `${slugify(name)}-${slugify(city)}-${venue.id}`;
  await prisma.venue.update({ where: { id: venue.id }, data: { slug } });
  console.log(`  [stade] Créé : ${name} (${city}, ${capacity} places)`);
  return venue.id;
}

async function main() {
  console.log("=== Correction des stades manquants (saison 2022-2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });

  // Récupérer tous les matchs sans stade
  const matchesWithoutVenue = await prisma.match.findMany({
    where: { seasonId: season.id, venueId: null },
    include: { opponent: true },
    orderBy: { date: "asc" },
  });

  console.log(`${matchesWithoutVenue.length} match(s) sans stade\n`);

  let updated = 0;
  let opponentsLinked = 0;

  for (const match of matchesWithoutVenue) {
    const oppName = match.opponent.name;
    const venueInfo = VENUE_MAP[oppName];

    if (!venueInfo) {
      const label = match.matchday ? `J${match.matchday}` : match.round;
      console.log(`  ⚠ Pas de stade trouvé pour ${oppName} (${label})`);
      continue;
    }

    const venueId = await findOrCreateVenue(venueInfo.venueName, venueInfo.city, venueInfo.capacity);

    // Mettre à jour le match
    await prisma.match.update({ where: { id: match.id }, data: { venueId } });
    const label = match.matchday ? `J${match.matchday}` : match.round;
    console.log(`  ✓ ${label} : ${oppName} → ${venueInfo.venueName}`);
    updated++;

    // Lier le stade à l'adversaire s'il ne l'a pas déjà
    if (!match.opponent.venueId) {
      await prisma.opponent.update({ where: { id: match.opponent.id }, data: { venueId } });
      console.log(`    → Stade lié à l'adversaire ${oppName}`);
      opponentsLinked++;
    }
  }

  console.log(`\n=== Terminé ===`);
  console.log(`  ${updated} match(s) mis à jour`);
  console.log(`  ${opponentsLinked} adversaire(s) liés à leur stade`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
