import { prisma } from "@/lib/prisma";
import type { DegreAttestation } from "@prisma/client";

/**
 * D'où vient ce que la page affirme, quand ce n'est pas de la feuille
 * officielle.
 *
 * La table `attestations` porte le troisième état de la base — ni affirmé,
 * ni inconnu : « probable, d'après telle source, tranché par telle
 * personne ». Ce composant le rend lisible au pied d'une fiche, et se tait
 * quand il n'y a rien : l'absence d'attestation se lit « source officielle
 * de la chaîne », et c'est le cas ordinaire.
 */

const DEGRES: Record<DegreAttestation, string> = {
  OFFICIEL: "Source officielle",
  CONCORDANT: "Source secondaire, recoupée",
  PROBABLE: "Probable",
  ARBITRE: "Arbitré",
};

/** Le nom du champ tel qu'un lecteur le comprend. */
const CHAMPS: Record<string, string> = {
  "": "l'ensemble",
  venueId: "le stade",
  refereeId: "l'arbitre",
  attendance: "l'affluence",
  halfTime: "la mi-temps",
  score: "le score",
  composition: "la composition",
  realisations: "les réalisations",
  bonusOffensif: "le bonus offensif",
  position: "le poste de référence",
  logoUrl: "l'écusson",
  minutesPlayed: "le temps de jeu",
  agregats: "le bilan de la saison",
};

export default async function Provenance({
  entite,
  id,
}: {
  entite: "Match" | "Player" | "Opponent" | "Season" | "Venue";
  id: string;
}) {
  const lignes = await prisma.attestation.findMany({
    where: { entite, entiteId: id },
    orderBy: [{ champ: "asc" }, { createdAt: "asc" }],
  });
  if (lignes.length === 0) return null;

  return (
    <section className="mt-10 border-t border-border pt-4 text-sm">
      <h2 className="font-display text-lg uppercase text-usap-sang">Sources et arbitrages</h2>
      <p className="mt-1 text-muted-foreground">
        Ce que cette page affirme vient d&rsquo;une feuille officielle, sauf ce qui suit.
      </p>
      <ul className="mt-3 space-y-2">
        {lignes.map((a) => (
          <li key={a.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <span className="shrink-0 sm:w-40">
              <span className="font-medium text-foreground">{CHAMPS[a.champ] ?? a.champ}</span>
              <span className="text-muted-foreground"> · {DEGRES[a.degre]}</span>
            </span>
            <span className="text-foreground">
              {a.sourceUrl ? (
                <a href={a.sourceUrl} className="underline decoration-usap-or underline-offset-2" rel="noopener">
                  {a.source}
                </a>
              ) : (
                a.source
              )}
              {a.decidePar && <span className="text-muted-foreground"> — tranché par {a.decidePar}</span>}
              {a.reluPar && (
                <span className="text-muted-foreground">
                  {" "}
                  — relu par {a.reluPar}
                  {a.reluLe ? ` le ${a.reluLe.toLocaleDateString("fr-FR")}` : ""}
                </span>
              )}
              {a.note && <span className="block text-muted-foreground">{a.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
