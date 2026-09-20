import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LANGUES, estUneLangue, type Langue } from "@/i18n/langues";
import { dictionnaire } from "@/i18n/dictionnaire";
import { NAV_LINKS } from "@/lib/constants";
import { SITE_URL } from "@/lib/seo";
import { notFound } from "next/navigation";
import "../globals.css";

/**
 * **Une seule famille, sur son axe de largeur.** Archivo va de 62 à 125 % de
 * chasse : très condensée et noire, c'est la voix des titres et des repères,
 * à la manière d'un dos de maillot ; à sa largeur normale, celle du corps et
 * des tableaux. Deux voix nettement distinctes pour un seul chargement — et
 * plus de Geist, la police par défaut de Next.js, qui disait « starter jamais
 * thémé » à qui sait la reconnaître.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  // L'adresse du site, dont Next.js a besoin pour résoudre toute métadonnée
  // écrite en relatif. Les `hreflang`, eux, sont absolus par construction
  // (cf. `lib/seo.ts`) : la balise n'accepte rien d'autre.
  metadataBase: new URL(SITE_URL),
  title: "USAP Historia - L'histoire de l'USA Perpignan depuis 1902",
  description:
    "USAP Historia — Base de données historique complète de l'USA Perpignan : matchs, joueurs, saisons et statistiques du club catalan depuis 1902.",
  keywords: [
    "USAP",
    "USA Perpignan",
    "rugby",
    "histoire",
    "Perpignan",
    "Top 14",
    "sang et or",
  ],
};

/**
 * Les deux langues sont pré-rendues, et une adresse comme `/es/joueurs` rend
 * 404, non un repli silencieux sur le français — une langue qu'on n'a pas ne
 * s'invente pas plus qu'un score. C'est le `notFound()` du layout qui le
 * garantit, pas `dynamicParams`.
 *
 * **`dynamicParams` a été à `false` jusqu'au 20 septembre 2026**, et c'est ce
 * qui a empêché les fiches d'entrer en cache le jour où les pages ont quitté
 * `force-dynamic` : ce réglage redescend sur les segments `[slug]`, dont les
 * pages n'ont pas de `generateStaticParams` — et une fiche demandée à
 * l'improviste répondait alors 404, cache compris, quoi que la page déclare.
 * Il vaut `true` désormais, ce qui est la valeur par défaut, et le layout
 * n'a rien perdu : une langue inconnue tombe sur `notFound()` trois lignes
 * plus bas.
 */
export function generateStaticParams() {
  return LANGUES.map((locale) => ({ locale }));
}

export const dynamicParams = true;

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!estUneLangue(locale)) notFound();
  const langue: Langue = locale;
  const t = await dictionnaire(langue);

  // Les libellés du menu, résolus ici : le Header est un composant client.
  const libelles: Record<string, string> = {
    "nav.logo": t("nav.logo"),
    "nav.explorer": t("nav.explorer"),
    "nav.menu": t("nav.menu"),
    "nav.fermer": t("nav.fermer"),
    "langue.choisir": t("langue.choisir"),
    "theme.versClair": t("theme.versClair"),
    "theme.versSombre": t("theme.versSombre"),
    ...Object.fromEntries(NAV_LINKS.map((l) => [l.cle, t(l.cle)])),
  };

  return (
    <html lang={langue} suppressHydrationWarning>
      <body
        className={`${archivo.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header libelles={libelles} />
            <main className="flex-1">{children}</main>
            <Footer langue={langue} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
