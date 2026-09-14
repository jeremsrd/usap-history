import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * `/robots.txt`, depuis le 14 septembre 2026 — il rendait 404 en production.
 * Tout est ouvert sauf l'administration et la connexion, que leurs layouts
 * marquent déjà `noindex` : ici c'est la seconde couche, celle qui évite
 * même la visite. Le sitemap est déclaré, c'est par lui que les moteurs
 * trouvent les sept cents rencontres.
 *
 * Hors du segment `[locale]` à dessein : c'est un fichier, pas une page, et
 * le middleware laisse passer tout chemin à extension.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/fr/admin", "/ca/admin", "/fr/login", "/ca/login", "/api/", "/auth/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
