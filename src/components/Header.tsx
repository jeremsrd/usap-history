"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Settings, X } from "lucide-react";
import { NAV_LINKS, NAV_LINKS_MAIN, NAV_LINKS_MORE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
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
          <span className="text-xl font-bold uppercase tracking-wider text-usap-sang">
            USAP
          </span>
          <span className="text-xl font-bold uppercase tracking-wider text-usap-or">
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
                {link.label}
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
                Explorer
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
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Admin + theme toggle */}
          <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
            <Link
              href="/admin"
              className={cn(
                "rounded-md p-2 transition-colors",
                pathname.startsWith("/admin")
                  ? "text-usap-sang"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              title="Administration"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: theme toggle + burger */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
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
              {link.label}
            </Link>
          ))}

          {/* Séparateur + Explorer */}
          <div className="my-2 border-t border-border" />
          <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explorer
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
              {link.label}
            </Link>
          ))}

          {/* Admin */}
          <div className="my-2 border-t border-border" />
          <Link
            href="/admin"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-usap-sang/20 text-usap-sang"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Settings className="h-4 w-4" />
            Administration
          </Link>
        </nav>
      )}
    </header>
  );
}
