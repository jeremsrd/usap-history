"use client";

import { useActionState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createCompetition, updateCompetition } from "./actions";
import type { CompetitionActionState } from "./actions";
import { COMPETITION_TYPES } from "@/lib/constants";

interface CompetitionData {
  id: string;
  name: string;
  shortName: string | null;
  type: string;
  isActive: boolean;
}

interface CompetitionFormProps {
  competition?: CompetitionData | null;
  onClose: () => void;
}

const initialState: CompetitionActionState = {};

export default function CompetitionForm({
  competition,
  onClose,
}: CompetitionFormProps) {
  const isEdit = !!competition;
  const action = isEdit ? updateCompetition : createCompetition;
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
            {isEdit ? "Modifier la compétition" : "Ajouter une compétition"}
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
          {isEdit && <input type="hidden" name="id" value={competition.id} />}

          {/* Nom */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Nom de la compétition *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={competition?.name ?? ""}
              placeholder="Top 14"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Nom court */}
          <div>
            <label
              htmlFor="shortName"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Nom court
            </label>
            <input
              id="shortName"
              name="shortName"
              type="text"
              defaultValue={competition?.shortName ?? ""}
              placeholder="Top 14"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Type *
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue={competition?.type ?? ""}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            >
              <option value="">— Choisir un type —</option>
              {Object.entries(COMPETITION_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Actif */}
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={competition?.isActive ?? true}
              className="h-4 w-4 rounded border-border text-usap-sang focus:ring-usap-sang"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-muted-foreground"
            >
              Compétition active
            </label>
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
