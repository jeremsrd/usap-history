/**
 * Le jour d'une rencontre, **à l'heure de Paris**.
 *
 * `date` est un instant UTC (cf. `docs/modele-de-donnees.md`), et une
 * rencontre à venir sans horaire est posée à minuit de Paris, soit 22 h ou
 * 23 h UTC la veille. Les scripts du lendemain de match cherchaient la
 * journée UTC : le 11 octobre 2026, `set-score.ts --match=2026-10-10` a
 * répondu « 0 rencontre » pour USAP – Vannes, posée au 2026-10-09T22:00Z
 * faute d'horaire calé. Le site lit la date à l'heure de Paris depuis le
 * 4 octobre (`formatDateFR()`) ; les scripts aussi, désormais.
 *
 * Le reste de la base — 697 rencontres sur 715 à cette date — est enregistré
 * entre minuit et le soir UTC : le jour y est le même dans les deux fuseaux.
 */

/** Le jour civil, AAAA-MM-JJ, d'un instant lu à Paris. */
export function jourDeParis(date: Date): string {
  return date.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
}

/** L'avance de Paris sur l'UTC à cet instant, en millisecondes. */
function decalageDeParis(instant: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, Number(p.value)]),
  );
  const commeUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return commeUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Minuit de Paris, le jour donné (AAAA-MM-JJ). */
function minuitDeParis(jour: string): Date {
  const utc = new Date(`${jour}T00:00:00Z`);
  // À minuit UTC, Paris a déjà basculé le jour même : les changements
  // d'heure ont lieu vers 2 h ou 3 h, jamais entre minuit et 1 h.
  return new Date(utc.getTime() - decalageDeParis(utc));
}

/**
 * L'instant d'une heure de Paris, le jour donné : « samedi 11 octobre 2003,
 * 19 h 30 » d'un calendrier se pose `instantDeParis("2003-10-11", "19:30")`.
 */
export function instantDeParis(jour: string, heure: string): Date {
  const naif = new Date(`${jour}T${heure}:00Z`);
  return new Date(naif.getTime() - decalageDeParis(naif));
}

/**
 * Les bornes d'un jour de Paris, à passer telles quelles à Prisma :
 * `{ date: journeeDeParis(jour) }`. Fin exclue, et les jours de changement
 * d'heure font 23 ou 25 heures.
 */
export function journeeDeParis(jour: string): { gte: Date; lt: Date } {
  const lendemain = new Date(`${jour}T00:00:00Z`);
  lendemain.setUTCDate(lendemain.getUTCDate() + 1);
  return { gte: minuitDeParis(jour), lt: minuitDeParis(lendemain.toISOString().slice(0, 10)) };
}
