"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Trophy, Search } from "lucide-react";
import { deleteCompetition } from "./actions";
import CompetitionForm from "./CompetitionForm";
import { COMPETITION_TYPES } from "@/lib/constants";

interface CompetitionData {
  id: string;
  name: string;
  shortName: string | null;
  type: string;
  isActive: boolean;
  _count: { matches: number };
}

interface CompetitionListProps {
  competitions: CompetitionData[];
}

export default function CompetitionList({
  competitions,
}: CompetitionListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editCompetition, setEditCompetition] =
    useState<CompetitionData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompetitionData | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = competitions.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.shortName?.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  function handleEdit(competition: CompetitionData) {
    setEditCompetition(competition);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditCompetition(null);
    router.refresh();
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteCompetition(deleteTarget.id);
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
            placeholder="Rechercher une compétition..."
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang sm:w-72"
          />
        </div>
        <button
          onClick={() => {
            setEditCompetition(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90"
        >
          <Plus size={16} />
          Ajouter une compétition
        </button>
      </div>

      {/* Compteur */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} compétition{filtered.length > 1 ? "s" : ""}
        {filtered.length !== competitions.length &&
          ` sur ${competitions.length}`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-usap-carte p-10 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {competitions.length === 0
              ? "Aucune compétition enregistrée."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Compétition
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Nom court
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                  Type
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell">
                  Matchs
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
              {filtered.map((comp) => (
                <tr
                  key={comp.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">
                      {comp.name}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {comp.shortName || "—"}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="rounded bg-usap-or/10 px-2 py-0.5 text-xs font-medium text-usap-or">
                      {COMPETITION_TYPES[comp.type] ?? comp.type}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {comp._count.matches}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {comp.isActive ? (
                      <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(comp)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(comp);
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
        <CompetitionForm
          competition={editCompetition}
          onClose={handleCloseForm}
        />
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Supprimer cette compétition ?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.name}
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
