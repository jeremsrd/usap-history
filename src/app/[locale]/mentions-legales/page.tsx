import PageLegale from "@/components/PageLegale";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import { liensAlternatifs } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * Les mentions légales — loi pour la confiance dans l'économie numérique :
 * éditeur, directeur de la publication, hébergeur, contact. Écrites le
 * 14 septembre 2026 avec ce que Jérémy a donné ; le texte est dans le
 * dictionnaire (`mentions.*`), cf. `PageLegale`.
 */

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("mentions.metaTitre"), description: t("mentions.metaDescription"), alternates: liensAlternatifs(locale, "/mentions-legales") };
}

export default async function MentionsLegalesPage({ params }: Props) {
  const { locale } = await params;
  return (
    <PageLegale
      langue={locale}
      section="mentions"
      sections={[
        { cle: "editeur", n: 3 },
        { cle: "hebergeur", n: 1 },
        { cle: "independance", n: 2 },
        { cle: "propriete", n: 2 },
        { cle: "donnees", n: 1, lien: { href: "/confidentialite", libelle: "mentions.donneesLien" } },
      ]}
    />
  );
}
