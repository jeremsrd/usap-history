import type { CoachRole } from "@prisma/client";

/**
 * Les passages d'un entraîneur sur le banc, et les rencontres jouées
 * pendant qu'il y était.
 *
 * Deux relations disent la même chose à deux niveaux de détail :
 * `Season.coachId`, l'entraîneur principal unique d'une saison, et
 * `SeasonCoach`, le staff détaillé — rôle, prise et fin de fonction en
 * cours de saison. La seconde l'emporte quand elle existe ; la première
 * n'est lue que pour une saison que le staff détaillé ne couvre pas, et
 * vaut alors « entraîneur principal, toute la saison ».
 *
 * **Une rencontre n'est sous son banc qu'entre ses dates**, quand la base
 * les porte : Franck Azéma a quitté le banc le 2 novembre 2025, et les
 * rencontres suivantes de 2025-2026 sont celles de Laurent Labit. Sans
 * cette borne, les deux hommes se verraient attribuer la saison entière,
 * et la même défaite compterait deux fois dans deux bilans.
 */

export interface SaisonDuBanc {
  id: string;
  label: string;
  startYear: number;
}

export interface Passage<S extends SaisonDuBanc = SaisonDuBanc> {
  season: S;
  role: CoachRole;
  startDate: Date | null;
  endDate: Date | null;
  isInterim: boolean;
}

/** Unifie le staff détaillé et la relation d'entraîneur principal. */
export function passagesDe<S extends SaisonDuBanc>(coach: {
  seasons: S[];
  seasonCoaches: Array<{ season: S; role: CoachRole; startDate: Date | null; endDate: Date | null; isInterim: boolean }>;
}): Passage<S>[] {
  const detailles = new Set(coach.seasonCoaches.map((sc) => sc.season.id));
  const passages: Passage<S>[] = coach.seasonCoaches.map((sc) => ({
    season: sc.season,
    role: sc.role,
    startDate: sc.startDate,
    endDate: sc.endDate,
    isInterim: sc.isInterim,
  }));
  for (const s of coach.seasons) {
    if (!detailles.has(s.id)) {
      passages.push({ season: s, role: "ENTRAINEUR_PRINCIPAL", startDate: null, endDate: null, isInterim: false });
    }
  }
  return passages.sort((a, b) => a.season.startYear - b.season.startYear || a.role.localeCompare(b.role));
}

/** Les rencontres jouées pendant que l'homme était sur le banc, à ses dates près. */
export function sousSonBanc<M extends { seasonId: string; date: Date }>(passages: Passage[], matchs: M[]): M[] {
  return matchs.filter((m) =>
    passages.some(
      (p) => p.season.id === m.seasonId && (!p.startDate || m.date >= p.startDate) && (!p.endDate || m.date <= p.endDate),
    ),
  );
}

/**
 * Les saisons d'un rôle en séquences contiguës — « 2005-2006, puis de
 * 2024-2025 à 2025-2026 » —, pour ne jamais écrire « de 2005-2006 à
 * 2025-2026 » d'un homme parti dix-huit ans entre les deux.
 */
export function sequences(saisons: SaisonDuBanc[]): Array<{ premiere: SaisonDuBanc; derniere: SaisonDuBanc; n: number }> {
  const uniques = [...new Map(saisons.map((s) => [s.id, s])).values()].sort((a, b) => a.startYear - b.startYear);
  const runs: Array<{ premiere: SaisonDuBanc; derniere: SaisonDuBanc; n: number }> = [];
  for (const s of uniques) {
    const run = runs[runs.length - 1];
    if (run && s.startYear === run.derniere.startYear + 1) {
      run.derniere = s;
      run.n++;
    } else {
      runs.push({ premiere: s, derniere: s, n: 1 });
    }
  }
  return runs;
}
