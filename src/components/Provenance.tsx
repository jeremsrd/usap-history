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
  "realisations", "bonusOffensif", "position", "logoUrl", "minutesPlayed", "agregats", "playerId",
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
  // **Une fiche de match porte aussi les attestations de ses lignes de
  // composition**, depuis le 14 septembre 2026 : le n°1 catalan du
  // 12 septembre 2026 est attesté sur sa ligne — la LNR y mettait un autre
  // homme —, et rien ne le disait sur la page tant que celle-ci ne lisait que
  // l'entité `Match`. Une incertitude posée en base et invisible à l'écran
  // ne sert à rien ; chaque ligne est nommée par son dossard et son homme.
  const compositions =
    entite === "Match"
      ? await prisma.matchPlayer.findMany({
          where: { matchId: id },
          select: { id: true, shirtNumber: true, isOpponent: true, player: { select: { firstName: true, lastName: true } } },
        })
      : [];
  const surLignes = compositions.length
    ? await prisma.attestation.findMany({
        where: { entite: "MatchPlayer", entiteId: { in: compositions.map((c) => c.id) } },
        orderBy: [{ createdAt: "asc" }],
      })
    : [];
  if (lignes.length + surLignes.length === 0) return null;
  const t = await dictionnaire(langue);
  const champ = (c: string) => (c === "" ? t("provenance.champ.ensemble") : CHAMPS_CONNUS.has(c) ? t(`provenance.champ.${c}`) : c);
  const ligneDe = (a: (typeof surLignes)[number]) => {
    const c = compositions.find((x) => x.id === a.entiteId)!;
    const nom = c.player ? `${c.player.firstName} ${c.player.lastName}` : "";
    return `${t(c.isOpponent ? "provenance.ligneAdverse" : "provenance.ligneUsap", { numero: c.shirtNumber ?? "?", nom })} — ${champ(a.champ)}`;
  };
  const toutes = [
    ...lignes.map((a) => ({ a, libelle: champ(a.champ) })),
    ...surLignes.map((a) => ({ a, libelle: ligneDe(a) })),
  ];

  return (
    <section className="mt-10 border-t border-border pt-4 text-sm">
      <h2 className="font-display text-lg uppercase text-usap-sang">{t("provenance.titre")}</h2>
      <p className="mt-1 text-muted-foreground">{t("provenance.intro")}</p>
      <ul className="mt-3 space-y-2">
        {toutes.map(({ a, libelle }) => (
          <li key={a.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <span className="shrink-0 sm:w-40">
              <span className="font-medium text-foreground">{libelle}</span>
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
