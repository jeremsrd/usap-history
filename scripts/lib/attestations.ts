/**
 * Le troisième état, côté scripts : écrire d'où vient un fait.
 *
 * La table `attestations` (cf. `prisma/schema.prisma`) dit, pour une entité
 * et un champ, ce que le fait vaut — OFFICIEL, CONCORDANT, PROBABLE,
 * ARBITRE —, d'après quelle source, tranché par qui, relu par qui. Une
 * ligne par entité et par champ : `attester()` remplace ce qui s'y trouvait,
 * une provenance ne s'additionne pas.
 *
 * **Quand écrire une attestation.** Chaque fois qu'un script écrit une valeur
 * qui ne vient pas de la feuille officielle de sa compétition — LNR ou
 * EPCR — : un stade posé d'après Wikipédia, un arbitre donné par Jérémy, une
 * composition lue dans *L'Auto*, un poste tranché à la main. L'absence de
 * ligne se lit « source officielle de la chaîne », et c'est la règle pour
 * l'immense majorité des faits.
 *
 * **Le champ vide désigne l'entité entière** : une rencontre venue de la
 * presse, une composition reconstituée. Un champ nommé — `venueId`,
 * `refereeId`, `attendance`, `position` — ne porte que sur lui.
 */

import type { DegreAttestation, PrismaClient } from "@prisma/client";

export type Entite = "Match" | "MatchPlayer" | "Player" | "Venue" | "Opponent" | "Season" | "Referee" | "MatchEvent";

export interface Attestation {
  entite: Entite;
  entiteId: string;
  /** Vide pour l'entité entière. */
  champ?: string;
  degre: DegreAttestation;
  source: string;
  sourceUrl?: string | null;
  note?: string | null;
  decidePar?: string | null;
  reluPar?: string | null;
  reluLe?: Date | null;
}

/** Pose ou remplace l'attestation d'un fait. En simulation, dit ce qu'elle ferait. */
export async function attester(prisma: PrismaClient, a: Attestation, dry = false): Promise<void> {
  const champ = a.champ ?? "";
  if (dry) {
    console.log(`  [attestation] ${a.entite} ${a.entiteId}${champ ? `.${champ}` : ""} — ${a.degre} — ${a.source}`);
    return;
  }
  await prisma.attestation.upsert({
    where: { entite_entiteId_champ: { entite: a.entite, entiteId: a.entiteId, champ } },
    create: {
      entite: a.entite,
      entiteId: a.entiteId,
      champ,
      degre: a.degre,
      source: a.source,
      sourceUrl: a.sourceUrl ?? null,
      note: a.note ?? null,
      decidePar: a.decidePar ?? null,
      reluPar: a.reluPar ?? null,
      reluLe: a.reluLe ?? null,
    },
    update: {
      degre: a.degre,
      source: a.source,
      sourceUrl: a.sourceUrl ?? null,
      note: a.note ?? null,
      decidePar: a.decidePar ?? null,
      reluPar: a.reluPar ?? null,
      reluLe: a.reluLe ?? null,
    },
  });
}

/** Les attestations d'une entité, le champ vide d'abord. */
export async function attestationsDe(prisma: PrismaClient, entite: Entite, entiteId: string) {
  return prisma.attestation.findMany({
    where: { entite, entiteId },
    orderBy: [{ champ: "asc" }, { createdAt: "asc" }],
  });
}
