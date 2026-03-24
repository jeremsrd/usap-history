"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { addMatchPlayer, updateMatchPlayer, removeMatchPlayer } from "./actions";
import type { ActionResult } from "./actions";
import { POSITIONS } from "@/lib/constants";

// --- Types ---

interface PlayerOption {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
}

interface MatchPlayerData {
  id: string;
  shirtNumber: number | null;
  isStarter: boolean;
  isCaptain: boolean;
  positionPlayed: string | null;
  minutesPlayed: number | null;
  tries: number;
  conversions: number;
  penalties: number;
  dropGoals: number;
  totalPoints: number;
  yellowCard: boolean;
  yellowCardMin: number | null;
  redCard: boolean;
  redCardMin: number | null;
  orangeCard: boolean;
  orangeCardMin: number | null;
  whiteCard: boolean;
  whiteCardMin: number | null;
  subIn: number | null;
  subOut: number | null;
  opponentPlayerName: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
  } | null;
}

interface MatchPlayerManagerProps {
  matchId: string;
  matchPlayers: MatchPlayerData[];
  allPlayers: PlayerOption[];
  isOpponent?: boolean;
  teamLabel?: string;
}

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang";

const initialState: ActionResult = {};

// --- Component ---

export default function MatchPlayerManager({
  matchId,
  matchPlayers,
  allPlayers,
  isOpponent = false,
  teamLabel = "USAP",
}: MatchPlayerManagerProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [playerSearch, setPlayerSearch] = useState("");

  const starters = matchPlayers
    .filter((p) => p.isStarter)
    .sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99));
  const subs = matchPlayers
    .filter((p) => !p.isStarter)
    .sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99));

  // Joueurs pas encore dans la compo
  const existingPlayerIds = new Set(matchPlayers.filter((p) => p.player).map((p) => p.player!.id));
  const availablePlayers = allPlayers.filter(
    (p) => !existingPlayerIds.has(p.id),
  );

  const filteredAvailable = availablePlayers.filter((p) => {
    const q = playerSearch.toLowerCase();
    return (
      !q ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)
    );
  });

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeMatchPlayer(id, matchId);
      router.refresh();
    });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
          {teamLabel}{" "}
          <span className="text-muted-foreground">({matchPlayers.length})</span>
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-white ${
            isOpponent
              ? "bg-muted-foreground hover:bg-muted-foreground/80"
              : "bg-usap-sang hover:bg-usap-sang/90"
          }`}
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <AddPlayerForm
          matchId={matchId}
          availablePlayers={filteredAvailable}
          playerSearch={playerSearch}
          onSearchChange={setPlayerSearch}
          isOpponent={isOpponent}
          onClose={() => {
            setShowAddForm(false);
            setPlayerSearch("");
            router.refresh();
          }}
        />
      )}

      {/* Titulaires */}
      {starters.length > 0 && (
        <div className="mb-4">
          <h3 className={`mb-2 text-sm font-semibold uppercase ${isOpponent ? "text-muted-foreground" : "text-usap-sang"}`}>
            Titulaires ({starters.length})
          </h3>
          <div className="space-y-1">
            {starters.map((mp) => (
              <PlayerRow
                key={mp.id}
                mp={mp}
                matchId={matchId}
                isEditing={editingId === mp.id}
                isOpponent={isOpponent}
                onEdit={() =>
                  setEditingId(editingId === mp.id ? null : mp.id)
                }
                onRemove={() => handleRemove(mp.id)}
                onCloseEdit={() => {
                  setEditingId(null);
                  router.refresh();
                }}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Remplaçants */}
      {subs.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
            Remplaçants ({subs.length})
          </h3>
          <div className="space-y-1">
            {subs.map((mp) => (
              <PlayerRow
                key={mp.id}
                mp={mp}
                matchId={matchId}
                isEditing={editingId === mp.id}
                isOpponent={isOpponent}
                onEdit={() =>
                  setEditingId(editingId === mp.id ? null : mp.id)
                }
                onRemove={() => handleRemove(mp.id)}
                onCloseEdit={() => {
                  setEditingId(null);
                  router.refresh();
                }}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}

      {matchPlayers.length === 0 && !showAddForm && (
        <p className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Aucun joueur dans la composition. Cliquez sur &quot;Ajouter&quot; pour
          commencer.
        </p>
      )}
    </section>
  );
}

// --- Sous-composants ---

function AddPlayerForm({
  matchId,
  availablePlayers,
  playerSearch,
  onSearchChange,
  isOpponent,
  onClose,
}: {
  matchId: string;
  availablePlayers: PlayerOption[];
  playerSearch: string;
  onSearchChange: (v: string) => void;
  isOpponent: boolean;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    addMatchPlayer,
    initialState,
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="mb-4 rounded-lg border border-border bg-usap-carte p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Ajouter un joueur
        </h4>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="matchId" value={matchId} />
        {isOpponent && (
          <input type="hidden" name="isOpponent" value="true" />
        )}

        {/* Recherche + Select joueur */}
        <div>
          <input
            type="text"
            value={playerSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un joueur..."
            className={inputClass}
          />
        </div>
        <div>
          <select name="playerId" required className={inputClass}>
            <option value="">— Choisir un joueur —</option>
            {availablePlayers.slice(0, 50).map((p) => (
              <option key={p.id} value={p.id}>
                {p.lastName} {p.firstName}
                {p.position ? ` (${POSITIONS[p.position]?.label ?? p.position})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Numéro + Titulaire + Capitaine */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              N°
            </label>
            <input
              name="shirtNumber"
              type="number"
              min={1}
              max={23}
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Statut
            </label>
            <select name="isStarter" className={inputClass}>
              <option value="true">Titulaire</option>
              <option value="false">Remplaçant</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Poste joué
            </label>
            <select name="positionPlayed" className={inputClass}>
              <option value="">—</option>
              {Object.entries(POSITIONS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                name="isCaptain"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-usap-sang"
              />
              Capitaine
            </label>
          </div>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white hover:bg-usap-sang/90 disabled:opacity-50"
        >
          {isPending ? "Ajout..." : "Ajouter à la composition"}
        </button>
      </form>
    </div>
  );
}

