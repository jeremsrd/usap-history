"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createSeason, updateSeason } from "./actions";
import type { SeasonActionState } from "./actions";
import { DIVISIONS } from "@/lib/constants";

interface SeasonData {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  division: string;
}

interface SeasonFormProps {
  season?: SeasonData | null;
  onClose: () => void;
}

const initialState: SeasonActionState = {};

export default function SeasonForm({ season, onClose }: SeasonFormProps) {
  const isEdit = !!season;
  const action = isEdit ? updateSeason : createSeason;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(season?.startYear ?? currentYear);

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
            {isEdit ? "Modifier la saison" : "Ajouter une saison"}
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
          {isEdit && <input type="hidden" name="id" value={season.id} />}

          {/* Années */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startYear"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Année de début *
              </label>
              <input
                id="startYear"
                name="startYear"
                type="number"
                required
                min={1902}
                max={2100}
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value, 10) || currentYear)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="endYear"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Année de fin *
              </label>
              <input
                id="endYear"
                name="endYear"
                type="number"
                required
                value={startYear + 1}
                readOnly
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground"
              />
            </div>
          </div>
          {startYear >= 1902 && (
            <p className="text-sm font-medium text-usap-sang">
              Saison {startYear}-{startYear + 1}
            </p>
          )}

          {/* Division */}
          <div>
            <label
              htmlFor="division"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Division *
            </label>
            <select
              id="division"
              name="division"
              required
              defaultValue={season?.division ?? ""}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            >
              <option value="">— Choisir une division —</option>
              {Object.entries(DIVISIONS).map(([value, label]) => (
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
