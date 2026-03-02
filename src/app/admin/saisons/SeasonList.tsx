"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Calendar, Search } from "lucide-react";
import { deleteSeason } from "./actions";
import SeasonForm from "./SeasonForm";
import { DIVISIONS } from "@/lib/constants";

interface SeasonData {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  division: string;
  _count: { matches: number; seasonPlayers: number };
}

interface SeasonListProps {
  seasons: SeasonData[];
}

export default function SeasonList({ seasons }: SeasonListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editSeason, setEditSeason] = useState<SeasonData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeasonData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = seasons.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      (DIVISIONS[s.division] ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  function handleEdit(season: SeasonData) {
    setEditSeason(season);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditSeason(null);
    router.refresh();
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteSeason(deleteTarget.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une saison..."
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang sm:w-64"
          />
        </div>
        <button
          onClick={() => {
            setEditSeason(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90"
        >
          <Plus size={16} />
          Ajouter une saison
        </button>
      </div>

      {/* Compteur */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} saison{filtered.length > 1 ? "s" : ""}
        {filtered.length !== seasons.length && ` sur ${seasons.length}`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-usap-carte p-10 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {seasons.length === 0
              ? "Aucune saison enregistrée."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Saison
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Division
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Matchs
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((season) => (
                <tr
                  key={season.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {season.label}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {DIVISIONS[season.division] ?? season.division}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {season._count.matches}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(season)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(season);
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
        <SeasonForm season={editSeason} onClose={handleCloseForm} />
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Supprimer cette saison ?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer la saison{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.label}
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
