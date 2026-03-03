"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { addMatchEvent, removeMatchEvent } from "./actions";
import type { ActionResult } from "./actions";

// --- Types ---

interface PlayerOption {
  id: string;
  firstName: string;
  lastName: string;
  isOpponent?: boolean;
}

interface MatchEventData {
  id: string;
  minute: number;
  type: string;
  isUsap: boolean;
  description: string | null;
  playerId: string | null;
}

interface MatchEventManagerProps {
  matchId: string;
  matchEvents: MatchEventData[];
  matchPlayers: PlayerOption[];
}

// --- Config ---

const EVENT_LABELS: Record<string, string> = {
  ESSAI: "Essai",
  TRANSFORMATION: "Transformation",
  PENALITE: "Pénalité",
  DROP: "Drop",
  ESSAI_PENALITE: "Essai de pénalité",
  CARTON_JAUNE: "Carton jaune",
  CARTON_ROUGE: "Carton rouge",
  REMPLACEMENT_ENTREE: "Remplacement (entrée)",
  REMPLACEMENT_SORTIE: "Remplacement (sortie)",
};

const EVENT_ICONS: Record<string, string> = {
  ESSAI: "5",
  TRANSFORMATION: "2",
  PENALITE: "3",
  DROP: "3",
  ESSAI_PENALITE: "5",
  CARTON_JAUNE: "🟨",
  CARTON_ROUGE: "🟥",
  REMPLACEMENT_ENTREE: "↑",
  REMPLACEMENT_SORTIE: "↓",
};

const EVENT_STYLES: Record<string, string> = {
  ESSAI: "bg-usap-or/10 text-usap-or border-usap-or/30",
  TRANSFORMATION: "bg-green-500/10 text-green-600 border-green-500/30",
  PENALITE: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  DROP: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  ESSAI_PENALITE: "bg-usap-or/10 text-usap-or border-usap-or/30",
  CARTON_JAUNE: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  CARTON_ROUGE: "bg-red-500/10 text-red-600 border-red-500/30",
  REMPLACEMENT_ENTREE: "bg-muted text-muted-foreground border-border",
  REMPLACEMENT_SORTIE: "bg-muted text-muted-foreground border-border",
};

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang";

// --- Sub-components ---

function AddEventForm({
  matchId,
  matchPlayers,
  onClose,
}: {
  matchId: string;
  matchPlayers: PlayerOption[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(addMatchEvent, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  return (
    <div className="rounded-lg border border-border bg-usap-carte p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Ajouter un événement
        </h4>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="matchId" value={matchId} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Minute */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Minute *
            </label>
            <input
              name="minute"
              type="number"
              required
              min={0}
              max={120}
              placeholder="23"
              className={inputClass}
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Type *
            </label>
            <select name="type" required className={inputClass}>
              <option value="">-- Type --</option>
              {Object.entries(EVENT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* USAP / Adversaire */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Équipe
            </label>
            <select name="isUsap" className={inputClass}>
              <option value="true">USAP</option>
              <option value="false">Adversaire</option>
            </select>
          </div>

          {/* Joueur */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Joueur
            </label>
            <select name="playerId" className={inputClass}>
              <option value="">— Aucun —</option>
              {matchPlayers.filter((p) => !p.isOpponent).length > 0 && (
                <optgroup label="USAP">
                  {matchPlayers
                    .filter((p) => !p.isOpponent)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                </optgroup>
              )}
              {matchPlayers.filter((p) => p.isOpponent).length > 0 && (
                <optgroup label="Adversaire">
                  {matchPlayers
                    .filter((p) => p.isOpponent)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Description (optionnel)
          </label>
          <input
            name="description"
            type="text"
            placeholder="Ex: essai en coin après mêlée"
            className={inputClass}
          />
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90 disabled:opacity-50"
          >
            {isPending ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EventRow({
  event,
  matchId,
  matchPlayers,
}: {
  event: MatchEventData;
  matchId: string;
  matchPlayers: PlayerOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const player = event.playerId
    ? matchPlayers.find((p) => p.id === event.playerId)
    : null;

  function handleRemove() {
    if (!confirm("Supprimer cet événement ?")) return;
    startTransition(async () => {
      await removeMatchEvent(event.id, matchId);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-3 py-2 ${EVENT_STYLES[event.type] ?? "bg-muted text-muted-foreground border-border"}`}
    >
      {/* Minute */}
      <span className="w-10 shrink-0 text-center text-sm font-bold">
        {event.minute}&apos;
      </span>

      {/* Icon */}
      <span className="w-6 shrink-0 text-center text-sm font-bold">
        {EVENT_ICONS[event.type] ?? "?"}
      </span>

      {/* Equipe */}
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
          event.isUsap
            ? "bg-usap-sang/10 text-usap-sang"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {event.isUsap ? "USAP" : "ADV"}
      </span>

      {/* Type + Joueur + Description */}
      <div className="flex-1 text-sm">
        <span className="font-medium">
          {EVENT_LABELS[event.type] ?? event.type}
        </span>
        {player && (
          <span className="ml-1.5 text-foreground">
            — {player.firstName} {player.lastName}
          </span>
        )}
        {event.description && (
          <span className="ml-1.5 text-muted-foreground">
            ({event.description})
          </span>
        )}
      </div>

      {/* Supprimer */}
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// --- Main Component ---

export default function MatchEventManager({
  matchId,
  matchEvents,
  matchPlayers,
}: MatchEventManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Trier par minute
  const sortedEvents = [...matchEvents].sort((a, b) => a.minute - b.minute);

  // Stats résumé
  const usapEvents = sortedEvents.filter((e) => e.isUsap);
  const oppEvents = sortedEvents.filter((e) => !e.isUsap);
  const usapTries =
    usapEvents.filter((e) => e.type === "ESSAI" || e.type === "ESSAI_PENALITE")
      .length;
  const oppTries =
    oppEvents.filter((e) => e.type === "ESSAI" || e.type === "ESSAI_PENALITE")
      .length;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">
            Événements du match
          </h3>
          <p className="text-sm text-muted-foreground">
            {sortedEvents.length} événement
            {sortedEvents.length > 1 ? "s" : ""}{" "}
            {usapTries > 0 || oppTries > 0
              ? `(Essais : USAP ${usapTries} - ${oppTries} ADV)`
              : ""}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-md bg-usap-sang px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90"
          >
            <Plus size={16} />
            Ajouter
          </button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="mb-4">
          <AddEventForm
            matchId={matchId}
            matchPlayers={matchPlayers}
            onClose={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Timeline */}
      {sortedEvents.length === 0 ? (
        <div className="rounded-lg border border-border bg-usap-carte p-8 text-center">
          <p className="text-muted-foreground">
            Aucun événement enregistré pour ce match.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              matchId={matchId}
              matchPlayers={matchPlayers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
