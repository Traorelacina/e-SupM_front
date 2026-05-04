// WheelPage.jsx — Roue e-Sup'M
import { useState, useRef, useEffect } from "react";
import { publicGameApi } from "../../../src/api/index";
import { useGameData, GameLoader, GameError, GamePageLayout, Confetti, GAME_CSS } from "./gameUtils";

// ─── Canvas Wheel ─────────────────────────────────────────────────────────────
function WheelCanvas({ prizes, spinning, targetAngle, onSpinEnd }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const currentAngle = useRef(0);
  const startTime = useRef(null);
  const duration = 4500;

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !prizes?.length) return;
    const ctx = canvas.getContext("2d");
    drawWheel(ctx, canvas.width / 2, currentAngle.current, prizes);
  }, [prizes]);

  // Spin animation
  useEffect(() => {
    if (!spinning) return;
    startTime.current = null;
    const totalRotation = 360 * 6 + targetAngle; // 6 full rotations + target

    const animate = (ts) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 4);
      const angle = eased * totalRotation;
      currentAngle.current = angle;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        drawWheel(ctx, canvas.width / 2, angle, prizes);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        currentAngle.current = targetAngle % 360;
        onSpinEnd?.();
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spinning, targetAngle]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full opacity-30"
        style={{ background: "conic-gradient(from 0deg, #FF6B00, #FFD600, #00A651, #FF6B00)", filter: "blur(20px)", transform: "scale(1.1)" }} />

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>
        <div style={{
          width: 0, height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: "32px solid #FF6B00",
          filter: "drop-shadow(0 4px 4px rgba(255,107,0,0.6))",
        }} />
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} width={300} height={300} className="relative z-10 rounded-full" />

      {/* Center hub */}
      <div className="absolute z-20 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #FF6B00, #FF3D00)", boxShadow: "0 0 20px rgba(255,107,0,0.5), 0 0 0 4px #0A0A0A" }}>
        <span className="text-white text-lg">⚡</span>
      </div>
    </div>
  );
}

