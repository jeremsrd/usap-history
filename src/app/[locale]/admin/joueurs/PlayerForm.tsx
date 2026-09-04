"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createPlayer, updatePlayer } from "./actions";
import type { PlayerActionState } from "./actions";
import { POSITIONS } from "@/lib/constants";
import ImageUpload from "@/components/ui/ImageUpload";

interface CountryOption {
  id: string;
  name: string;
  code: string;
}

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  birthCountryId: string | null;
  nationalityId: string | null;
  height: number | null;
  weight: number | null;
  photoUrl: string | null;
  biography: string | null;
  isActive: boolean;
}

interface PlayerFormProps {
  player?: PlayerData | null;
  countries: CountryOption[];
  onClose: () => void;
}

const initialState: PlayerActionState = {};

export default function PlayerForm({
  player,
  countries,
  onClose,
}: PlayerFormProps) {
  const isEdit = !!player;
  const action = isEdit ? updatePlayer : createPlayer;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    player?.photoUrl ?? null,
  );

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            {isEdit ? "Modifier le joueur" : "Ajouter un joueur"}
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
          {isEdit && <input type="hidden" name="id" value={player.id} />}

          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Prénom *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                defaultValue={player?.firstName ?? ""}
                placeholder="Nicolas"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Nom *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                defaultValue={player?.lastName ?? ""}
                placeholder="Mas"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Poste + Joueur actuel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="position"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Poste
              </label>
              <select
                id="position"
                name="position"
                defaultValue={player?.position ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              >
                <option value="">— Non renseigné —</option>
                {Object.entries(POSITIONS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.number}. {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  defaultChecked={player?.isActive ?? false}
                  className="h-4 w-4 rounded border-border text-usap-sang focus:ring-usap-sang"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Joueur actuellement à l&apos;USAP
                </label>
              </div>
            </div>
          </div>

          {/* Date de naissance + Date de décès */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="birthDate"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Date de naissance
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={player?.birthDate ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="deathDate"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Date de décès
              </label>
              <input
                id="deathDate"
                name="deathDate"
                type="date"
                defaultValue={player?.deathDate ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Lieu de naissance + Pays de naissance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="birthPlace"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Lieu de naissance
              </label>
              <input
                id="birthPlace"
                name="birthPlace"
                type="text"
                defaultValue={player?.birthPlace ?? ""}
                placeholder="Perpignan"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="birthCountryId"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Pays de naissance
              </label>
              <select
                id="birthCountryId"
                name="birthCountryId"
                defaultValue={player?.birthCountryId ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              >
                <option value="">— Non renseigné —</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nationalité */}
          <div>
            <label
              htmlFor="nationalityId"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Nationalité
            </label>
            <select
              id="nationalityId"
              name="nationalityId"
              defaultValue={player?.nationalityId ?? ""}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            >
              <option value="">— Non renseignée —</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Taille + Poids */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="height"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Taille (cm)
              </label>
              <input
                id="height"
                name="height"
                type="number"
                min={140}
                max={230}
                defaultValue={player?.height ?? ""}
                placeholder="185"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="weight"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Poids (kg)
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                min={50}
                max={200}
                defaultValue={player?.weight ?? ""}
                placeholder="95"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Photo */}
          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            folder="players"
            label="Photo du joueur"
            name="photoUrl"
          />

          {/* Biographie */}
          <div>
            <label
              htmlFor="biography"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Biographie
            </label>
            <textarea
              id="biography"
              name="biography"
              rows={4}
              defaultValue={player?.biography ?? ""}
              placeholder="Parcours, anecdotes, palmarès..."
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
