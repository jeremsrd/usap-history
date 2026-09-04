"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Trophy, Search } from "lucide-react";
import { deleteTrophy } from "./actions";
import TrophyForm from "./TrophyForm";

const ACHIEVEMENT_LABELS: Record<string, string> = {
  CHAMPION: "Champion",
  FINALISTE: "Finaliste",
  DEMI_FINALISTE: "Demi-finaliste",
  QUART_FINALISTE: "Quart de finaliste",
  VAINQUEUR_COUPE: "Vainqueur",
  FINALISTE_COUPE: "Finaliste coupe",
};

const ACHIEVEMENT_STYLES: Record<string, string> = {
  CHAMPION: "bg-usap-or/10 text-usap-or",
  FINALISTE: "bg-muted text-muted-foreground",
  DEMI_FINALISTE: "bg-muted/50 text-muted-foreground",
  QUART_FINALISTE: "bg-muted/50 text-muted-foreground",
  VAINQUEUR_COUPE: "bg-usap-or/10 text-usap-or",
  FINALISTE_COUPE: "bg-muted text-muted-foreground",
};

interface TrophyData {
  id: string;
  year: number;
  competition: string;
  achievement: string;
  opponent: string | null;
  score: string | null;
  venue: string | null;
  details: string | null;
}

interface TrophyListProps {
  trophies: TrophyData[];
}

export default function TrophyList({ trophies }: TrophyListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editTrophy, setEditTrophy] = useState<TrophyData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrophyData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = trophies.filter(
    (t) =>
      t.competition.toLowerCase().includes(search.toLowerCase()) ||
      String(t.year).includes(search) ||
      (t.opponent?.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  function handleEdit(trophy: TrophyData) {
    setEditTrophy(trophy);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditTrophy(null);
    router.refresh();
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteTrophy(deleteTarget.id);
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
            placeholder="Rechercher un trophée..."
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang sm:w-72"
          />
        </div>
        <button
          onClick={() => {
            setEditTrophy(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90"
        >
          <Plus size={16} />
          Ajouter un trophée
        </button>
      </div>

      {/* Compteur */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} trophée{filtered.length > 1 ? "s" : ""}
        {filtered.length !== trophies.length && ` sur ${trophies.length}`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-usap-carte p-10 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {trophies.length === 0
              ? "Aucun trophée enregistré."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Année
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Compétition
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Résultat
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Adversaire
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                  Score
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell">
                  Lieu
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trophy) => (
                <tr
                  key={trophy.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-bold text-usap-or">
                    {trophy.year}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {trophy.competition}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${ACHIEVEMENT_STYLES[trophy.achievement] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {ACHIEVEMENT_LABELS[trophy.achievement] ??
                        trophy.achievement}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {trophy.opponent || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {trophy.score || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {trophy.venue || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(trophy)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(trophy);
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
        <TrophyForm trophy={editTrophy} onClose={handleCloseForm} />
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Supprimer ce trophée ?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.competition} {deleteTarget.year} (
                {ACHIEVEMENT_LABELS[deleteTarget.achievement] ??
                  deleteTarget.achievement}
                )
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
