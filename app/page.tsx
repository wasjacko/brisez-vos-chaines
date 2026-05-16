"use client";

import { useEffect, useState } from "react";
import { ChainsScene } from "./ChainsScene";

const TASKS = [
  "PUCK 1 — Acquisiteur",
  "PUCK 2 — Setter",
  "PUCK 3 — Manageur",
  "Trouver un coach",
  "Produit vidéo pour Skool",
  "Stratégie / calendrier éditorial",
  "Coach d'anglais",
  "Traitement dentaire en cours",
  "Embaucher quelqu'un pour gérer les lives",
  "Dix posts Instagram come back",
  "10 story insta pour le come back",
  "La vidéo de présentation du school",
  "Un poids sous 70 kilos",
] as const;

const STORAGE_KEY = "chains.done.v1";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatTime(date: Date | null) {
  if (!date) return "11:46";
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function StatusBar() {
  const now = useNow();
  return (
    <div className="flex items-center justify-between px-7 pt-4 text-white">
      <div className="flex items-center gap-1.5 text-[17px] font-semibold tabular-nums">
        <span>{formatTime(now)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" opacity="0.35" />
          <rect x="9" y="3" width="3" height="8" rx="0.5" opacity="0.35" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" opacity="0.35" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden>
          <path d="M8 2.5a8.5 8.5 0 015.6 2.1l-1 1.2A7 7 0 008 4a7 7 0 00-4.6 1.7l-1-1.1A8.5 8.5 0 018 2.5zm0 3a5.5 5.5 0 013.5 1.3l-1 1.1A4 4 0 008 6.9a4 4 0 00-2.5.9l-1-1.1A5.5 5.5 0 018 5.5zm0 3a2.5 2.5 0 011.6.6L8 10.7 6.4 9.1A2.5 2.5 0 018 8.5z" />
        </svg>
        <div className="ml-1 relative">
          <div className="w-[26px] h-[12px] rounded-[3px] border border-white/55 flex items-center px-[1.5px]">
            <div className="h-[7px] w-[12px] rounded-[1.5px] bg-white/85" />
          </div>
          <div className="absolute -right-[3px] top-[3px] w-[1.5px] h-[6px] rounded-r bg-white/55" />
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ done }: { done: boolean }) {
  if (done) {
    return (
      <div className="w-7 h-7 rounded-full bg-[#ff3b30] flex items-center justify-center shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)] transition-all">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M3 7.5l2.8 2.8L11 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full border-[1.5px] border-white/35 transition-all" />
  );
}

export default function ChainsPage() {
  const [done, setDone] = useState<boolean[]>(() => TASKS.map(() => false));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        if (Array.isArray(parsed) && parsed.length === TASKS.length) {
          setDone(parsed);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {}
  }, [done, hydrated]);

  const broken = done.filter(Boolean).length;
  const total = TASKS.length;
  const allDone = broken === total;

  const toggle = (i: number) => {
    setDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const reset = () => {
    if (confirm("Réinitialiser tous les maillons ?")) {
      setDone(TASKS.map(() => false));
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full bg-black text-white overflow-x-hidden">
      <ChainsScene broken={done} />

      <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_60%_55%_at_center,transparent_0%,rgba(0,0,0,0.25)_70%,rgba(0,0,0,0.8)_100%)]" />

      <div className="relative z-[2] w-full max-w-[430px] mx-auto flex flex-col">
        <StatusBar />

        <div className="px-7 pt-4 text-center">
          <p
            className={`text-[11px] font-semibold tracking-[0.3em] mb-2 transition-colors ${
              allDone ? "text-amber-300" : "text-[#ff3b30]"
            }`}
            style={{ textShadow: "0 1px 14px rgba(0,0,0,0.7)" }}
          >
            {allDone ? "LIBÉRÉ" : "VERROUILLÉ"}
          </p>
          <h1
            className="text-[30px] leading-[1.05] font-semibold tracking-tight"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.7)" }}
          >
            {allDone ? "Le trône t'attend" : "Brisez vos chaînes"}
          </h1>
          <p
            className="mt-2 text-[13px] text-white/70 font-medium tabular-nums"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
          >
            {broken} / {total} maillons brisés
          </p>
        </div>

        <div className="h-[26dvh] min-h-[175px] flex-shrink-0" />

        <div className="px-4 mt-2">
          <div className="rounded-[26px] bg-[rgba(28,28,30,0.78)] backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
            {TASKS.map((task, i) => {
              const isDone = done[i] ?? false;
              const isLast = i === TASKS.length - 1;
              return (
                <div key={task}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="w-full flex items-center gap-4 px-5 py-[14px] text-left active:bg-white/[0.04] transition-colors"
                  >
                    <CheckCircle done={isDone} />
                    <span
                      className={`flex-1 text-[17px] font-medium leading-snug transition-all ${
                        isDone
                          ? "text-white/35 line-through decoration-white/35"
                          : "text-white"
                      }`}
                    >
                      {task}
                    </span>
                  </button>
                  {!isLast && <div className="ml-[60px] h-px bg-white/[0.07]" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-7 pt-8 pb-10 text-center">
          <p className="text-[13px] text-white/40 font-medium">
            Chaque maillon brisé te rapproche du trône.
          </p>
          {broken > 0 && (
            <button
              type="button"
              onClick={reset}
              className="mt-6 text-[12px] text-white/30 hover:text-white/60 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
