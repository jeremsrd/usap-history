"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * La connexion à l'administration.
 *
 * **LE MODE INSCRIPTION A ÉTÉ RETIRÉ**, le 9 septembre 2026, sur décision de
 * Jérémy et le même jour que la création d'administrateur d'office. La page
 * offrait un « Créer un compte » qui appelait `supabase.auth.signUp` : sur un
 * site dont l'administration compte un seul homme, c'était une porte sans
 * usage. Elle ne donnait aucun droit — un compte neuf n'a pas de ligne dans
 * `users`, et le garde de l'admin le renvoie à l'accueil —, mais elle
 * invitait à en créer.
 *
 * **CE RETRAIT NE FERME PAS L'INSCRIPTION, IL LA CACHE.** La clé publique de
 * Supabase est dans le navigateur, et `signUp` reste appelable sans passer
 * par cette page. Ce qui ferme réellement la porte est un réglage du projet
 * Supabase, « Allow new users to sign up », à décocher dans
 * Authentication → Sign In / Providers. Le dire plutôt que de laisser croire
 * qu'un formulaire retiré suffit : c'est la même erreur que renommer
 * `/login`, écartée le même jour.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold uppercase tracking-wider">
          <span className="text-usap-sang">Admin</span>{" "}
          <span className="text-usap-or">USAP Historia</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              placeholder="admin@usap-historia.fr"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-usap-sang px-4 py-2 font-medium text-white transition-colors hover:bg-usap-sang/90 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
