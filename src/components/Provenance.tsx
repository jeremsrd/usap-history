import { prisma } from "@/lib/prisma";
import { dictionnaire } from "@/i18n/dictionnaire";
import { LOCALE_INTL, type Langue } from "@/i18n/langues";

/**
 * D'où vient ce que la page affirme, quand ce n'est pas de la feuille
 * officielle.
 *
 * La table `attestations` porte le troisième état de la base — ni affirmé,
 * ni inconnu : « probable, d'après telle source, tranché par telle
 * personne ». Ce composant le rend lisible au pied d'une fiche, et se tait
 * quand il n'y a rien : l'absence d'attestation se lit « source officielle
 * de la chaîne », et c'est le cas ordinaire.
 *
 * Ses libellés viennent du dictionnaire (`provenance.*`) depuis le
 * 7 septembre 2026 ; la source elle-même, la note et les noms restent tels
 * que la base les porte, en français.
 */

/** Les champs que le dictionnaire sait nommer ; les autres s'affichent tels quels. */
const CHAMPS_CONNUS = new Set([
  "venueId", "refereeId", "attendance", "halfTime", "score", "composition",
  "realisations", "bonusOffensif", "position", "logoUrl", "minutesPlayed", "agregats",
]);

export default async function Provenance({
  entite,
  id,
  langue,
}: {
  entite: "Match" | "Player" | "Opponent" | "Season" | "Venue" | "Referee" | "Coach" | "President";
  id: string;
  langue: Langue;
}) {
  const lignes = await prisma.attestation.findMany({
    where: { entite, entiteId: id },
    orderBy: [{ champ: "asc" }, { createdAt: "asc" }],
  });
  if (lignes.length === 0) return null;
  const t = await dictionnaire(langue);
  const champ = (c: string) => (c === "" ? t("provenance.champ.ensemble") : CHAMPS_CONNUS.has(c) ? t(`provenance.champ.${c}`) : c);

  return (
    <section className="mt-10 border-t border-border pt-4 text-sm">
      <h2 className="font-display text-lg uppercase text-usap-sang">{t("provenance.titre")}</h2>
      <p className="mt-1 text-muted-foreground">{t("provenance.intro")}</p>
      <ul className="mt-3 space-y-2">
        {lignes.map((a) => (
          <li key={a.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <span className="shrink-0 sm:w-40">
              <span className="font-medium text-foreground">{champ(a.champ)}</span>
              <span className="text-muted-foreground"> · {t(`provenance.degre.${a.degre}`)}</span>
            </span>
            <span className="text-foreground">
              {a.sourceUrl ? (
                <a href={a.sourceUrl} className="underline decoration-usap-or underline-offset-2" rel="noopener">
                  {a.source}
                </a>
              ) : (
                a.source
              )}
              {a.decidePar && <span className="text-muted-foreground">{t("provenance.tranchePar", { nom: a.decidePar })}</span>}
              {a.reluPar && (
                <span className="text-muted-foreground">
                  {t("provenance.reluPar", { nom: a.reluPar })}
                  {a.reluLe ? t("provenance.le", { date: a.reluLe.toLocaleDateString(LOCALE_INTL[langue]) }) : ""}
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
