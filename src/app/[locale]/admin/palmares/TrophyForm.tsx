"use client";

import { useActionState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createTrophy, updateTrophy } from "./actions";
import type { TrophyActionState } from "./actions";

const ACHIEVEMENT_LABELS: Record<string, string> = {
  CHAMPION: "Champion",
  FINALISTE: "Finaliste",
  DEMI_FINALISTE: "Demi-finaliste",
  QUART_FINALISTE: "Quart de finaliste",
  VAINQUEUR_COUPE: "Vainqueur de coupe",
  FINALISTE_COUPE: "Finaliste de coupe",
};

interface TrophyData {
  id: string;
  year: number;
  competition: string;
  achievement: string;
  opponent: string | null;
  score: string | null;
  venue: string | null;
  details: string | null;
}

interface TrophyFormProps {
  trophy?: TrophyData | null;
  onClose: () => void;
}

const initialState: TrophyActionState = {};

export default function TrophyForm({ trophy, onClose }: TrophyFormProps) {
  const isEdit = !!trophy;
  const action = isEdit ? updateTrophy : createTrophy;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            {isEdit ? "Modifier le trophée" : "Ajouter un trophée"}
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
          {isEdit && <input type="hidden" name="id" value={trophy.id} />}

          {/* Année */}
          <div>
            <label
              htmlFor="year"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Année *
            </label>
            <input
              id="year"
              name="year"
              type="number"
              required
              min={1900}
              max={2100}
              defaultValue={trophy?.year ?? ""}
              placeholder="2009"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Compétition */}
          <div>
            <label
              htmlFor="competition"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Compétition *
            </label>
            <input
              id="competition"
              name="competition"
              type="text"
              required
              defaultValue={trophy?.competition ?? ""}
              placeholder="Championnat de France"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Résultat */}
          <div>
            <label
              htmlFor="achievement"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Résultat *
            </label>
            <select
              id="achievement"
              name="achievement"
              required
              defaultValue={trophy?.achievement ?? ""}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            >
              <option value="">— Choisir —</option>
              {Object.entries(ACHIEVEMENT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Adversaire */}
          <div>
            <label
              htmlFor="opponent"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Adversaire (finale)
            </label>
            <input
              id="opponent"
              name="opponent"
              type="text"
              defaultValue={trophy?.opponent ?? ""}
              placeholder="Stade Toulousain"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Score */}
          <div>
            <label
              htmlFor="score"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Score
            </label>
            <input
              id="score"
              name="score"
              type="text"
              defaultValue={trophy?.score ?? ""}
              placeholder="22 - 13"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Lieu */}
          <div>
            <label
              htmlFor="venue"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Lieu
            </label>
            <input
              id="venue"
              name="venue"
              type="text"
              defaultValue={trophy?.venue ?? ""}
              placeholder="Stade de France, Paris"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Détails */}
          <div>
            <label
              htmlFor="details"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Détails
            </label>
            <textarea
              id="details"
              name="details"
              rows={3}
              defaultValue={trophy?.details ?? ""}
              placeholder="Contexte, anecdotes..."
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
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
