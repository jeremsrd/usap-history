import Link from "@/components/Lien";
import Image from "next/image";
import { Users } from "lucide-react";

/**
 * Le joueur dans une cellule de tableau : portrait, nom, et le badge de
 * l'effectif du jour. Partagé par les classements — centurions, marqueurs —
 * pour qu'un joueur s'y présente partout de la même façon.
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
    <Link href={`/joueurs/${slug}`} className="group flex items-center gap-3">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <span className="font-medium text-foreground group-hover:text-usap-sang">
        {firstName} {lastName}
      </span>
      {isActive && (
        <span className="rounded bg-usap-sang/10 px-1.5 py-0.5 text-xs font-medium text-usap-sang">
          {libelleActuel}
        </span>
      )}
    </Link>
  );
}
