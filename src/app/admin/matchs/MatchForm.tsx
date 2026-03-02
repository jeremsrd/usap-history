"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { createMatch, updateMatch } from "./actions";
import type { MatchActionState } from "./actions";
import { MATCH_RESULTS } from "@/lib/constants";

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
}

interface MatchFormProps {
  match?: MatchData | null;
  seasons: SeasonOption[];
  competitions: CompetitionOption[];
  opponents: OpponentOption[];
  venues: VenueOption[];
  referees: RefereeOption[];
  onClose: () => void;
}

const initialState: MatchActionState = {};

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-usap-sang focus:outline-none focus:ring-1 focus:ring-usap-sang";
const labelClass = "mb-1 block text-sm font-medium text-muted-foreground";

export default function MatchForm({
  match,
  seasons,
  competitions,
  opponents,
  venues,
  referees,
  onClose,
}: MatchFormProps) {
  const isEdit = !!match;
  const action = isEdit ? updateMatch : createMatch;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [result, setResult] = useState<string>(match?.result ?? "");
  const [showScoringDetails, setShowScoringDetails] = useState(false);
  const scoreUsapRef = useRef<HTMLInputElement>(null);
  const scoreOpponentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  function handleScoreChange() {
    const usap = parseInt(scoreUsapRef.current?.value ?? "", 10);
    const opp = parseInt(scoreOpponentRef.current?.value ?? "", 10);
    if (!isNaN(usap) && !isNaN(opp)) {
      if (usap > opp) setResult("VICTOIRE");
      else if (usap < opp) setResult("DEFAITE");
      else setResult("NUL");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            {isEdit ? "Modifier le match" : "Ajouter un match"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="space-y-5">
          {isEdit && <input type="hidden" name="id" value={match.id} />}
          <input type="hidden" name="result" value={result} />

          {/* ── Section 1 : Informations générales ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-usap-sang">
              Informations générales
            </h3>

            {/* Date + Heure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className={labelClass}>
                  Date *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={match?.date ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="kickoffTime" className={labelClass}>
                  Heure de coup d&apos;envoi
                </label>
                <input
                  id="kickoffTime"
                  name="kickoffTime"
                  type="time"
                  defaultValue={match?.kickoffTime ?? ""}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Saison + Compétition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="seasonId" className={labelClass}>
                  Saison *
                </label>
                <select
                  id="seasonId"
                  name="seasonId"
                  required
                  defaultValue={match?.seasonId ?? ""}
                  className={inputClass}
                >
                  <option value="">— Choisir —</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="competitionId" className={labelClass}>
                  Compétition *
                </label>
                <select
                  id="competitionId"
                  name="competitionId"
                  required
                  defaultValue={match?.competitionId ?? ""}
                  className={inputClass}
                >
                  <option value="">— Choisir —</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName ?? c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Adversaire + Stade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="opponentId" className={labelClass}>
                  Adversaire *
                </label>
                <select
                  id="opponentId"
                  name="opponentId"
                  required
                  defaultValue={match?.opponentId ?? ""}
                  className={inputClass}
                >
                  <option value="">— Choisir —</option>
                  {opponents.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="venueId" className={labelClass}>
                  Stade
                </label>
                <select
                  id="venueId"
                  name="venueId"
                  defaultValue={match?.venueId ?? ""}
                  className={inputClass}
                >
                  <option value="">— Non renseigné —</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dom/Ext + Terrain neutre */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="isHome" className={labelClass}>
                  Domicile / Extérieur *
                </label>
                <select
                  id="isHome"
                  name="isHome"
                  defaultValue={
                    match ? (match.isHome ? "true" : "false") : "true"
                  }
                  className={inputClass}
                >
                  <option value="true">Domicile</option>
                  <option value="false">Extérieur</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <input
                    id="isNeutralVenue"
                    name="isNeutralVenue"
                    type="checkbox"
                    defaultChecked={match?.isNeutralVenue ?? false}
                    className="h-4 w-4 rounded border-border text-usap-sang focus:ring-usap-sang"
                  />
                  <label
                    htmlFor="isNeutralVenue"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Terrain neutre
                  </label>
                </div>
              </div>
            </div>

            {/* Journée + Phase + Manche */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="matchday" className={labelClass}>
                  Journée
                </label>
                <input
                  id="matchday"
                  name="matchday"
                  type="number"
                  min={1}
                  defaultValue={match?.matchday ?? ""}
                  placeholder="1"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="round" className={labelClass}>
                  Phase
                </label>
                <input
                  id="round"
                  name="round"
                  type="text"
                  defaultValue={match?.round ?? ""}
                  placeholder="Finale, 1/2 finale..."
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="leg" className={labelClass}>
                  Manche
                </label>
                <input
                  id="leg"
                  name="leg"
                  type="number"
                  min={1}
                  max={3}
                  defaultValue={match?.leg ?? ""}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ── Section 2 : Score ── */}
          <div className="space-y-4 border-t border-border pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-usap-or">
              Score
            </h3>

            {/* Score final */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="scoreUsap" className={labelClass}>
                  Score USAP *
                </label>
                <input
                  ref={scoreUsapRef}
                  id="scoreUsap"
                  name="scoreUsap"
                  type="number"
                  min={0}
                  required
                  defaultValue={match?.scoreUsap ?? ""}
                  placeholder="0"
                  onChange={handleScoreChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="scoreOpponent" className={labelClass}>
                  Score Adversaire *
                </label>
                <input
                  ref={scoreOpponentRef}
                  id="scoreOpponent"
                  name="scoreOpponent"
                  type="number"
                  min={0}
                  required
                  defaultValue={match?.scoreOpponent ?? ""}
                  placeholder="0"
                  onChange={handleScoreChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Mi-temps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="halfTimeUsap" className={labelClass}>
                  Mi-temps USAP
                </label>
                <input
                  id="halfTimeUsap"
                  name="halfTimeUsap"
                  type="number"
                  min={0}
                  defaultValue={match?.halfTimeUsap ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="halfTimeOpponent" className={labelClass}>
                  Mi-temps Adversaire
                </label>
                <input
                  id="halfTimeOpponent"
                  name="halfTimeOpponent"
                  type="number"
                  min={0}
                  defaultValue={match?.halfTimeOpponent ?? ""}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Résultat + Bonus */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="resultDisplay" className={labelClass}>
                  Résultat *
                </label>
                <select
                  id="resultDisplay"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Auto —</option>
                  {Object.entries(MATCH_RESULTS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <input
                    id="bonusOffensif"
                    name="bonusOffensif"
                    type="checkbox"
                    defaultChecked={match?.bonusOffensif ?? false}
                    className="h-4 w-4 rounded border-border text-usap-sang focus:ring-usap-sang"
                  />
                  <label
                    htmlFor="bonusOffensif"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Bonus offensif
                  </label>
                </div>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <input
                    id="bonusDefensif"
                    name="bonusDefensif"
                    type="checkbox"
                    defaultChecked={match?.bonusDefensif ?? false}
                    className="h-4 w-4 rounded border-border text-usap-sang focus:ring-usap-sang"
                  />
                  <label
                    htmlFor="bonusDefensif"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Bonus défensif
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3 : Détail du scoring (toggle) ── */}
          <div className="border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setShowScoringDetails(!showScoringDetails)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {showScoringDetails ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              Détailler le scoring
            </button>

            {showScoringDetails && (
              <div className="mt-4 space-y-4">
                {/* USAP */}
                <p className="text-xs font-semibold uppercase tracking-wider text-usap-sang">
                  USAP
                </p>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label htmlFor="triesUsap" className={labelClass}>
                      Essais
                    </label>
                    <input
                      id="triesUsap"
                      name="triesUsap"
                      type="number"
                      min={0}
                      defaultValue={match?.triesUsap ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="conversionsUsap" className={labelClass}>
                      Transfo.
                    </label>
                    <input
                      id="conversionsUsap"
                      name="conversionsUsap"
                      type="number"
                      min={0}
                      defaultValue={match?.conversionsUsap ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="penaltiesUsap" className={labelClass}>
                      Pénalités
                    </label>
                    <input
                      id="penaltiesUsap"
                      name="penaltiesUsap"
                      type="number"
                      min={0}
                      defaultValue={match?.penaltiesUsap ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="dropGoalsUsap" className={labelClass}>
                      Drops
                    </label>
                    <input
                      id="dropGoalsUsap"
                      name="dropGoalsUsap"
                      type="number"
                      min={0}
                      defaultValue={match?.dropGoalsUsap ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="penaltyTriesUsap" className={labelClass}>
                      E. pén.
                    </label>
                    <input
                      id="penaltyTriesUsap"
                      name="penaltyTriesUsap"
                      type="number"
                      min={0}
                      defaultValue={match?.penaltyTriesUsap ?? ""}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Adversaire */}
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Adversaire
                </p>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label htmlFor="triesOpponent" className={labelClass}>
                      Essais
                    </label>
                    <input
                      id="triesOpponent"
                      name="triesOpponent"
                      type="number"
                      min={0}
                      defaultValue={match?.triesOpponent ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="conversionsOpponent" className={labelClass}>
                      Transfo.
                    </label>
                    <input
                      id="conversionsOpponent"
                      name="conversionsOpponent"
                      type="number"
                      min={0}
                      defaultValue={match?.conversionsOpponent ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="penaltiesOpponent" className={labelClass}>
                      Pénalités
                    </label>
                    <input
                      id="penaltiesOpponent"
                      name="penaltiesOpponent"
                      type="number"
                      min={0}
                      defaultValue={match?.penaltiesOpponent ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="dropGoalsOpponent" className={labelClass}>
                      Drops
                    </label>
                    <input
                      id="dropGoalsOpponent"
                      name="dropGoalsOpponent"
                      type="number"
                      min={0}
                      defaultValue={match?.dropGoalsOpponent ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="penaltyTriesOpponent"
                      className={labelClass}
                    >
                      E. pén.
                    </label>
                    <input
                      id="penaltyTriesOpponent"
                      name="penaltyTriesOpponent"
                      type="number"
                      min={0}
                      defaultValue={match?.penaltyTriesOpponent ?? ""}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 4 : Informations complémentaires ── */}
          <div className="space-y-4 border-t border-border pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Informations complémentaires
            </h3>

            {/* Arbitre + Affluence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="refereeId" className={labelClass}>
                  Arbitre
                </label>
                <select
                  id="refereeId"
                  name="refereeId"
                  defaultValue={match?.refereeId ?? ""}
                  className={inputClass}
                >
                  <option value="">— Non renseigné —</option>
                  {referees.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.firstName} {r.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="attendance" className={labelClass}>
                  Affluence
                </label>
                <input
                  id="attendance"
                  name="attendance"
                  type="number"
                  min={0}
                  defaultValue={match?.attendance ?? ""}
                  placeholder="12000"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Homme du match */}
            <div>
              <label htmlFor="manOfTheMatch" className={labelClass}>
                Homme du match
              </label>
              <input
                id="manOfTheMatch"
                name="manOfTheMatch"
                type="text"
                defaultValue={match?.manOfTheMatch ?? ""}
                placeholder="Nom du joueur"
                className={inputClass}
              />
            </div>

            {/* Compte-rendu */}
            <div>
              <label htmlFor="report" className={labelClass}>
                Compte-rendu
              </label>
              <textarea
                id="report"
                name="report"
                rows={3}
                defaultValue={match?.report ?? ""}
                placeholder="Résumé du match..."
                className={inputClass}
              />
            </div>
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
