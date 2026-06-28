"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Lap = {
  id: number;
  time: number;
  diff: number;
};

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [flash, setFlash] = useState<"start" | "stop" | "lap" | "reset" | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const lapsRef = useRef<Lap[]>([]);
  const elapsedStateRef = useRef(0);

  const tick = useCallback(() => {
    setElapsed(Date.now() - startTimeRef.current + elapsedRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      elapsedRef.current = elapsed;
    }
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { lapsRef.current = laps; }, [laps]);
  useEffect(() => { elapsedStateRef.current = elapsed; }, [elapsed]);

  const triggerFlash = (type: typeof flash) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 300);
  };

  const handleStartStop = useCallback(() => {
    setRunning((r) => {
      triggerFlash(r ? "stop" : "start");
      return !r;
    });
  }, []);

  const handleLapReset = useCallback(() => {
    if (runningRef.current) {
      const cur = elapsedStateRef.current;
      const prev = lapsRef.current;
      const lastLapTime = prev.length > 0 ? prev[prev.length - 1].time : 0;
      setLaps((p) => [...p, { id: p.length + 1, time: cur, diff: cur - lastLapTime }]);
      triggerFlash("lap");
    } else {
      setElapsed(0);
      elapsedRef.current = 0;
      setLaps([]);
      triggerFlash("reset");
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); handleStartStop(); }
      if (e.code === "KeyL") handleLapReset();
      if (e.code === "KeyR" && !runningRef.current) handleLapReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleStartStop, handleLapReset]);

  const minLap = laps.length > 1 ? Math.min(...laps.map((l) => l.diff)) : null;
  const maxLap = laps.length > 1 ? Math.max(...laps.map((l) => l.diff)) : null;

  const ringColor = running ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.1)";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-start pt-12 px-4 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 mb-14">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${running ? "bg-green-400 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" : "bg-gray-600"}`} />
        <span className="text-xs font-medium tracking-[0.25em] uppercase text-gray-500">
          Stopwatch
        </span>
      </div>

      {/* Timer ring */}
      <div
        className="relative flex items-center justify-center mb-14 rounded-full transition-all duration-500"
        style={{
          width: 300,
          height: 300,
          background: `radial-gradient(circle at 50% 50%, ${ringColor} 0%, transparent 70%)`,
          boxShadow: running
            ? "0 0 60px 0 rgba(34,197,94,0.08), inset 0 0 60px 0 rgba(34,197,94,0.04)"
            : "0 0 60px 0 rgba(99,102,241,0.06), inset 0 0 60px 0 rgba(99,102,241,0.03)",
        }}
      >
        {/* Outer ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="140" fill="none" stroke="#1a1a2e" strokeWidth="1" />
          <circle
            cx="150" cy="150" r="140" fill="none"
            stroke={running ? "rgba(34,197,94,0.25)" : "rgba(99,102,241,0.2)"}
            strokeWidth="1"
            strokeDasharray="879.6"
            strokeDashoffset={879.6 - (879.6 * ((elapsed % 60000) / 60000))}
            strokeLinecap="round"
            className="transition-colors duration-500"
          />
        </svg>

        <div className="flex flex-col items-center select-none">
          <span
            className={`text-6xl font-extralight tabular-nums tracking-tight transition-all duration-150 ${
              flash === "start" ? "text-green-300" :
              flash === "stop"  ? "text-red-300"   :
              flash === "lap"   ? "text-indigo-300" :
              flash === "reset" ? "text-gray-400"  :
              "text-white"
            }`}
          >
            {formatTime(elapsed)}
          </span>
          {laps.length > 0 && (
            <span className="text-xs text-gray-600 mt-2 tracking-widest">
              LAP {laps.length + 1}
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-12 mb-14 items-center">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleLapReset}
            className="w-16 h-16 rounded-full bg-[#1a1a2e] border border-white/10 text-gray-300 font-medium text-sm hover:bg-[#1f1f3a] hover:border-white/20 active:scale-95 transition-all"
          >
            {running ? "Lap" : "Reset"}
          </button>
          <span className="text-[10px] text-gray-600 tracking-widest">
            {running ? "L" : "R"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleStartStop}
            className={`w-20 h-20 rounded-full font-semibold text-base active:scale-95 transition-all duration-200 relative overflow-hidden ${
              running
                ? "bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20"
                : "bg-green-500/10 border border-green-500/40 text-green-400 hover:bg-green-500/20"
            }`}
          >
            <span className="relative z-10">{running ? "Stop" : "Start"}</span>
          </button>
          <span className="text-[10px] text-gray-600 tracking-widest">Space</span>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="flex gap-4 mb-10 text-[11px] text-gray-700">
        <span><kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">Space</kbd> Start / Stop</span>
        <span><kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">L</kbd> Lap</span>
        <span><kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">R</kbd> Reset</span>
      </div>

      {/* Lap list */}
      {laps.length > 0 && (
        <div className="w-full max-w-sm bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex justify-between text-[11px] text-gray-600 px-5 py-3 border-b border-white/[0.06] tracking-widest uppercase">
            <span className="w-12">Lap</span>
            <span>Split</span>
            <span>Total</span>
          </div>
          <ul>
            {[...laps].reverse().map((lap) => {
              const isBest = lap.diff === minLap;
              const isWorst = lap.diff === maxLap;
              return (
                <li
                  key={lap.id}
                  className={`flex justify-between px-5 py-3 text-sm tabular-nums border-b border-white/[0.04] last:border-0 ${
                    isBest  ? "text-green-400 bg-green-500/5"  :
                    isWorst ? "text-red-400 bg-red-500/5"      :
                    "text-gray-300"
                  }`}
                >
                  <span className="w-12 font-medium">
                    {isBest  && <span className="text-green-500 mr-1">▲</span>}
                    {isWorst && <span className="text-red-500 mr-1">▼</span>}
                    {lap.id}
                  </span>
                  <span className="font-mono">{formatTime(lap.diff)}</span>
                  <span className="font-mono text-gray-500">{formatTime(lap.time)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
