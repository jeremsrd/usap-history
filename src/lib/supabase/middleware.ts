import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LANGUE_PAR_DEFAUT, estUneLangue } from "@/i18n/langues";

/**
 * La session Supabase, rafraîchie — et **le garde de l'admin**.
 *
 * **IL NE S'ACTIVAIT PLUS, ET RIEN NE LE DISAIT.** Il testait
 * `pathname.startsWith("/admin")`, ce qui était juste jusqu'au 4 septembre
 * 2026 ; depuis que la langue est dans l'adresse, le chemin réel est
 * `/fr/admin`, et le test valait `false` sur toutes les requêtes. Repéré le
 * 9 septembre 2026.
 *
 * **Aucune page n'était pour autant ouverte** : les douze pages d'admin et
 * leurs douze modules d'actions appellent chacun `auth.getUser()` avant de
 * lire ou d'écrire, et c'est eux qui protégeaient réellement. Ce qui avait
 * disparu, c'est la **seconde couche** — celle qui rattrape une page ajoutée
 * sans son garde. Une défense en profondeur qui ne se déclenche jamais ne
 * protège de rien, et son silence est le pire de ses défauts.
 *
 * Le segment de langue est désormais lu, et la redirection le porte : elle
 * envoyait vers `/login`, que le middleware renvoyait ensuite vers
 * `/fr/login`, en deux sauts au lieu d'un.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // L'admin vit sous la langue — « /fr/admin » —, et le premier segment est
  // testé aussi, au cas où la requête arriverait sans préfixe.
  const segments = request.nextUrl.pathname.split("/");
  const langue = estUneLangue(segments[1] ?? "") ? segments[1] : LANGUE_PAR_DEFAUT;
  const surLAdmin = segments[1] === "admin" || segments[2] === "admin";

  if (surLAdmin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${langue}/login`;
    // La page de connexion ne lit pas encore ce paramètre — elle renvoie
    // toujours sur l'accueil de l'admin —, mais il coûte peu et dit où l'on
    // allait.
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