function PlayerRow({
  mp,
  matchId,
  isEditing,
  isOpponent,
  onEdit,
  onRemove,
  onCloseEdit,
  isPending,
}: {
  mp: MatchPlayerData;
  matchId: string;
  isEditing: boolean;
  isOpponent?: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onCloseEdit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded border border-border bg-background">
      {/* Ligne résumé */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <span className={`w-7 shrink-0 text-center font-bold ${isOpponent ? "text-muted-foreground" : "text-usap-sang"}`}>
          {mp.shirtNumber ?? "—"}
        </span>
        <span className="flex-1 font-medium text-foreground">
          {mp.player ? `${mp.player.firstName} ${mp.player.lastName}` : mp.opponentPlayerName ?? "Inconnu"}
          {mp.isCaptain && (
            <span className="ml-1 text-xs text-usap-or">(C)</span>
          )}
        </span>
        {mp.positionPlayed && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {POSITIONS[mp.positionPlayed]?.label ?? mp.positionPlayed}
          </span>
        )}
        {mp.tries > 0 && (
          <span className="rounded bg-usap-sang/10 px-1.5 py-0.5 text-xs font-medium text-usap-sang">
            {mp.tries}E
          </span>
        )}
        {mp.totalPoints > 0 && (
          <span className="rounded bg-usap-or/10 px-1.5 py-0.5 text-xs font-medium text-usap-or">
            {mp.totalPoints}pts
          </span>
        )}
        {mp.minutesPlayed != null && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {mp.minutesPlayed}&apos;
          </span>
        )}
        {mp.yellowCard && <span title="Carton jaune">🟨</span>}
        {mp.orangeCard && <span title="Carton orange">🟧</span>}
        {mp.redCard && <span title="Carton rouge">🟥</span>}
        {mp.whiteCard && <span title="Carton blanc">⬜</span>}
        <button
          onClick={onEdit}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          title="Modifier les stats"
        >
          {isEditing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={onRemove}
          disabled={isPending}
          className="rounded p-1 text-muted-foreground hover:text-destructive"
          title="Retirer"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Formulaire d'édition des stats */}
      {isEditing && (
        <EditPlayerStats
          mp={mp}
          matchId={matchId}
          onClose={onCloseEdit}
        />
      )}
    </div>
  );
}

