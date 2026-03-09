import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const match = await prisma.match.findFirst({
    where: { season: { startYear: 2024 }, matchday: 19 },
    select: { id: true, scoreUsap: true, scoreOpponent: true },
  });
  console.log("=== MATCH J19 ===", JSON.stringify(match));

  const names = [
    "Tetrashvili", "Montgaillard", "Roelofse", "Hicks", "Tanguy",
    "Sobela", "Della Schiava", "Velarte", "Hall", "Delpy",
    "Granell", "Buliruarua", "Poulet", "Joseph", "Dupichot",
    "Ruiz", "Devaux", "Warion", "Labouteley", "Oviedo",
    "Ecochard", "Duguivalu", "Fakatika"
  ];
  console.log("\n=== PLAYER IDS ===");
  for (const name of names) {
    const player = await prisma.player.findFirst({
      where: { lastName: { contains: name, mode: "insensitive" } },
      select: { id: true, firstName: true, lastName: true },
    });
    console.log(player
      ? `  "${player.lastName}": "${player.id}", // ${player.firstName} ${player.lastName}`
      : `  // NOT FOUND: ${name}`);
  }

  console.log("\n=== ARBITRE ===");
  const ref = await prisma.referee.findFirst({ where: { lastName: { contains: "Praderie", mode: "insensitive" } } });
  console.log(ref ? `Existe: ${ref.firstName} ${ref.lastName} (${ref.id})` : "NOT FOUND: Praderie");

  console.log("\n=== VENUE ===");
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Mayol", mode: "insensitive" } } });
  console.log(venue ? `Existe: ${venue.name} (${venue.id})` : "NOT FOUND: Mayol");

  await prisma.$disconnect();
}
main();
