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
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

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

  const handleStartStop = () => setRunning((r) => !r);

  const handleLapReset = () => {
    if (running) {
      const lastLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
      setLaps((prev) => [
        ...prev,
        { id: prev.length + 1, time: elapsed, diff: elapsed - lastLapTime },
      ]);
    } else {
      setElapsed(0);
      elapsedRef.current = 0;
      setLaps([]);
    }
  };

  const minLap = laps.length > 1 ? Math.min(...laps.map((l) => l.diff)) : null;
  const maxLap = laps.length > 1 ? Math.max(...laps.map((l) => l.diff)) : null;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start pt-16 px-4">
      <h1 className="text-2xl font-semibold text-gray-400 mb-10 tracking-widest uppercase">
        Stopwatch
      </h1>

      <div className="text-8xl font-thin tabular-nums tracking-tight mb-12 select-none">
        {formatTime(elapsed)}
      </div>

      <div className="flex gap-16 mb-12">
        <button
          onClick={handleLapReset}
          className="w-20 h-20 rounded-full bg-gray-800 text-gray-200 font-medium text-lg active:scale-95 transition-transform"
        >
          {running ? "Lap" : "Reset"}
        </button>
        <button
          onClick={handleStartStop}
          className={`w-20 h-20 rounded-full font-medium text-lg active:scale-95 transition-transform ${
            running
              ? "bg-red-900 text-red-400 ring-2 ring-red-700"
              : "bg-green-900 text-green-400 ring-2 ring-green-700"
          }`}
        >
          {running ? "Stop" : "Start"}
        </button>
      </div>

      {laps.length > 0 && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-gray-500 text-sm px-1 pb-2 border-b border-gray-800">
            <span>Lap</span>
            <span>+Time</span>
            <span>Total</span>
          </div>
          <ul className="divide-y divide-gray-800">
            {[...laps].reverse().map((lap) => {
              const isBest = lap.diff === minLap;
              const isWorst = lap.diff === maxLap;
              return (
                <li
                  key={lap.id}
                  className={`flex justify-between py-3 px-1 text-base tabular-nums ${
                    isBest
                      ? "text-green-400"
                      : isWorst
                      ? "text-red-400"
                      : "text-gray-200"
                  }`}
                >
                  <span className="w-12">Lap {lap.id}</span>
                  <span>{formatTime(lap.diff)}</span>
                  <span>{formatTime(lap.time)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
