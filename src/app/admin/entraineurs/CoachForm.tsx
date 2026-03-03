"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createCoach, updateCoach } from "./actions";
import type { CoachActionState } from "./actions";
import ImageUpload from "@/components/ui/ImageUpload";

interface CoachData {
  id: string;
  firstName: string;
  lastName: string;
  role: string | null;
  photoUrl: string | null;
  biography: string | null;
}

interface CoachFormProps {
  coach?: CoachData | null;
  onClose: () => void;
}

const initialState: CoachActionState = {};

export default function CoachForm({ coach, onClose }: CoachFormProps) {
  const isEdit = !!coach;
  const action = isEdit ? updateCoach : createCoach;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    coach?.photoUrl ?? null,
  );

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            {isEdit ? "Modifier l'entraîneur" : "Ajouter un entraîneur"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={coach.id} />}

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
                defaultValue={coach?.firstName ?? ""}
                placeholder="Jacques"
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
                defaultValue={coach?.lastName ?? ""}
                placeholder="Brunel"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-muted-foreground"
            >
              Rôle
            </label>
            <input
              id="role"
              name="role"
              type="text"
              defaultValue={coach?.role ?? ""}
              placeholder="Entraîneur principal"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            folder="coaches"
            label="Photo"
            name="photoUrl"
          />

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
              defaultValue={coach?.biography ?? ""}
              placeholder="Parcours et faits marquants..."
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

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
