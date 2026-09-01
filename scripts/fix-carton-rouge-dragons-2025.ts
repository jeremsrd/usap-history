/**
 * PERPIGNAN-DRAGONS DU 7 DÉCEMBRE 2025 — LA MINUTE DU CARTON ROUGE
 *
 * Challenge Européen, poule J1, USAP 41-17. La chronologie place le carton
 * rouge de Duncan Paia'aua à la 35ᵉ. C'est faux : il est à la 14ᵉ, et la 35ᵉ
 * est la minute d'entrée de son suppléant.
 *
 * TROIS PREUVES CONCORDANTES, dont deux arithmétiques :
 *
 * 1. **L'EPCR le dit** — flux Opta, match 288430 : le n°12 Paia'aua porte
 *    `rouge: 14`, `minutes: 14`, `subOut: 14`. C'est la source officielle de
 *    la compétition, et `seed-cup-sheet.ts` n'a rien à modifier sur cette
 *    feuille : la base dit déjà exactement ce qu'elle dit.
 *
 * 2. **La somme des minutes ne retombe qu'avec la 14ᵉ.** L'USAP totalise
 *    1 179 minutes. Avec un rouge à la 14ᵉ et le poste repourvu à la 35ᵉ,
 *    l'équipe joue à quatorze pendant 21 minutes : 1 200 − 21 = 1 179. Avec un
 *    rouge à la 35ᵉ, Paia'aua compterait 35 minutes et non 14, et le total
 *    vaudrait 1 200.
 *
 * 3. **La règle du carton rouge de 20 minutes l'exige.** En coupe d'Europe le
 *    rouge agit comme le carton orange du championnat : le joueur ne revient
 *    pas, son poste est repourvu vingt minutes plus tard. Job Poulet entre à
 *    la 35ᵉ ; le carton est donc vers la 15ᵉ, pas à la 35ᵉ. Un carton à la 35ᵉ
 *    n'aurait autorisé son suppléant qu'à la 55ᵉ.
 *
 * La minute de la chronologie était vraisemblablement recopiée de l'entrée du
 * suppléant. Le reste de l'événement — le joueur, le motif, « USAP à 14 » —
 * est juste et n'est pas touché.
 *
 * `seed-chronologie.ts` ne peut pas réécrire cette ligne : il passe par
 * `phasesLnr()`, qui ne répond pas pour une rencontre de coupe d'Europe.
 * Cette correction est donc stable.
 *
 * Sources : flux EPCR/Opta (match 288430) ; règlement du carton rouge de
 * 20 minutes, confirmé par Jérémy.
 *
 * Usage : npx tsx scripts/fix-carton-rouge-dragons-2025.ts [--dry]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const JOUR = "2025-12-07";
const JOUEUR = "Paia'aua";
const MINUTE_FAUSSE = 35;
const MINUTE_JUSTE = 14;

async function main() {
  console.log(`=== Carton rouge du ${JOUR}${DRY ? " (simulation)" : ""} ===`);

  const match = await prisma.match.findFirst({
    where: {
      date: { gte: new Date(`${JOUR}T00:00:00Z`), lt: new Date(`${JOUR}T23:59:59Z`) },
    },
    include: { matchEvents: { where: { type: "CARTON_ROUGE" } } },
  });
  if (!match) throw new Error(`Match du ${JOUR} introuvable.`);

  const cartons = match.matchEvents.filter((e) => (e.description ?? "").includes(JOUEUR));
  if (cartons.length !== 1) {
    throw new Error(
      `${cartons.length} carton(s) rouge(s) au nom de ${JOUEUR} — attendu exactement 1.`,
    );
  }
  const [carton] = cartons;

  if (carton.minute === MINUTE_JUSTE) {
    console.log(`   déjà à la ${MINUTE_JUSTE}ᵉ — rien à faire.`);
    return;
  }
  if (carton.minute !== MINUTE_FAUSSE) {
    throw new Error(
      `minute inattendue : ${carton.minute}ᵉ (attendu ${MINUTE_FAUSSE}ᵉ ou ${MINUTE_JUSTE}ᵉ).`,
    );
  }

  console.log(`   ${carton.minute}ᵉ → ${MINUTE_JUSTE}ᵉ : ${carton.description}`);
  if (!DRY) {
    await prisma.matchEvent.update({
      where: { id: carton.id },
      data: { minute: MINUTE_JUSTE },
    });
    console.log("   écrit.");
  } else {
    console.log("   simulation — relancer sans --dry pour appliquer.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
