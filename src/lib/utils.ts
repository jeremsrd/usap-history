import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate une date ISO en DD/MM/YYYY
 */
export function formatDateFR(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
 * Convertit un code ISO pays (2 lettres) en emoji drapeau.
 * Ex: "FR" → "🇫🇷", "NZ" → "🇳🇿"
 */
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return code;
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
