"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(
        "Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.",
      );
      setMode("login");
      setLoading(false);
      return;
    }

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
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-usap-sang px-4 py-2 font-medium text-white transition-colors hover:bg-usap-sang/90 disabled:opacity-50"
          >
            {loading
              ? "Chargement..."
              : mode === "login"
                ? "Se connecter"
                : "Créer le compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-usap-sang hover:underline"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-usap-sang hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
