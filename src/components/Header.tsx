"use client";

import { useState, useRef, useEffect } from "react";
import Link from "@/components/Lien";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_LINKS_MAIN, NAV_LINKS_MORE } from "@/lib/constants";
import { cheminSansLangue } from "@/i18n/langues";
import SelecteurLangue from "@/components/SelecteurLangue";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Les libellés viennent du serveur : le Header est un composant client, et le
 * dictionnaire n'a pas à partir dans le navigateur pour trois mots de menu.
 *
 * **L'ADMINISTRATION N'A PLUS DE LIEN ICI**, depuis le 9 septembre 2026. Une
 * roue dentée y figurait, en bureau et en mobile, donc sur chaque page du
 * site. Ce n'est pas une mesure de sécurité — l'admin est gardé page par page
 * et action par action, et le cacher ne protégerait rien. C'est que ce lien
 * ne sert qu'à une personne, et qu'il rendait l'admin et la connexion
 * **découvrables depuis toutes les pages** : les robots les suivaient. Jérémy
 * connaît l'adresse, `/admin` y mène toujours.
 */
export default function Header({ libelles }: { libelles: Record<string, string> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // **Le chemin porte la langue, les liens non.** Sans ce retrait, aucun lien
  // du menu ne paraîtrait actif depuis que les adresses sont préfixées.
  const pathname = cheminSansLangue(usePathname());
  const moreRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown "Explorer" quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fermer le dropdown quand la route change
  useEffect(() => {
    setMoreOpen(false);
    setIsOpen(false);
  }, [pathname]);

  // Un lien "More" est-il actif ?
  const moreIsActive = NAV_LINKS_MORE.some(
    (link) => pathname === link.href || pathname.startsWith(link.href + "/"),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-usap-fond/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/usap/logo.png"
            alt={libelles["nav.logo"]}
            width={32}
            height={32}
            className="h-8 w-8"
          />
          {/* Le nom du site dans la voix condensée d'Archivo, comme les
              titres : à sa largeur normale il débordait sur le sélecteur de
              langue en mobile. */}
          <span className="font-display text-2xl uppercase text-usap-sang">
            USAP
          </span>
          <span className="font-display text-2xl uppercase text-usap-or">
            Historia
          </span>
        </Link>

        {/* Navigation desktop + theme toggle */}
        <div className="hidden items-center gap-1 md:flex">
          <nav className="flex items-center gap-1">
            {/* Liens principaux */}
            {NAV_LINKS_MAIN.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href + "/"))
                    ? "bg-usap-sang/20 text-usap-sang"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {libelles[link.cle]}
              </Link>
            ))}

            {/* Dropdown "Explorer" */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  moreIsActive
                    ? "bg-usap-sang/20 text-usap-sang"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {libelles["nav.explorer"]}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    moreOpen && "rotate-180",
                  )}
                />
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-usap-fond shadow-lg">
                  <div className="py-1">
                    {NAV_LINKS_MORE.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors",
                          pathname === link.href ||
                            pathname.startsWith(link.href + "/")
                            ? "bg-usap-sang/10 text-usap-sang"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {libelles[link.cle]}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Langue + thème. L'administration n'a pas de lien, cf. l'en-tête. */}
          <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
            <SelecteurLangue titre={libelles["langue.choisir"]} />
            <ThemeToggle libelles={libelles} />
          </div>
        </div>

        {/* Mobile: langue + theme toggle + burger */}
        <div className="flex items-center gap-1 md:hidden">
          <SelecteurLangue titre={libelles["langue.choisir"]} />
          <ThemeToggle libelles={libelles} />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={isOpen ? libelles["nav.fermer"] : libelles["nav.menu"]}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <nav className="border-t border-border px-4 py-2 md:hidden">
          {/* Liens principaux */}
          {NAV_LINKS_MAIN.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href + "/"))
                  ? "bg-usap-sang/20 text-usap-sang"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {libelles[link.cle]}
            </Link>
          ))}

          {/* Séparateur + Explorer */}
          <div className="my-2 border-t border-border" />
          <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {libelles["nav.explorer"]}
          </div>
          {NAV_LINKS_MORE.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href ||
                  pathname.startsWith(link.href + "/")
                  ? "bg-usap-sang/20 text-usap-sang"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {libelles[link.cle]}
            </Link>
          ))}

        </nav>
      )}
    </header>
  );
}
