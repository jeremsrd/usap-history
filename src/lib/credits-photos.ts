import credits from "../../public/images/players/credits.json";

/**
 * Crédit d'un portrait de joueur — auteur, licence et page d'origine.
 *
 * Les portraits viennent de Wikimedia Commons, sous CC BY, CC BY-SA ou
 * Licence Art Libre. **CES LICENCES EXIGENT L'ATTRIBUTION** : afficher la
 * photo sans créditer son auteur, c'est la republier sans droit. La mention
 * rendue par `creditPhoto` n'est donc pas décorative, et la retirer de la
 * fiche joueur rendrait le site fautif.
 *
 * Le fichier `public/images/players/credits.json` est écrit par
 * `scripts/fetch-player-photos.ts`, qui y consigne ce que l'API de Commons
 * rend pour chaque image.
 */
export interface CreditPhoto {
  joueur: string;
  /** Nom du fichier sur Commons. */
  fichier: string;
  auteur: string;
  licence: string;
  /** Page de description sur Commons, où la licence est détaillée. */
  source: string;
  original: string;
}

const TABLE = credits as Record<string, CreditPhoto>;

/**
 * Le crédit d'une photo à partir de son `photoUrl`, ou `null` si l'image ne
 * vient pas de la moisson — les portraits téléversés à la main dans
 * Supabase, notamment, n'en ont pas.
 */
export function creditPhoto(photoUrl: string | null | undefined): CreditPhoto | null {
  if (!photoUrl) return null;
  const fichier = photoUrl.split("/").pop();
  return (fichier && TABLE[fichier]) || null;
}
