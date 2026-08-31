/**
 * Ce qu'un script de saison ne doit jamais effacer en se relançant.
 *
 * LES SCRIPTS DE SAISON SONT IDEMPOTENTS, et c'est leur qualité : relancés,
 * ils remettent chaque rencontre en accord avec la LNR. Mais la LNR ne donne
 * ni affluence, ni score à la mi-temps, ni vidéo — ils écrivent donc `null`
 * dans ces colonnes, et une relance **effacerait** ce qui y a été mis par
 * ailleurs.
 *
 * Ce n'est pas une hypothèse. La finale de 2009 est en base depuis longtemps
 * avec sa mi-temps (6-10), son affluence (79 741) et son compte-rendu, tous
 * saisis à la main ; les mi-temps et affluences des coupes d'Europe viennent
 * de l'EPCR. Rien de tout cela ne se retrouverait après un passage du script
 * de saison sur ces rencontres.
 *
 * `preserverAnnexes` garde donc l'existant partout où le script n'a rien à
 * proposer. Un `null` ne remplace jamais une valeur ; une valeur remplace
 * toujours un `null`, la source restant maîtresse de ce qu'elle sait.
 *
 * Le compte-rendu, lui, n'a jamais figuré dans les données écrites : il
 * survivait déjà.
 */

/** Colonnes que la LNR ne renseigne pas et que la relance doit épargner. */
const ANNEXES = ["halfTimeUsap", "halfTimeOpponent", "attendance", "videoUrl"] as const;

type Annexes = { [K in (typeof ANNEXES)[number]]?: number | string | null };

export function preserverAnnexes<T extends Annexes>(donnees: T, existant: Annexes): T {
  const garde = { ...donnees };
  for (const champ of ANNEXES) {
    if (garde[champ] == null && existant[champ] != null) {
      (garde as Annexes)[champ] = existant[champ];
    }
  }
  return garde;
}
