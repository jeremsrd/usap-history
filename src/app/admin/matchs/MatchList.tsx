"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Swords, Search, Shield } from "lucide-react";
import Image from "next/image";
import { deleteMatch } from "./actions";
import MatchForm from "./MatchForm";
import { MATCH_RESULTS } from "@/lib/constants";

// --- Interfaces ---

interface SeasonOption {
  id: string;
  label: string;
}

interface CompetitionOption {
  id: string;
  name: string;
  shortName: string | null;
}

interface OpponentOption {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

interface VenueOption {
  id: string;
  name: string;
  city: string;
}

interface RefereeOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface MatchData {
  id: string;
  date: string;
  kickoffTime: string | null;
  seasonId: string;
  competitionId: string;
  opponentId: string;
  venueId: string | null;
  matchday: number | null;
  round: string | null;
  leg: number | null;
  isHome: boolean;
  isNeutralVenue: boolean;
  scoreUsap: number;
  scoreOpponent: number;
  halfTimeUsap: number | null;
  halfTimeOpponent: number | null;
  result: string;
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  refereeId: string | null;
  attendance: number | null;
  report: string | null;
  manOfTheMatch: string | null;
  triesUsap: number | null;
  conversionsUsap: number | null;
  penaltiesUsap: number | null;
  dropGoalsUsap: number | null;
  penaltyTriesUsap: number | null;
  triesOpponent: number | null;
  conversionsOpponent: number | null;
  penaltiesOpponent: number | null;
  dropGoalsOpponent: number | null;
  penaltyTriesOpponent: number | null;
  season: { label: string };
  competition: { name: string; shortName: string | null };
  opponent: { name: string; shortName: string | null; logoUrl: string | null };
  venue: { name: string; city: string } | null;
  referee: { firstName: string; lastName: string } | null;
  _count: { players: number; matchEvents: number };
}

interface MatchListProps {
  matches: MatchData[];
  seasons: SeasonOption[];
  competitions: CompetitionOption[];
  opponents: OpponentOption[];
  venues: VenueOption[];
  referees: RefereeOption[];
}

// --- Helpers ---

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

const resultColors: Record<string, string> = {
  VICTOIRE: "text-green-600",
  DEFAITE: "text-red-600",
  NUL: "text-muted-foreground",
};

// --- Component ---

export default function MatchList({
  matches,
  seasons,
  competitions,
  opponents,
  venues,
  referees,
}: MatchListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editMatch, setEditMatch] = useState<MatchData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MatchData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterSeason, setFilterSeason] = useState<string>("");
  const [filterCompetition, setFilterCompetition] = useState<string>("");

  const filtered = matches.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.opponent.name.toLowerCase().includes(q) ||
      (m.opponent.shortName ?? "").toLowerCase().includes(q) ||
      (m.round ?? "").toLowerCase().includes(q);
    const matchesSeason = !filterSeason || m.seasonId === filterSeason;
    const matchesCompetition =
      !filterCompetition || m.competitionId === filterCompetition;
    return matchesSearch && matchesSeason && matchesCompetition;
  });

  function handleEdit(match: MatchData) {
    setEditMatch(match);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditMatch(null);
    router.refresh();
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteMatch(deleteTarget.id);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Recherche */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang sm:w-48"
            />
          </div>

          {/* Filtre saison */}
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
          >
            <option value="">Toutes les saisons</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Filtre compétition */}
          <select
            value={filterCompetition}
            onChange={(e) => setFilterCompetition(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang"
          >
            <option value="">Toutes les compétitions</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName ?? c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setEditMatch(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/90"
        >
          <Plus size={16} />
          Ajouter un match
        </button>
      </div>

      {/* Compteur */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} match{filtered.length > 1 ? "s" : ""}
        {filtered.length !== matches.length && ` sur ${matches.length}`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-usap-carte p-10 text-center">
          <Swords className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {matches.length === 0
              ? "Aucun match enregistré."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Date
                </th>
                <th className="px-3 py-3 text-center font-semibold text-foreground">
                  D/E
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Adversaire
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">
                  Score
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Compétition
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                  Journée
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell">
                  Stade
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  {/* Date */}
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(m.date)}
                  </td>

                  {/* DOM / EXT / N */}
                  <td className="px-3 py-3 text-center">
                    {m.isNeutralVenue ? (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        N
                      </span>
                    ) : m.isHome ? (
                      <span className="rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-semibold text-usap-sang">
                        DOM
                      </span>
                    ) : (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        EXT
                      </span>
                    )}
                  </td>

                  {/* Adversaire */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.opponent.logoUrl ? (
                        <Image
                          src={m.opponent.logoUrl}
                          alt={m.opponent.name}
                          width={24}
                          height={24}
                          className="h-6 w-6 shrink-0 object-contain"
                          unoptimized
                        />
                      ) : (
                        <Shield
                          size={20}
                          className="shrink-0 text-muted-foreground"
                        />
                      )}
                      <span className="font-medium text-foreground">
                        {m.opponent.shortName ?? m.opponent.name}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span
                      className={`font-bold ${resultColors[m.result] ?? ""}`}
                    >
                      {m.scoreUsap} - {m.scoreOpponent}
                    </span>
                    {(m.bonusOffensif || m.bonusDefensif) && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {m.bonusOffensif && (
                          <span className="mr-1 rounded bg-usap-or/20 px-1 py-0.5 text-usap-or">
                            BO
                          </span>
                        )}
                        {m.bonusDefensif && (
                          <span className="rounded bg-muted px-1 py-0.5">
                            BD
                          </span>
                        )}
                      </span>
                    )}
                  </td>

                  {/* Compétition */}
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {m.competition.shortName ?? m.competition.name}
                  </td>

                  {/* Journée */}
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {m.matchday ? `J${m.matchday}` : m.round ?? "—"}
                  </td>

                  {/* Stade */}
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {m.venue?.name ?? "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(m)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(m);
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
        <MatchForm
          match={editMatch}
          seasons={seasons}
          competitions={competitions}
          opponents={opponents}
          venues={venues}
          referees={referees}
          onClose={handleCloseForm}
        />
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Supprimer ce match ?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer le match contre{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.opponent.name}
              </span>{" "}
              du{" "}
              <span className="font-semibold text-foreground">
                {formatDate(deleteTarget.date)}
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
