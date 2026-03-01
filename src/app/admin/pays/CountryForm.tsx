"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createCountry, updateCountry } from "./actions";
import type { CountryActionState } from "./actions";
import { CONTINENTS } from "@/lib/constants";
import { countryCodeToFlag } from "@/lib/utils";

interface CountryData {
  id: string;
  name: string;
  code: string;
  continent: string | null;
}

interface CountryFormProps {
  country?: CountryData | null;
  onClose: () => void;
}

const initialState: CountryActionState = {};

export default function CountryForm({ country, onClose }: CountryFormProps) {
  const isEdit = !!country;
  const action = isEdit ? updateCountry : createCountry;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState(country?.code ?? "");

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            {isEdit ? "Modifier le pays" : "Ajouter un pays"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={country.id} />}

          {/* Nom */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Nom du pays *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={country?.name ?? ""}
              placeholder="France"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Code ISO + aperçu drapeau */}
          <div>
            <label
              htmlFor="code"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Code ISO (2 lettres) *
            </label>
            <div className="flex items-center gap-3">
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={2}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="FR"
                className="w-full rounded-md border border-border bg-card px-3 py-2 uppercase text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
              {code.length === 2 && (
                <span className="text-3xl" title={code}>
                  {countryCodeToFlag(code)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Le drapeau sera généré automatiquement depuis le code ISO.
            </p>
          </div>

          {/* Continent */}
          <div>
            <label
              htmlFor="continent"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Continent
            </label>
            <select
              id="continent"
              name="continent"
              defaultValue={country?.continent ?? ""}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            >
              <option value="">— Non renseigné —</option>
              {Object.entries(CONTINENTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Erreur */}
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90 disabled:opacity-50"
            >
              {isPending
                ? "Enregistrement..."
                : isEdit
                  ? "Modifier"
                  : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
