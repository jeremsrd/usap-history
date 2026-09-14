import type { EventType } from "@prisma/client";

/**
 * L'icône d'un fait de match, devant sa ligne dans la chronologie —
 * demandée par Jérémy le 14 septembre 2026, le chantier design ayant retiré
 * les emojis qui s'y trouvaient. Ce ne sont pas des emojis : quatre dessins
 * de seize pixels, au trait, en `currentColor`, qui rendent partout pareil
 * et prennent la couleur de la ligne — le rouge de l'USAP, le gris de
 * l'adversaire.
 *
 * Le ballon pour un essai ; les poteaux pour ce qui se marque au pied, avec
 * le ballon au sol pour une transformation, en l'air pour un drop, et seuls
 * pour une pénalité — la ligne dit le reste ; un rectangle plein pour un
 * carton, jaune ou sang ; deux flèches pour un remplacement.
 *
 * **Le jaune du carton est une couleur en dur, et c'est voulu** : c'est une
 * donnée, comme les couleurs d'un club sur sa fiche, non un jeton du thème —
 * un carton jaune est jaune dans les deux thèmes. Un liseré en `currentColor`
 * à faible opacité le détache du fond sombre.
 */
export function IconeFait({ type, className = "" }: { type: EventType; className?: string }) {
  const commun = { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": true, className: `inline-block shrink-0 ${className}` } as const;
  switch (type) {
    case "ESSAI":
    case "ESSAI_PENALITE":
      return (
        <svg {...commun} fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="8" cy="8" rx="6.5" ry="4" transform="rotate(-35 8 8)" />
          <path d="M5.8 9.6 10.2 6.4M6.9 10.6l1-1M8.3 9.3l1-1M9.7 8l1-1" strokeLinecap="round" />
        </svg>
      );
    case "TRANSFORMATION":
      return (
        <svg {...commun} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 15V2M12 15V2M4 8h8" />
          <circle cx="8" cy="13" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "PENALITE":
      return (
        <svg {...commun} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 15V2M12 15V2M4 8h8" />
        </svg>
      );
    case "DROP":
      return (
        <svg {...commun} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 15V2M12 15V2M4 8h8" />
          <circle cx="8" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "CARTON_JAUNE":
      return (
        <svg {...commun}>
          <rect x="4" y="1.5" width="8" height="13" rx="1" fill="#f2c500" stroke="currentColor" strokeOpacity="0.35" />
        </svg>
      );
    case "CARTON_ROUGE":
      return (
        <svg {...commun}>
          <rect x="4" y="1.5" width="8" height="13" rx="1" className="fill-usap-sang" />
        </svg>
      );
    case "REMPLACEMENT_ENTREE":
    case "REMPLACEMENT_SORTIE":
      return (
        <svg {...commun} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 5.5h9M8.5 3l2.5 2.5L8.5 8M14 10.5H5M7.5 8 5 10.5 7.5 13" />
        </svg>
      );
    default:
      return null;
  }
}
