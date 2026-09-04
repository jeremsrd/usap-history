"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createVenue, updateVenue } from "./actions";
import type { VenueActionState } from "./actions";
import ImageUpload from "@/components/ui/ImageUpload";

interface CountryOption {
  id: string;
  name: string;
  code: string;
}

interface VenueData {
  id: string;
  name: string;
  city: string;
  countryId: string | null;
  capacity: number | null;
  yearOpened: number | null;
  latitude: number | null;
  longitude: number | null;
  isHomeGround: boolean;
  photoUrl: string | null;
  notes: string | null;
}

interface VenueFormProps {
  venue?: VenueData | null;
  countries: CountryOption[];
  onClose: () => void;
}

const initialState: VenueActionState = {};

export default function VenueForm({
  venue,
  countries,
  onClose,
}: VenueFormProps) {
  const isEdit = !!venue;
  const action = isEdit ? updateVenue : createVenue;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(venue?.photoUrl ?? null);

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
            {isEdit ? "Modifier le stade" : "Ajouter un stade"}
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
          {isEdit && <input type="hidden" name="id" value={venue.id} />}

          {/* Nom */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Nom du stade *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={venue?.name ?? ""}
              placeholder="Stade Aimé-Giral"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Ville + Pays */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="city"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Ville *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                defaultValue={venue?.city ?? ""}
                placeholder="Perpignan"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="countryId"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Pays
              </label>
              <select
                id="countryId"
                name="countryId"
                defaultValue={venue?.countryId ?? ""}
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

          {/* Capacité + Année d'ouverture */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="capacity"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Capacité
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={0}
                max={200000}
                defaultValue={venue?.capacity ?? ""}
                placeholder="14 500"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="yearOpened"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Année d&apos;ouverture
              </label>
              <input
                id="yearOpened"
                name="yearOpened"
                type="number"
                min={1800}
                max={2100}
                defaultValue={venue?.yearOpened ?? ""}
                placeholder="1937"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Coordonnées GPS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="latitude"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Latitude
              </label>
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={venue?.latitude ?? ""}
                placeholder="42.6976"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="longitude"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Longitude
              </label>
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={venue?.longitude ?? ""}
                placeholder="2.8954"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Photo */}
          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            folder="stades"
            label="Photo du stade"
            name="photoUrl"
          />

          {/* Stade de l'USAP */}
          <div className="flex items-center gap-2">
            <input
              id="isHomeGround"
              name="isHomeGround"
              type="checkbox"
              defaultChecked={venue?.isHomeGround ?? false}
              className="h-4 w-4 rounded border-border text-usap-sang focus:ring-usap-sang"
            />
            <label
              htmlFor="isHomeGround"
              className="text-sm font-medium text-muted-foreground"
            >
              Stade de l&apos;USAP (domicile)
            </label>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={venue?.notes ?? ""}
              placeholder="Informations complémentaires..."
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
