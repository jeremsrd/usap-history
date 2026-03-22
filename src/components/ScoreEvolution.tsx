"use client";

import { useMemo } from "react";

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
};

const POINTS: Record<string, number> = {
  ESSAI: 5,
  TRANSFORMATION: 2,
  PENALITE: 3,
  DROP: 3,
  ESSAI_PENALITE: 7,
};

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
}: Props) {
  const scoringEvents = useMemo(() => {
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

    // Point final à 80'
    points.push({
      minute: 80,
      scoreUsap: finalScoreUsap,
      scoreOpp: finalScoreOpponent,
      event: { id: "end", minute: 80, type: "END", isUsap: true, description: null },
    });

    return points;
  }, [events, finalScoreUsap, finalScoreOpponent]);

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
      {/* Légende */}
      <div className="mb-3 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded-sm bg-usap-sang" />
          <span className="font-medium text-foreground">USAP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded-sm bg-slate-500" />
          <span className="font-medium text-foreground">{opponentName}</span>
        </div>
      </div>

      {/* Graphique SVG responsive */}
      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grille horizontale */}
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
              <text
                x={PAD_LEFT - 8}
                y={y(v) + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v}
              </text>
            </g>
          ))}

          {/* Ligne mi-temps */}
          <line
            x1={x(40)}
            y1={PAD_TOP}
            x2={x(40)}
            y2={PAD_TOP + chartH}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="6 3"
          />
          <text
            x={x(40)}
            y={PAD_TOP + chartH + 25}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
          >
            MT
          </text>

          {/* Graduations X */}
          {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((m) => (
            <text
              key={m}
              x={x(m)}
              y={PAD_TOP + chartH + 15}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={10}
            >
              {m}&apos;
            </text>
          ))}

          {/* Courbe USAP */}
          <path
            d={pathUsap}
            fill="none"
            stroke="#C8102E"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Courbe adversaire */}
          <path
            d={pathOpp}
            fill="none"
            stroke="#64748b"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Points USAP */}
          {dots.map((pt, i) => {
            if (!pt.event.isUsap) return null;
            return (
              <g key={`u-${i}`}>
                <circle
                  cx={x(pt.minute)}
                  cy={y(pt.scoreUsap)}
                  r={4}
                  fill="#C8102E"
                  stroke="white"
                  strokeWidth={1.5}
                />
                <title>
                  {pt.minute}&apos; — {EVENT_LABELS[pt.event.type] ?? pt.event.type} USAP — {pt.scoreUsap}-{pt.scoreOpp}
                </title>
              </g>
            );
          })}

          {/* Points adversaire */}
          {dots.map((pt, i) => {
            if (pt.event.isUsap) return null;
            return (
              <g key={`o-${i}`}>
                <circle
                  cx={x(pt.minute)}
                  cy={y(pt.scoreOpp)}
                  r={4}
                  fill="#64748b"
                  stroke="white"
                  strokeWidth={1.5}
                />
                <title>
                  {pt.minute}&apos; — {EVENT_LABELS[pt.event.type] ?? pt.event.type} {opponentName} — {pt.scoreUsap}-{pt.scoreOpp}
                </title>
              </g>
            );
          })}

          {/* Score final */}
          <text
            x={x(80) + 2}
            y={y(finalScoreUsap) - 6}
            className="fill-usap-sang"
            fontSize={12}
            fontWeight="bold"
            textAnchor="end"
          >
            {finalScoreUsap}
          </text>
          <text
            x={x(80) + 2}
            y={y(finalScoreOpponent) - 6}
            fill="#64748b"
            fontSize={12}
            fontWeight="bold"
            textAnchor="end"
          >
            {finalScoreOpponent}
          </text>
        </svg>
      </div>

      {/* Détail textuel en dessous */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {scoringEvents
          .filter((p) => p.event.type !== "START" && p.event.type !== "END")
          .map((pt, i) => (
            <span
              key={i}
              className={`rounded px-2 py-1 ${
                pt.event.isUsap
                  ? "bg-usap-sang/10 text-usap-sang"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {pt.minute}&apos;{" "}
              {EVENT_LABELS[pt.event.type] ?? pt.event.type}{" "}
              {!pt.event.isUsap && `(${opponentName})`}{" "}
              — {pt.scoreUsap}-{pt.scoreOpp}
            </span>
          ))}
      </div>
    </div>
  );
}
