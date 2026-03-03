// =============================================================================
// Génération de slugs pour URLs SEO-friendly
// =============================================================================

/**
 * Convertit une chaîne en slug URL-safe.
 * - Minuscules, supprime les accents, espaces → tirets
 * - Supprime les caractères spéciaux
 * - Collapse les tirets multiples
 *
 * Exemples :
 *   "Stade Toulousain" → "stade-toulousain"
 *   "Jean-François" → "jean-francois"
 *   "Demi-finale" → "demi-finale"
 *   "N°8" → "n-8"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[']/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Génère le slug d'un joueur : "guilhem-guirado-clxyz123abc"
 * Le CUID à la fin garantit l'unicité (deux "Jean Martin" auront des slugs différents).
 */
export function generatePlayerSlug(
  firstName: string,
  lastName: string,
  id: string,
): string {
  const namePart = slugify(`${firstName} ${lastName}`);
  return `${namePart}-${id}`;
}

/**
 * Génère le slug d'un match.
 *
 * Domicile : "top-14-usap-vs-toulouse-j5-14-09-2024"
 * Extérieur : "top-14-toulouse-vs-usap-j5-14-09-2024"
 * Phase finale : "top-14-usap-vs-clermont-finale-06-06-2009"
 * Amical : "amical-usap-vs-beziers-10-08-2024"
 */
export function generateMatchSlug(params: {
  competitionShortName: string | null;
  competitionName: string;
  opponentShortName: string | null;
  opponentName: string;
  isHome: boolean;
  matchday: number | null;
  round: string | null;
  date: Date;
}): string {
  const compSlug = slugify(
    params.competitionShortName || params.competitionName,
  );
  const oppSlug = slugify(
    params.opponentShortName || params.opponentName,
  );

  // Partie journée/phase
  let phaseSlug = "";
  if (params.matchday) {
    phaseSlug = `j${params.matchday}`;
  } else if (params.round) {
    phaseSlug = slugify(params.round);
  }

  // Date au format DD-MM-YYYY
  const d = new Date(params.date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const dateSlug = `${day}-${month}-${year}`;

  // Assemblage selon domicile/extérieur
  const teams = params.isHome
    ? `usap-vs-${oppSlug}`
    : `${oppSlug}-vs-usap`;

  const parts = [compSlug, teams, phaseSlug, dateSlug].filter(Boolean);
  return parts.join("-");
}