function drawWheel(ctx, size, angle, prizes) {
  ctx.clearRect(0, 0, size * 2, size * 2);
  const cx = size, cy = size, r = size - 4;
  const segAngle = (2 * Math.PI) / prizes.length;
  const offset = (angle * Math.PI) / 180;

  prizes.forEach((prize, i) => {
    const start = segAngle * i + offset;
    const end = start + segAngle;

    // Segment
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = prize.color || defaultColors[i % defaultColors.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + segAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "white";
    ctx.font = `bold ${Math.max(9, Math.min(12, 200 / prizes.length))}px 'Syne', sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;

    const label = prize.label.length > 16 ? prize.label.slice(0, 14) + "…" : prize.label;
    ctx.fillText(label, r - 14, 4);
    ctx.restore();
  });

  // Outer border
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

const defaultColors = [
  "#FF6B00", "#00A651", "#7C3AED", "#0EA5E9", "#E8001D",
  "#F59E0B", "#EC4899", "#10B981", "#6366F1", "#EF4444",
];

// ─── Wheel Item ───────────────────────────────────────────────────────────────
function WheelItem({ config, onSpin }) {
  const [spinning, setSpinning] = useState(false);
  const [targetAngle, setTargetAngle] = useState(0);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState("");
  const [spinsLeft, setSpinsLeft] = useState(
    config.spins_per_month - config.spins_used
  );

  const typeLabels = { wholesale: "Grossiste / ½ Gros", standard: "Standard" };
  const typeColors = { wholesale: "#7C3AED", standard: "#00A651" };
  const color = typeColors[config.wheel_type] || "#FF6B00";

  const handleSpin = async () => {
    if (spinning || spinsLeft <= 0) return;
    setError(""); setResult(null); setShowResult(false);
    setSpinning(true);

    try {
      const res = await publicGameApi.wheel.spin(config.id);
      // Find the prize index to calculate target angle
      const prizeIdx = config.prizes.findIndex(p => p.label === res.prize.label);
      const segAngle = 360 / config.prizes.length;
      const prizeAngle = 360 - (prizeIdx * segAngle + segAngle / 2);
      setTargetAngle(prizeAngle);
      setResult(res);
      setSpinsLeft(prev => prev - 1);
      onSpin?.();
    } catch (e) {
      setError(e.message);
      setSpinning(false);
    }
  };

  const handleSpinEnd = () => {
    setSpinning(false);
    setTimeout(() => setShowResult(true), 300);
  };

  return (
    <div className="space-y-6">
      {/* Info bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
        <div>
          <p className="text-white font-black game-font text-base">{config.name}</p>
          <p className="text-gray-400 text-xs body-font">{typeLabels[config.wheel_type]}</p>
          <p className="text-gray-500 text-xs mt-0.5">Min. {Number(config.min_purchase_amount).toLocaleString("fr-FR")} FCFA</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black game-font" style={{ color }}>
            {spinsLeft}/{config.spins_per_month}
          </div>
          <p className="text-gray-500 text-xs">tours restants</p>
        </div>
      </div>

      {/* The wheel */}
      <div className="flex justify-center">
        <div className="w-[300px] h-[300px]">
          <WheelCanvas
            prizes={config.prizes}
            spinning={spinning}
            targetAngle={targetAngle}
            onSpinEnd={handleSpinEnd}
          />
        </div>
      </div>

      {/* Spin button */}
      {!showResult && (
        <button
          onClick={handleSpin}
          disabled={spinning || spinsLeft <= 0}
          className="btn-orange w-full py-5 text-lg relative overflow-hidden"
          style={{ borderRadius: "16px", boxShadow: spinning ? "none" : "0 0 30px rgba(255,107,0,0.3)" }}
        >
          {spinning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              La roue tourne…
            </span>
          ) : spinsLeft <= 0 ? (
            "✋ Plus de tours ce mois"
          ) : (
            <>🎡 TOURNER LA ROUE</>
          )}
        </button>
      )}

      {/* Result modal */}
      {showResult && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
          {result.prize.type !== "empty" && <Confetti />}
          <div className="w-full max-w-sm rounded-3xl p-8 text-center anim-bounce-in"
            style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-7xl mb-4">
              {result.prize.type === "points" ? "⭐" :
               result.prize.type === "voucher" ? "🎫" :
               result.prize.type === "delivery" ? "🚚" :
               result.prize.type === "travel" ? "✈️" : "🎯"}
            </div>
            <h3 className="game-font text-white font-black text-2xl mb-2">
              {result.prize.type !== "empty" ? "Félicitations !" : "Pas de chance !"}
            </h3>
            <p className="text-xl font-bold mb-4 body-font" style={{ color: result.prize.color || "#FF6B00" }}>
              {result.prize.label}
            </p>
            {result.prize.type !== "empty" && result.prize.value > 0 && (
              <p className="text-gray-400 text-sm mb-4 body-font">
                {result.prize.type === "points" ? `+${result.prize.value} points fidélité` : `${Number(result.prize.value).toLocaleString("fr-FR")} FCFA`}
              </p>
            )}
            <p className="text-gray-600 text-xs mb-6 body-font">Tours restants ce mois : {result.spins_left}</p>
            <button onClick={() => setShowResult(false)} className="btn-orange w-full py-4 text-base">
              {result.prize.type !== "empty" ? "🎉 Super !" : "OK"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center body-font">{error}</p>}

      {/* Prizes list */}
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 body-font">Lots possibles</p>
        <div className="grid grid-cols-2 gap-2">
          {config.prizes.map((p, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: `${p.color || "#FF6B00"}10`, border: `1px solid ${p.color || "#FF6B00"}25` }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || "#FF6B00" }} />
              <span className="text-xs text-gray-300 body-font leading-tight line-clamp-2">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────
function WheelHistory() {
  const { data, loading } = useGameData(() => publicGameApi.wheel.history());
  const spins = data?.data?.data || [];

  if (loading) return <GameLoader text="Chargement de l'historique…" />;
  if (!spins.length) return <div className="text-center py-8 text-gray-500 text-sm body-font">Aucun tour effectué.</div>;

  return (
    <div className="space-y-2">
      {spins.map(s => (
        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-2xl">
            {s.prize_type === "points" ? "⭐" : s.prize_type === "voucher" ? "🎫" : s.prize_type === "delivery" ? "🚚" : s.prize_type === "empty" ? "😔" : "🎁"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold body-font truncate">{s.prize_label}</p>
            <p className="text-gray-500 text-xs">{s.month_year} · Tour #{s.spin_number}</p>
          </div>
          {!s.prize_claimed && s.prize_type !== "empty" && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
              style={{ background: "rgba(0,166,81,0.1)", color: "#4ade80", border: "1px solid rgba(0,166,81,0.2)" }}>
              À réclamer
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function WheelPage({ onBack }) {
  const { data, loading, error, reload } = useGameData(() => publicGameApi.wheel.available());
  const [tab, setTab] = useState("play");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const wheels = data?.data || [];
  const available = wheels.filter(w => w.can_spin);
  const current = wheels[selectedIdx];

  return (
    <GamePageLayout back={onBack} hero={
      <div className="pt-8 pb-6 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(0,166,81,0.1) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-5xl mb-3" style={{ animation: "spin-slow 8s linear infinite" }}>🎡</div>
          <h1 className="game-font text-3xl font-black text-white mb-2">Roue e-Sup'M</h1>
          <p className="text-gray-400 text-sm body-font max-w-xs mx-auto">
            Tournez la roue et tentez de remporter des lots exclusifs !
          </p>
        </div>
      </div>
    }>
      {/* Tabs */}
      <div className="flex rounded-2xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.06)" }}>
        {["play", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all game-font"
            style={{ background: tab === t ? "#FF6B00" : "transparent", color: tab === t ? "white" : "#888" }}>
            {t === "play" ? "🎡 Jouer" : "📜 Historique"}
          </button>
        ))}
      </div>

      {tab === "play" && (
        <>
          {loading ? <GameLoader /> : error ? <GameError message={error} onRetry={reload} /> : wheels.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎡</div>
              <p className="game-font text-white font-black text-xl mb-2">Aucune roue disponible</p>
              <p className="text-gray-500 text-sm body-font leading-relaxed max-w-xs mx-auto">
                Effectuez des achats pour débloquer la roue ! (min. 15 000 FCFA/mois pour la roue standard, 50 000 FCFA pour la roue grossiste)
              </p>
            </div>
          ) : (
            <>
              {/* Wheel selector if multiple */}
              {wheels.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                  {wheels.map((w, i) => (
                    <button key={w.id} onClick={() => setSelectedIdx(i)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold body-font transition-all"
                      style={{
                        background: i === selectedIdx ? "#00A651" : "rgba(255,255,255,0.06)",
                        color: i === selectedIdx ? "white" : "#888",
                        border: i === selectedIdx ? "none" : "1px solid rgba(255,255,255,0.1)",
                      }}>
                      {w.name}
                      {w.can_spin && <span className="ml-2 w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />}
                    </button>
                  ))}
                </div>
              )}

              {current && <WheelItem key={current.id} config={current} onSpin={reload} />}
            </>
          )}
        </>
      )}

      {tab === "history" && <WheelHistory />}
    </GamePageLayout>
  );
}