import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LANGUES, estUneLangue, type Langue } from "@/i18n/langues";
import { notFound } from "next/navigation";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

  return (
    <html lang={langue} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
