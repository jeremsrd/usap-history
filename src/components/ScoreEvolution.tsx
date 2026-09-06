"use client";

import { useMemo } from "react";
import type { Bareme } from "@/lib/scoring";

type MatchEvent = {
  id: string;
  minute: number;
  type: string;
  isUsap: boolean;
  description: string | null;
};

type Props = {
  events: MatchEvent[];
  finalScoreUsap: number;
  finalScoreOpponent: number;
  opponentName: string;
  isHome: boolean;
  /** Le barème de la saison — un essai vaut trois points en 1914, un drop quatre. */
  bareme: Bareme;
  /** « mi-temps », passé par la page qui seule tient le dictionnaire. */
  libelleMiTemps: string;
};

/** Ce que chaque fait vaut, sous le barème reçu : la valeur n'est écrite qu'une fois, dans `baremeDeMatch`. */
function pointsDe(bareme: Bareme): Record<string, number> {
  return {
    ESSAI: bareme.essai,
    TRANSFORMATION: bareme.transformation,
    PENALITE: bareme.penalite,
    DROP: bareme.drop,
    ESSAI_PENALITE: bareme.essaiDePenalite,
  };
}

const EVENT_LABELS: Record<string, string> = {
  ESSAI: "Essai",
  TRANSFORMATION: "Transf.",
  PENALITE: "Pén.",
  DROP: "Drop",
  ESSAI_PENALITE: "Essai pén.",
};

type ScorePoint = {
  minute: number;
  scoreUsap: number;
  scoreOpp: number;
  event: MatchEvent;
};

