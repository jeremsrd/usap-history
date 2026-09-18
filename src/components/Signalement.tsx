import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import { COURRIEL_CONTACT } from "@/lib/constants";

/**
 * « Une erreur ? Écrivez-moi » — au pied de chaque page publique.
 *
 * Demandé par Jérémy le 18 septembre 2026. Le site affirme des scores, des
 * compositions et des noms avec le même aplomb partout, et une partie de
 * cela est saisie à la main depuis des feuilles que les sources abîment —
 * tout ce fichier de conventions le raconte. Le lecteur, lui, n'a nulle part
 * où le dire : le pied de page porte bien une adresse dans les mentions
 * légales, mais il faut la chercher, et rien n'invite à écrire.
 *
 * **Les deux pages légales le portent aussi**, depuis le même jour : elles
 * n'affichent rien qui vienne de la base, mais c'est là qu'on arrive quand
 * on cherche à qui écrire, et l'adresse y est noyée dans un paragraphe de
 * loi. `PageLegale` l'appelle pour les deux.
 *
 * **Ce n'est pas la réserve de couverture, et les deux ne se remplacent
 * pas** : celle-ci dit ce que la base n'a pas encore (« en cours de
 * saisie »), celui-là dit que ce qu'elle a peut être faux. L'une borne
 * l'étendue, l'autre la confiance.
 *
 * **Ce n'est pas non plus `Provenance`**, qui le clôt sur les fiches : elle
 * dit d'où vient ce que la page affirme quand ce n'est pas d'une feuille
 * officielle, cas par cas et sans rien demander au lecteur. Les deux se
 * suivent, de la source la plus sûre à la main tendue.
 *
 * **Le sujet du courriel porte la page**, faute de quoi un signalement
 * arrive sans dire de quoi il parle : le nom du joueur, l'affiche de la
 * rencontre, le titre de la liste. Le chemin n'y est pas, et c'est délibéré
 * — le lire demanderait `headers()`, qui rendrait dynamiques les
 * trente-six pages du site pour une ligne de courriel.
 *
 * **L'adresse est répétée en clair à côté du lien**, depuis le 18 septembre
 * 2026 : un `mailto:` n'ouvre rien chez qui n'a pas de client de messagerie
 * associé — cas courant sur un ordinateur de bureau —, et le lecteur se
 * retrouverait alors devant un lien mort sans savoir à qui écrire. En clair,
 * l'adresse se copie. Les parenthèses sont dans le composant et non dans le
 * dictionnaire, à la différence des deux-points du pied de page : le
 * français et le catalan les écrivent pareil, sans espace intérieure.
 *
 * Le ton est celui d'une invitation, non d'un avertissement encadré : une
 * ligne sous un filet, le titre dans la voix condensée, le lien souligné
 * d'or comme ceux de `Provenance`. Pas de carte, pas d'icône, pas de fond
 * jaune — le chantier design a débarrassé le site de tout cela.
 */
export default async function Signalement({
  langue,
  sujet,
  sansFilet = false,
}: {
  langue: Langue;
  /** Ce que cette page-ci montre : « Nicolas Mas », « Perpignan 43-29 Castres », « Les stades ». */
  sujet?: string;
  /**
   * Sans son filet, pour l'accueil, où il suit la note de couverture au fil
   * du chapeau au lieu de clore la page : un filet y couperait le chapeau en
   * deux à trois lignes de son titre.
   */
  sansFilet?: boolean;
}) {
  const t = await dictionnaire(langue);
  const objet = sujet ? t("signalement.sujet", { page: sujet }) : t("signalement.sujetSeul");
  const href = `mailto:${COURRIEL_CONTACT}?subject=${encodeURIComponent(objet)}`;

  return (
    <aside className={sansFilet ? "mt-3" : "mt-10 border-t border-border pt-4"}>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        <span className="font-display text-base uppercase text-usap-sang">
          {t("signalement.titre")}
        </span>{" "}
        {t("signalement.texte")}{" "}
        <a
          href={href}
          className="font-medium text-foreground underline decoration-usap-or underline-offset-2 hover:text-usap-sang"
        >
          {t("signalement.lien")}
        </a>{" ("}
        <span className="break-all">{COURRIEL_CONTACT}</span>
        {")"}
      </p>
    </aside>
  );
}
