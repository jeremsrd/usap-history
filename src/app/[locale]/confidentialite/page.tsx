import PageLegale from "@/components/PageLegale";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import { liensAlternatifs } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * La politique de confidentialité — RGPD. Ce que le site collecte de ses
 * visiteurs, c'est-à-dire rien, vérifié le 14 septembre 2026 : aucun
 * traceur, aucun cookie hors la session de l'administrateur ; et ce qu'il
 * publie sur les joueurs, avec les droits de chacun. Le texte est dans le
 * dictionnaire (`confidentialite.*`), cf. `PageLegale`.
 */

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("confidentialite.metaTitre"), description: t("confidentialite.metaDescription"), alternates: liensAlternatifs(locale, "/confidentialite") };
}

export default async function ConfidentialitePage({ params }: Props) {
  const { locale } = await params;
  return (
    <PageLegale langue={locale} section="confidentialite" sections={[{ cle: "visiteurs", n: 3 }, { cle: "admin", n: 1 }, { cle: "joueurs", n: 3 }, { cle: "droits", n: 2 }, { cle: "miseAJour", n: 1 }]} />
  );
}
