import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate une date ISO en DD/MM/YYYY, **à l'heure de Paris**.
 *
 * Sans fuseau, la date se lisait à l'heure du serveur — l'UTC chez Vercel —,
 * et une rencontre à venir sans horaire, posée à minuit de Paris, soit 22 h
 * ou 23 h UTC la veille, s'affichait un jour trop tôt : la J6 de 2026-2027
 * au 09/10 au lieu du 10/10, vu le 4 octobre 2026. Le reste de la base est
 * enregistré entre minuit et le soir UTC, et ne bouge pas.
 */
export function formatDateFR(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

/**
 * Formate un score de match : "USAP 22 - 13 Clermont"
 */
export function formatScore(
  scoreUsap: number,
  scoreOpponent: number,
  opponentName: string,
  isHome: boolean,
): string {
  if (isHome) {
    return `USAP ${scoreUsap} - ${scoreOpponent} ${opponentName}`;
  }
  return `${opponentName} ${scoreOpponent} - ${scoreUsap} USAP`;
}

/**
 * Retourne le libellé français du résultat
 */
export function formatResult(result: string): string {
  const labels: Record<string, string> = {
    VICTOIRE: "Victoire",
    DEFAITE: "Défaite",
    NUL: "Nul",
  };
  return labels[result] ?? result;
}

/**
 * Formate un label de saison : "2024-2025"
 */
export function formatSeasonLabel(startYear: number, endYear: number): string {
  return `${startYear}-${endYear}`;
}

/**
 * Codes spéciaux pour les nations du rugby (subdivisions GB).
 * Ces nations n'ont pas de code ISO 3166-1 mais ont des drapeaux Unicode
 * via les "flag tag sequences" (🏴 + tags + cancel).
 */
const SUBDIVISION_FLAGS: Record<string, string> = {
  ENG: "gbeng", // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre
  SCT: "gbsct", // 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse
  WAL: "gbwls", // 🏴󠁧󠁢󠁷󠁬󠁳󠁿 Pays de Galles
};

/**
 * Génère un emoji drapeau de subdivision via Unicode flag tag sequence.
 * 🏴 (U+1F3F4) + tag characters (U+E0061..U+E007A) + cancel tag (U+E007F)
 */
function subdivisionToFlag(subdivision: string): string {
  const BLACK_FLAG = 0x1f3f4;
  const TAG_BASE = 0xe0061; // tag 'a'
  const CANCEL_TAG = 0xe007f;
  const tags = Array.from(subdivision).map(
    (c) => TAG_BASE + c.charCodeAt(0) - 97,
  );
  return String.fromCodePoint(BLACK_FLAG, ...tags, CANCEL_TAG);
}

/**
 * Convertit un code pays en emoji drapeau.
 * - Codes ISO 3166-1 (2 lettres) : "FR" → 🇫🇷, "NZ" → 🇳🇿
 * - Codes rugby spéciaux (3 lettres) : "ENG" → 🏴󠁧󠁢󠁥󠁮󠁧󠁿, "SCT" → 🏴󠁧󠁢󠁳󠁣󠁴󠁿, "WAL" → 🏴󠁧󠁢󠁷󠁬󠁳󠁿
 */
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();

  // Codes de subdivision (nations du rugby : ENG, SCT, WAL)
  const subdivision = SUBDIVISION_FLAGS[upper];
  if (subdivision) {
    return subdivisionToFlag(subdivision);
  }

  // Codes ISO 3166-1 standard (2 lettres)
  if (upper.length === 2) {
    return String.fromCodePoint(
      ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
    );
  }

  return code;
}
