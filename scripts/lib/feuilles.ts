/**
 * Ce que les feuilles officielles omettent, et qu'une autre source rend.
 *
 * LA LNR OUBLIE PARFOIS UN JOUEUR. Un remplaçant ne coûte qu'une ligne, et
 * `seed-lineup.ts` le tolère en le signalant. Un **titulaire**, en revanche,
 * fait échouer le match : quatorze titulaires, ce sont quatre-vingts minutes
 * qui manquent au total de l'équipe, et le trou se propagerait sans bruit.
 *
 * Cette table rend le joueur manquant à son dossard. Elle vit ici, et non dans
 * l'un des deux scripts, parce que **deux** s'en servent et devraient sinon la
 * répéter : `seed-lineup.ts` pour compléter la composition, et
 * `audit-opponent-lineups.ts` pour ne pas signaler « en trop » un joueur qu'on
 * a délibérément ajouté. Une table recopiée dérive ; celle-ci n'existe qu'une
 * fois.
 *
 * ELLE NE S'ÉCRIT QU'AVEC LA DÉMONSTRATION SOUS LES YEUX, comme
 * `CHANGEMENTS_CORRIGES` : il faut une source donnant la composition entière,
 * et dont les autres joueurs concordent avec la feuille officielle **au
 * dossard près** — sans quoi rien ne dit qu'il s'agit du même match.
 */

/** Un joueur absent de la feuille officielle, rendu à son dossard. */
export interface TitulaireManquant {
  camp: "usap" | "adversaire";
  numero: number;
  prenom: string;
  nom: string;
}

/**
 * Par jour de match.
 *
 * **Stade Français - Perpignan du 21 avril 2012.** La LNR publie vingt-deux
 * Parisiens, et il manque le n°6. La fiche d'ESPN pour cette rencontre
 * (`gameId=143710`) donne les quinze titulaires, dont les quatorze publiés par
 * la LNR au dossard près, et complète par **George Smith**. Le troisième ligne
 * australien était bien au Stade Français ce printemps-là, arrivé en cours de
 * saison pour huit matchs — une source indépendante le confirme. La même fiche
 * donne Charléty pour stade, ce que l'historique des terrains dit déjà de son
 * côté.
 */
export const TITULAIRES_MANQUANTS: Record<string, TitulaireManquant[]> = {
  "2012-04-21": [{ camp: "adversaire", numero: 6, prenom: "George", nom: "Smith" }],
};

/** Ce joueur-là a-t-il été ajouté à la main sur cette feuille ? */
export function estAjoutHorsFeuille(
  jour: string,
  camp: "usap" | "adversaire",
  numero: number,
): boolean {
  return (TITULAIRES_MANQUANTS[jour] ?? []).some(
    (m) => m.camp === camp && m.numero === numero,
  );
}