function EditPlayerStats({
  mp,
  matchId,
  onClose,
}: {
  mp: MatchPlayerData;
  matchId: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateMatchPlayer,
    initialState,
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  const smallInput =
    "w-full rounded-md border border-border bg-card px-2 py-1.5 text-center text-sm text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang";

  return (
    <form
      action={formAction}
      className="border-t border-border bg-muted/30 p-3"
    >
      <input type="hidden" name="id" value={mp.id} />
      <input type="hidden" name="matchId" value={matchId} />

      {/* Ligne 1 : Numéro, Statut, Poste, Capitaine */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">N°</label>
          <input
            name="shirtNumber"
            type="number"
            min={1}
            max={23}
            defaultValue={mp.shirtNumber ?? ""}
            className={smallInput}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Statut
          </label>
          <select
            name="isStarter"
            defaultValue={mp.isStarter ? "true" : "false"}
            className={smallInput}
          >
            <option value="true">Titu.</option>
            <option value="false">Rempl.</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Poste
          </label>
          <select
            name="positionPlayed"
            defaultValue={mp.positionPlayed ?? ""}
            className={smallInput}
          >
            <option value="">—</option>
            {Object.entries(POSITIONS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input
              name="isCaptain"
              type="checkbox"
              defaultChecked={mp.isCaptain}
              className="h-3.5 w-3.5 rounded border-border text-usap-sang"
            />
            Cap.
          </label>
        </div>
      </div>

      {/* Ligne 2 : Stats scoring */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Essais
          </label>
          <input
            name="tries"
            type="number"
            min={0}
            defaultValue={mp.tries}
            className={smallInput}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Transfo.
          </label>
          <input
            name="conversions"
            type="number"
            min={0}
            defaultValue={mp.conversions}
            className={smallInput}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Pénal.
          </label>
          <input
            name="penalties"
            type="number"
            min={0}
            defaultValue={mp.penalties}
            className={smallInput}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Drops
          </label>
          <input
            name="dropGoals"
            type="number"
            min={0}
            defaultValue={mp.dropGoals}
            className={smallInput}
          />
        </div>
      </div>

      {/* Ligne 3 : Minutes + Remplacements */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Minutes
          </label>
          <input
            name="minutesPlayed"
            type="number"
            min={0}
            max={120}
            defaultValue={mp.minutesPlayed ?? ""}
            placeholder="80"
            className={smallInput}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Entré
          </label>
          <input
            name="subIn"
            type="number"
            min={0}
            max={100}
            defaultValue={mp.subIn ?? ""}
            placeholder="min"
            className={smallInput}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Sorti
          </label>
          <input
            name="subOut"
            type="number"
            min={0}
            max={100}
            defaultValue={mp.subOut ?? ""}
            placeholder="min"
            className={smallInput}
          />
        </div>
        <div />
      </div>

      {/* Ligne 4 : Cartons */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        <div className="flex items-end gap-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input
              name="yellowCard"
              type="checkbox"
              defaultChecked={mp.yellowCard}
              className="h-3.5 w-3.5 rounded border-border"
            />
            🟨
          </label>
          <input
            name="yellowCardMin"
            type="number"
            min={0}
            max={100}
            defaultValue={mp.yellowCardMin ?? ""}
            placeholder="min"
            className="w-14 rounded-md border border-border bg-card px-1 py-1 text-center text-xs text-foreground"
          />
        </div>
        <div className="flex items-end gap-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input
              name="redCard"
              type="checkbox"
              defaultChecked={mp.redCard}
              className="h-3.5 w-3.5 rounded border-border"
            />
            🟥
          </label>
          <input
            name="redCardMin"
            type="number"
            min={0}
            max={100}
            defaultValue={mp.redCardMin ?? ""}
            placeholder="min"
            className="w-14 rounded-md border border-border bg-card px-1 py-1 text-center text-xs text-foreground"
          />
        </div>
        <div className="flex items-end gap-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input
              name="orangeCard"
              type="checkbox"
              defaultChecked={mp.orangeCard}
              className="h-3.5 w-3.5 rounded border-border"
            />
            🟧
          </label>
          <input
            name="orangeCardMin"
            type="number"
            min={0}
            max={100}
            defaultValue={mp.orangeCardMin ?? ""}
            placeholder="min"
            className="w-14 rounded-md border border-border bg-card px-1 py-1 text-center text-xs text-foreground"
          />
        </div>
        <div className="flex items-end gap-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input
              name="whiteCard"
              type="checkbox"
              defaultChecked={mp.whiteCard}
              className="h-3.5 w-3.5 rounded border-border"
            />
            ⬜
          </label>
          <input
            name="whiteCardMin"
            type="number"
            min={0}
            max={100}
            defaultValue={mp.whiteCardMin ?? ""}
            placeholder="min"
            className="w-14 rounded-md border border-border bg-card px-1 py-1 text-center text-xs text-foreground"
          />
        </div>
      </div>

      {state.error && (
        <p className="mb-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-usap-sang px-3 py-1.5 text-xs font-medium text-white hover:bg-usap-sang/90 disabled:opacity-50"
        >
          {isPending ? "..." : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
