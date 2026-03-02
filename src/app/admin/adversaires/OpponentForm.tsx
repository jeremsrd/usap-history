"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createOpponent, updateOpponent } from "./actions";
import type { OpponentActionState } from "./actions";
import ImageUpload from "@/components/ui/ImageUpload";

interface CountryOption {
  id: string;
  name: string;
  code: string;
}

interface VenueOption {
  id: string;
  name: string;
  city: string;
}

interface OpponentData {
  id: string;
  name: string;
  shortName: string | null;
  officialName: string | null;
  city: string | null;
  countryId: string | null;
  venueId: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  isActive: boolean;
  notes: string | null;
}

interface OpponentFormProps {
  opponent?: OpponentData | null;
  countries: CountryOption[];
  venues: VenueOption[];
  onClose: () => void;
}

const initialState: OpponentActionState = {};

export default function OpponentForm({
  opponent,
  countries,
  venues,
  onClose,
}: OpponentFormProps) {
  const isEdit = !!opponent;
  const action = isEdit ? updateOpponent : createOpponent;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(opponent?.logoUrl ?? null);

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
            {isEdit ? "Modifier l'adversaire" : "Ajouter un adversaire"}
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
          {isEdit && <input type="hidden" name="id" value={opponent.id} />}

          {/* Nom */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Nom du club *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={opponent?.name ?? ""}
              placeholder="Stade Toulousain"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {/* Nom court + Nom officiel */}
          <div className="grid grid-cols-2 gap-4">
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
                defaultValue={opponent?.shortName ?? ""}
                placeholder="Toulouse"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="officialName"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Nom officiel
              </label>
              <input
                id="officialName"
                name="officialName"
                type="text"
                defaultValue={opponent?.officialName ?? ""}
                placeholder="Stade Toulousain Rugby"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Ville + Pays */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="city"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Ville
              </label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={opponent?.city ?? ""}
                placeholder="Toulouse"
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
                defaultValue={opponent?.countryId ?? ""}
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

          {/* Stade + Année de fondation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="venueId"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Stade
              </label>
              <select
                id="venueId"
                name="venueId"
                defaultValue={opponent?.venueId ?? ""}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              >
                <option value="">— Non renseigné —</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="foundedYear"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Année de fondation
              </label>
              <input
                id="foundedYear"
                name="foundedYear"
                type="number"
                min={1800}
                max={2100}
                defaultValue={opponent?.foundedYear ?? ""}
                placeholder="1907"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Logo */}
          <ImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            folder="logos"
            label="Logo du club"
          />

          {/* Liens web */}
          <div>
            <label
              htmlFor="websiteUrl"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Site internet
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={opponent?.websiteUrl ?? ""}
              placeholder="https://www.stadetoulousain.fr"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="facebookUrl"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Facebook
              </label>
              <input
                id="facebookUrl"
                name="facebookUrl"
                type="url"
                defaultValue={opponent?.facebookUrl ?? ""}
                placeholder="https://facebook.com/..."
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
            <div>
              <label
                htmlFor="instagramUrl"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Instagram
              </label>
              <input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                defaultValue={opponent?.instagramUrl ?? ""}
                placeholder="https://instagram.com/..."
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          {/* Actif */}
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={opponent?.isActive ?? true}
              className="h-4 w-4 rounded border-border text-usap-sang focus:ring-usap-sang"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-muted-foreground"
            >
              Club en activité
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
              defaultValue={opponent?.notes ?? ""}
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
