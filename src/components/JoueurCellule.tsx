import Link from "@/components/Lien";
import Image from "next/image";

/**
 * Le joueur dans une cellule de tableau : portrait, nom, et la mention de
 * l'effectif du jour. Partagé par les classements — centurions, marqueurs —
 * pour qu'un joueur s'y présente partout de la même façon, et de la même
 * façon que sur la liste des joueurs : le portrait carré aux angles à peine
 * cassés, **la case vide quand il n'y a pas de portrait** — c'est la
 * vérité —, le nom de famille en gras, et « Actuel » en petites capitales
 * rouges plutôt qu'en pastille.
 */
export function JoueurCellule({
  slug,
  firstName,
  lastName,
  photoUrl,
  isActive,
  libelleActuel,
}: {
  slug: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  isActive: boolean;
  /** « Actuel » — passé par la page, qui seule tient le dictionnaire. */
  libelleActuel: string;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className="h-7 w-7 shrink-0">
        {photoUrl && (
          <Image
            src={photoUrl}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-xs object-cover"
          />
        )}
      </span>
      <Link href={`/joueurs/${slug}`} className="text-foreground hover:text-usap-sang">
        {firstName} <span className="font-bold">{lastName}</span>
      </Link>
      {isActive && <span className="text-xs font-semibold text-usap-sang">{libelleActuel}</span>}
    </span>
  );
}