export default function ScoreEvolution({
  events,
  finalScoreUsap,
  finalScoreOpponent,
  opponentName,
  isHome,
  bareme,
  libelleMiTemps,
}: Props) {
  const scoringEvents = useMemo(() => {
    const POINTS = pointsDe(bareme);
    const scoring = events.filter((e) => POINTS[e.type]);
    let usap = 0;
    let opp = 0;
    const points: ScorePoint[] = [
      // Point de départ à 0-0
      { minute: 0, scoreUsap: 0, scoreOpp: 0, event: { id: "start", minute: 0, type: "START", isUsap: true, description: null } },
    ];

    for (const ev of scoring) {
      const pts = POINTS[ev.type] ?? 0;
      if (ev.isUsap) usap += pts;
      else opp += pts;
      points.push({ minute: ev.minute, scoreUsap: usap, scoreOpp: opp, event: ev });
    }

    // Point final à 80' — ou plus tard, quand un fait est daté au-delà : la
    // transformation de Giral, à 4 h 41 à l'horloge de 1914, tombe à la 81ᵉ.
    const fin = Math.max(80, ...scoring.map((e) => e.minute));
    points.push({
      minute: fin,
      scoreUsap: finalScoreUsap,
      scoreOpp: finalScoreOpponent,
      event: { id: "end", minute: fin, type: "END", isUsap: true, description: null },
    });

    return points;
  }, [events, finalScoreUsap, finalScoreOpponent, bareme]);

  const maxScore = Math.max(finalScoreUsap, finalScoreOpponent, 10);

  // Dimensions SVG
  const W = 800;
  const H = 300;
  const PAD_LEFT = 45;
  const PAD_RIGHT = 15;
  const PAD_TOP = 25;
  const PAD_BOTTOM = 35;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const x = (minute: number) => PAD_LEFT + (minute / 80) * chartW;
  const y = (score: number) => PAD_TOP + chartH - (score / maxScore) * chartH;

  // Générer les paths en step (escalier)
  const pathUsap = useMemo(() => {
    let d = "";
    for (let i = 0; i < scoringEvents.length; i++) {
      const pt = scoringEvents[i];
      const px = x(pt.minute);
      const py = y(pt.scoreUsap);
      if (i === 0) {
        d += `M ${px} ${py}`;
      } else {
        // Ligne horizontale puis verticale (step)
        d += ` H ${px} V ${py}`;
      }
    }
    return d;
  }, [scoringEvents, maxScore]);

  const pathOpp = useMemo(() => {
    let d = "";
    for (let i = 0; i < scoringEvents.length; i++) {
      const pt = scoringEvents[i];
      const px = x(pt.minute);
      const py = y(pt.scoreOpp);
      if (i === 0) {
        d += `M ${px} ${py}`;
      } else {
        d += ` H ${px} V ${py}`;
      }
    }
    return d;
  }, [scoringEvents, maxScore]);

  // Graduations Y
  const yTicks = useMemo(() => {
    const step = maxScore <= 20 ? 5 : maxScore <= 40 ? 10 : 15;
    const ticks: number[] = [0];
    for (let v = step; v <= maxScore; v += step) ticks.push(v);
    return ticks;
  }, [maxScore]);

  // Points de scoring (hors start/end) pour les dots
  const dots = scoringEvents.filter((p) => p.event.type !== "START" && p.event.type !== "END");

  // Labels pour home/away
  const homeLabel = isHome ? "USAP" : opponentName;
  const awayLabel = isHome ? opponentName : "USAP";

  return (
    <div className="w-full">
      {/* Deux traits, deux noms : la légende tient en une ligne de texte. */}
      <p className="mb-2 text-sm">
        <span className="font-semibold text-usap-sang">USAP</span>
        <span className="mx-2 text-muted-foreground">et</span>
        <span className="font-semibold text-foreground">{opponentName}</span>
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${homeLabel} ${isHome ? finalScoreUsap : finalScoreOpponent} – ${isHome ? finalScoreOpponent : finalScoreUsap} ${awayLabel}`}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD_LEFT}
                y1={y(v)}
                x2={W - PAD_RIGHT}
                y2={y(v)}
                className="stroke-border"
                strokeWidth={v === 0 ? 1.5 : 0.5}
                strokeDasharray={v === 0 ? undefined : "4 4"}
              />
              <text x={PAD_LEFT - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground" fontSize={11}>
                {v}
              </text>
            </g>
          ))}

          <line x1={x(40)} y1={PAD_TOP} x2={x(40)} y2={PAD_TOP + chartH} className="stroke-border" strokeWidth={1} strokeDasharray="6 3" />
          <text x={x(40)} y={PAD_TOP + chartH + 26} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
            {libelleMiTemps}
          </text>

          {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((m) => (
            <text key={m} x={x(m)} y={PAD_TOP + chartH + 15} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
              {m}
            </text>
          ))}

          <path d={pathUsap} fill="none" className="stroke-usap-sang" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={pathOpp} fill="none" className="stroke-foreground" strokeWidth={2.5} strokeLinejoin="round" />

          {/* Le <title> d'un point tient en UNE chaîne : sous React 19, un
              <title> à plusieurs enfants est servi vide côté serveur et plein
              côté client — c'était l'erreur d'hydratation de la finale de 1914. */}
          {dots.map((pt, i) =>
            pt.event.isUsap ? (
              <g key={`u-${i}`}>
                <circle cx={x(pt.minute)} cy={y(pt.scoreUsap)} r={4} className="fill-usap-sang stroke-background" strokeWidth={1.5} />
                <title>{`${pt.minute}' — ${EVENT_LABELS[pt.event.type] ?? pt.event.type} USAP — ${pt.scoreUsap}-${pt.scoreOpp}`}</title>
              </g>
            ) : (
              <g key={`o-${i}`}>
                <circle cx={x(pt.minute)} cy={y(pt.scoreOpp)} r={4} className="fill-foreground stroke-background" strokeWidth={1.5} />
                <title>{`${pt.minute}' — ${EVENT_LABELS[pt.event.type] ?? pt.event.type} ${opponentName} — ${pt.scoreUsap}-${pt.scoreOpp}`}</title>
              </g>
            ),
          )}

          <text x={W - PAD_RIGHT} y={y(finalScoreUsap) - 6} className="fill-usap-sang" fontSize={12} fontWeight="bold" textAnchor="end">
            {finalScoreUsap}
          </text>
          <text x={W - PAD_RIGHT} y={y(finalScoreOpponent) - 6} className="fill-foreground" fontSize={12} fontWeight="bold" textAnchor="end">
            {finalScoreOpponent}
          </text>
        </svg>
      </div>
    </div>
  );
}
