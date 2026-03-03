// =============================================================================
// Couleurs USAP
// Les couleurs de l'interface sont gérées par CSS variables (voir globals.css).
// Ces constantes servent de référence pour les contextes non-CSS (canvas, SVG…)
// =============================================================================

export const COLORS = {
  SANG: "#C8102E",
  OR_LIGHT: "#b8860b",
  OR_DARK: "#FFD700",
  FOND_CLAIR: "#f8fafc",
  FOND_SOMBRE: "#1a1a2e",
  CARTE_CLAIR: "#ffffff",
  CARTE_SOMBRE: "#16213e",
} as const;

// =============================================================================
// Postes de rugby (numéro → libellé français)
// =============================================================================

export const POSITIONS: Record<string, { label: string; number: number }> = {
  PILIER_GAUCHE: { label: "Pilier gauche", number: 1 },
  TALONNEUR: { label: "Talonneur", number: 2 },
  PILIER_DROIT: { label: "Pilier droit", number: 3 },
  DEUXIEME_LIGNE: { label: "2ème ligne", number: 4 },
  TROISIEME_LIGNE_AILE: { label: "3ème ligne aile", number: 6 },
  NUMERO_HUIT: { label: "N°8", number: 8 },
  DEMI_DE_MELEE: { label: "Demi de mêlée", number: 9 },
  DEMI_OUVERTURE: { label: "Demi d'ouverture", number: 10 },
  AILIER: { label: "Ailier", number: 11 },
  CENTRE: { label: "Centre", number: 12 },
  ARRIERE: { label: "Arrière", number: 15 },
} as const;

// =============================================================================
// Compétitions
// =============================================================================

export const COMPETITIONS = [
  { name: "Top 14", shortName: "Top 14", type: "CHAMPIONNAT" },
  { name: "Pro D2", shortName: "Pro D2", type: "CHAMPIONNAT" },
  { name: "Champions Cup", shortName: "H-Cup", type: "COUPE_EUROPE" },
  { name: "Challenge européen", shortName: "Challenge", type: "CHALLENGE_EUROPE" },
  { name: "Challenge Yves du Manoir", shortName: "Du Manoir", type: "COUPE_FRANCE" },
] as const;

// Types de compétition (libellés français pour l'UI)
export const COMPETITION_TYPES: Record<string, string> = {
  CHAMPIONNAT: "Championnat",
  COUPE_EUROPE: "Coupe d'Europe",
  CHALLENGE_EUROPE: "Challenge européen",
  COUPE_FRANCE: "Coupe de France / Manoir",
  AMICAL: "Amical",
  BARRAGES: "Barrages",
} as const;

// =============================================================================
// Divisions (libellés français pour l'UI)
// =============================================================================

export const DIVISIONS: Record<string, string> = {
  CHAMPIONNAT_2EME_SERIE: "Championnat 2ème série",
  CHAMPIONNAT_1ERE_SERIE: "Championnat 1ère série",
  CHAMPIONNAT_EXCELLENCE: "Championnat Excellence",
  GROUPE_A: "Groupe A",
  PREMIERE_DIVISION: "1ère Division",
  TOP_16: "Top 16",
  TOP_14: "Top 14",
  PRO_D2: "Pro D2",
} as const;

// =============================================================================
// Continents (libellés français pour l'UI)
// =============================================================================

export const CONTINENTS: Record<string, string> = {
  EUROPE: "Europe",
  AFRIQUE: "Afrique",
  AMERIQUE_NORD: "Amérique du Nord",
  AMERIQUE_SUD: "Amérique du Sud",
  ASIE: "Asie",
  OCEANIE: "Océanie",
} as const;

// =============================================================================
// Résultats de match (libellés français pour l'UI)
// =============================================================================

export const MATCH_RESULTS: Record<string, string> = {
  VICTOIRE: "Victoire",
  DEFAITE: "Défaite",
  NUL: "Nul",
} as const;

// =============================================================================
// Navigation principale
// =============================================================================

export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/saisons", label: "Saisons" },
  { href: "/joueurs", label: "Joueurs" },
  { href: "/matchs", label: "Matchs" },
  { href: "/statistiques", label: "Statistiques" },
  { href: "/palmares", label: "Palmarès" },
  { href: "/arbitres", label: "Arbitres" },
] as const;

// =============================================================================
// Palmarès résumé
// =============================================================================

export const PALMARES = {
  titresChampion: [1914, 1921, 1925, 1938, 1944, 1955, 2009],
  finales: [1924, 1926, 1935, 1939, 1952, 1977, 1998, 2004, 2010],
  titresProD2: [2018, 2021],
  challengeDuManoir: [1935, 1955, 1994],
  finaleCoupeEurope: [2003],
} as const;
