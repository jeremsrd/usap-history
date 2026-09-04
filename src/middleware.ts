import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { LANGUE_PAR_DEFAUT, estUneLangue } from "@/i18n/langues";

/**
 * Deux rôles, et l'ordre compte.
 *
 * **1. La langue est dans l'adresse.** Une visite sur `/joueurs` est renvoyée
 * sur `/fr/joueurs` : le segment de langue n'est pas facultatif, sans quoi le
 * site aurait deux adresses pour la même page et Google y verrait une copie.
 * La redirection est **temporaire** (307) — le jour où la langue par défaut se
 * négociera avec le navigateur, une 308 mise en cache serait un piège.
 *
 * **2. La session Supabase se rafraîchit sur l'admin**, ce que le middleware
 * faisait déjà. Il fallait seulement que son filtre suive l'admin dans son
 * nouveau chemin, `/fr/admin`.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const premier = pathname.split("/")[1] ?? "";

  if (!estUneLangue(premier)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${LANGUE_PAR_DEFAUT}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }

  if (pathname.split("/")[2] === "admin") return await updateSession(request);

  return NextResponse.next();
}

export const config = {
  // Tout, sauf ce qui n'est pas une page : les fichiers statiques, les images
  // optimisées, les routes d'API et le retour d'authentification Supabase.
  matcher: ["/((?!_next|api|auth|favicon.ico|images|.*\\.[a-z0-9]+$).*)"],
};
