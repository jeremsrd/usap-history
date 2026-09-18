import Image from "next/image";

/**
 * L'écusson d'un camp dans une ligne de tableau — vingt pixels par défaut, à
 * gauche du nom du club. Posé sur la fiche joueur le 18 septembre 2026 à la
 * demande de Jérémy, puis sorti de cette page le même jour quand la liste des
 * matchs l'a demandé à son tour : deux pages qui affichent la même chose ne
 * l'écrivent pas deux fois.
 *
 * Trois règles du projet s'y appliquent, et aucune ne se voit au journal
 * d'exécution :
 *
 * - **l'écusson adverse porte `logo-club`, celui de l'USAP non.** Sans cette
 *   classe, une marque sombre — le tigre de Leicester, le masque des
 *   Ospreys — disparaît dans le fond en thème sombre ; le blason catalan,
 *   lui, a son propre contour d'or, comme dans le Header, dans le hero et
 *   sur une fiche de match ;
 * - **un club sans écusson ne laisse pas de case vide**, le nom se suffit.
 *   C'est ce que fait l'accueil, et le contraire de ce que font les
 *   portraits des deux XV d'une fiche de match, où une case vide au milieu
 *   d'une colonne de visages se lirait comme un trou ;
 * - **l'image est décorative** — `alt=""` —, le nom du camp la suivant
 *   immédiatement : le lire deux fois n'apprendrait rien à personne.
 *
 * Les grands écussons — 96 pixels sur une fiche de match, 48 sur l'accueil —
 * gardent leur propre code : ils portent une mise en page, pas seulement une
 * image.
 */
export default function Ecusson({
  logoUrl,
  usap = false,
  className = "h-5 w-5",
}: {
  logoUrl?: string | null;
  usap?: boolean;
  className?: string;
}) {
  if (usap) return <Image src="/images/usap/logo.png" alt="" width={40} height={40} className={`${className} shrink-0`} />;
  if (!logoUrl) return null;
  return <Image src={logoUrl} alt="" width={40} height={40} className={`${className} shrink-0 logo-club`} />;
}
