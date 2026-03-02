"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import Image from "next/image";
import { deletePlayer } from "./actions";
import PlayerForm from "./PlayerForm";
import { POSITIONS } from "@/lib/constants";

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
  nationality: { name: string; code: string } | null;
}

interface PlayerListProps {
  players: PlayerData[];
  countries: CountryOption[];
}

export default function PlayerList({ players, countries }: PlayerListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState<PlayerData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlayerData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const filtered = players.filter((p) => {
    const matchesSearch =
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase()) ||
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesFilter = !filterActive || p.isActive;
    return matchesSearch && matchesFilter;
  });

  function handleEdit(player: PlayerData) {
    setEditPlayer(player);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditPlayer(null);
    router.refresh();
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      const result = await deletePlayer(deleteTarget.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un joueur..."
              className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang sm:w-64"
            />
          </div>
          <button
            onClick={() => setFilterActive(!filterActive)}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              filterActive
                ? "border-usap-sang bg-usap-sang/10 text-usap-sang"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Effectif actuel
          </button>
        </div>
        <button
          onClick={() => {
            setEditPlayer(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90"
        >
          <Plus size={16} />
          Ajouter un joueur
        </button>
      </div>

      {/* Compteur */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} joueur{filtered.length > 1 ? "s" : ""}
        {filtered.length !== players.length && ` sur ${players.length}`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-usap-carte p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {players.length === 0
              ? "Aucun joueur enregistré."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Joueur
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Poste
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                  Nationalité
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell">
                  Naissance
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Statut
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {player.photoUrl ? (
                        <Image
                          src={player.photoUrl}
                          alt={`${player.firstName} ${player.lastName}`}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {player.firstName[0]}
                          {player.lastName[0]}
                        </div>
                      )}
                      <span className="font-medium text-foreground">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {player.position
                      ? POSITIONS[player.position]?.label ?? player.position
                      : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {player.nationality?.name ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {formatDate(player.birthDate)}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {player.isActive ? (
                      <span className="rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-medium text-usap-sang">
                        Actuel
                      </span>
                    ) : (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Ancien
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(player)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(player);
                        }}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <PlayerForm
          player={editPlayer}
          countries={countries}
          onClose={handleCloseForm}
        />
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Supprimer ce joueur ?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>{" "}
              ? Cette action est irréversible.
            </p>

            {deleteError && (
              <p className="mb-4 text-sm text-destructive">{deleteError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
