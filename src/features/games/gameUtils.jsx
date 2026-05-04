// ─── gameUtils.jsx — Shared game utilities, hooks & components ──────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { publicGameApi } from "../../../src/api/index";

// ─── Global CSS Variables (inject once via index.css or Layout) ───────────────
export const GAME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');

  :root {
    --g-orange: #FF6B00;
    --g-orange-light: #FF8C3A;
    --g-green: #00A651;
    --g-green-dark: #007A3D;
    --g-yellow: #FFD600;
    --g-red: #E8001D;
    --g-black: #0A0A0A;
    --g-card: #141414;
    --g-border: rgba(255,255,255,0.08);
    --g-text: #F5F5F0;
    --g-muted: #888884;
  }

  .game-font { font-family: 'Syne', sans-serif; }
  .body-font { font-family: 'Nunito', sans-serif; }

  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes slide-up {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes confetti-fall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  .anim-float { animation: float 3s ease-in-out infinite; }
  .anim-slide-up { animation: slide-up 0.5s ease-out forwards; }
  .anim-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

  .shimmer-text {
    background: linear-gradient(90deg, var(--g-orange), var(--g-yellow), var(--g-orange));
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 2s linear infinite;
  }

  .game-card {
    background: var(--g-card);
    border: 1px solid var(--g-border);
    border-radius: 20px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(255,107,0,0.15);
  }

  .btn-orange {
    background: var(--g-orange);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .btn-orange::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,0.15), transparent);
  }
  .btn-orange:hover { background: var(--g-orange-light); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255,107,0,0.4); }
  .btn-orange:active { transform: translateY(0); }
  .btn-orange:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-green {
    background: var(--g-green);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-green:hover { background: var(--g-green-dark); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,166,81,0.4); }
  .btn-green:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  .badge-active {
    background: rgba(0,166,81,0.15);
    border: 1px solid rgba(0,166,81,0.4);
    color: #4ade80;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .badge-closed {
    background: rgba(255,107,0,0.15);
    border: 1px solid rgba(255,107,0,0.3);
    color: var(--g-orange);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
  }
  .badge-voting {
    background: rgba(255,214,0,0.15);
    border: 1px solid rgba(255,214,0,0.3);
    color: var(--g-yellow);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
  }
`;

// ─── useGameData hook ─────────────────────────────────────────────────────────
export function useGameData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res);
    } catch (e) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
export function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s, raw: diff });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

// ─── Timer hook ───────────────────────────────────────────────────────────────
export function useTimer(initialSeconds, onExpire) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setRunning(true);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setRunning(false);
    clearInterval(ref.current);
  }, []);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(ref.current);
          setRunning(false);
          onExpire?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const pct = (seconds / initialSeconds) * 100;
  return { seconds, running, pct, start, stop };
}

// ─── Confetti component ───────────────────────────────────────────────────────
export function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: ["#FF6B00", "#FFD600", "#00A651", "#FF3D71", "#00CFFF"][i % 5],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 8}px`,
    shape: Math.random() > 0.5 ? "circle" : "square",
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── GameLoader ───────────────────────────────────────────────────────────────
export function GameLoader({ text = "Chargement…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
      </div>
      <p className="text-gray-400 text-sm body-font">{text}</p>
    </div>
  );
}

// ─── GameError ────────────────────────────────────────────────────────────────
export function GameError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center px-4">
      <span className="text-5xl">😕</span>
      <p className="text-white font-bold text-lg game-font">{message || "Une erreur est survenue"}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-orange px-6 py-3 text-sm">
          Réessayer
        </button>
      )}
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  if (status === "active") return <span className="badge-active"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />Actif</span>;
  if (status === "voting") return <span className="badge-voting">🗳 Vote</span>;
  if (status === "closed") return <span className="badge-closed">Clôturé</span>;
  return null;
}

// ─── CountdownDisplay ─────────────────────────────────────────────────────────
export function CountdownDisplay({ targetDate, label = "Se termine dans" }) {
  const t = useCountdown(targetDate);
  if (!t) return null;
  const units = [
    { v: t.d, l: "j" }, { v: t.h, l: "h" }, { v: t.m, l: "m" }, { v: t.s, l: "s" }
  ];
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-gray-500 body-font">{label}</p>
      <div className="flex gap-2">
        {units.filter((u, i) => i === 0 ? u.v > 0 : true).slice(0, 4).map(u => (
          <div key={u.l} className="text-center">
            <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 min-w-[36px] text-center">
              <span className="text-orange-400 font-mono font-bold text-sm">
                {String(u.v).padStart(2, "0")}
              </span>
            </div>
            <span className="text-gray-600 text-xs">{u.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WinModal ─────────────────────────────────────────────────────────────────
export function WinModal({ won, title, subtitle, prize, onClose }) {
  return (
    <>
      {won && <Confetti />}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="anim-bounce-in game-card max-w-sm w-full p-8 text-center relative overflow-hidden">
          {/* Glow */}
          <div className={`absolute inset-0 opacity-20 rounded-2xl ${won ? "bg-gradient-to-br from-orange-500 to-yellow-400" : "bg-gradient-to-br from-gray-700 to-gray-900"}`} />

          <div className="relative">
            <div className="text-7xl mb-4">{won ? "🏆" : "😔"}</div>
            <h2 className="game-font text-2xl font-black text-white mb-2">{title}</h2>
            <p className="body-font text-gray-400 text-sm mb-4">{subtitle}</p>

            {won && prize && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                <p className="text-orange-400 font-bold body-font">{prize}</p>
              </div>
            )}

            <button onClick={onClose} className={`${won ? "btn-orange" : "btn-green"} px-8 py-3 text-base w-full`}>
              {won ? "🎉 Super !" : "Réessayer plus tard"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Points pill ──────────────────────────────────────────────────────────────
export function PointsPill({ points }) {
  if (!points) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full body-font">
      ⭐ {points} pts fidélité
    </span>
  );
}

// ─── GamePageLayout ───────────────────────────────────────────────────────────
export function GamePageLayout({ children, hero, back }) {
  return (
    <div className="min-h-screen body-font" style={{ background: "var(--g-black)", color: "var(--g-text)" }}>
      <style>{GAME_CSS}</style>

      {/* Noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px",
      }} />

      {/* Back button */}
      {back && (
        <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: "rgba(10,10,10,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={back} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M5 12l7 7M5 12l7-7"/></svg>
            Retour aux jeux
          </button>
        </div>
      )}

      {hero}
      <div className="max-w-2xl mx-auto px-4 pb-20">{children}</div>
    </div>
  );
}