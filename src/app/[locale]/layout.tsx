import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LANGUE_PAR_DEFAUT, LANGUES, estUneLangue, type Langue } from "@/i18n/langues";
import { dictionnaire } from "@/i18n/dictionnaire";
import { NAV_LINKS } from "@/lib/constants";
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
 * Les deux langues sont pré-rendues. `dynamicParams` reste à `false` : une
 * adresse comme `/es/joueurs` doit rendre 404, non se rabattre en silence sur
 * le français — une langue qu'on n'a pas ne s'invente pas plus qu'un score.
 */
export function generateStaticParams() {
  return LANGUES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

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
    "nav.admin": t("nav.admin"),
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
            {/* **Une langue offerte mais pas encore traduite doit le dire.**
                Sans ce bandeau, le sélecteur promettrait du catalan et rendrait
                du français, ce qui vaut moins que pas de sélecteur du tout. */}
            {langue !== LANGUE_PAR_DEFAUT && (
              <p className="border-b border-border bg-usap-or/10 px-4 py-2 text-center text-sm text-foreground">
                {t("langue.nonTraduit")}
              </p>
            )}
            <main className="flex-1">{children}</main>
            <Footer mention={t("pied.mention")} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
