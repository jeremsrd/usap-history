"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, User, Search } from "lucide-react";
import { deleteCoach } from "./actions";
import CoachForm from "./CoachForm";

interface CoachData {
  id: string;
  firstName: string;
  lastName: string;
  role: string | null;
  photoUrl: string | null;
  biography: string | null;
  _count: { seasons: number };
}

interface CoachListProps {
  coaches: CoachData[];
}

export default function CoachList({ coaches }: CoachListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editCoach, setEditCoach] = useState<CoachData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CoachData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = coaches.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (c.role ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  function handleEdit(coach: CoachData) {
    setEditCoach(coach);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditCoach(null);
    router.refresh();
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteCoach(deleteTarget.id);
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
            placeholder="Rechercher un entraîneur..."
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang sm:w-64"
          />
        </div>
        <button
          onClick={() => {
            setEditCoach(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90"
        >
          <Plus size={16} />
          Ajouter un entraîneur
        </button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} entraîneur{filtered.length > 1 ? "s" : ""}
        {filtered.length !== coaches.length && ` sur ${coaches.length}`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-usap-carte p-10 text-center">
          <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {coaches.length === 0
              ? "Aucun entraîneur enregistré."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Entraîneur
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Rôle
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                  Saisons
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coach) => (
                <tr
                  key={coach.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">
                      {coach.firstName} {coach.lastName}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {coach.role ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {coach._count.seasons}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(coach)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(coach);
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

      {showForm && <CoachForm coach={editCoach} onClose={handleCloseForm} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Supprimer cet entraîneur ?
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
