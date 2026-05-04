// ScratchCardPage.jsx — Carte à gratter digitale e-Sup'M
import { useState, useRef, useEffect, useCallback } from "react";
import { publicGameApi } from "../../../src/api/index";
import { useGameData, GameLoader, GameError, GamePageLayout, Confetti, GAME_CSS } from "./gameUtils";

// ─── Interactive scratch canvas ───────────────────────────────────────────────
function ScratchCanvas({ onReveal, revealed }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealPct, setRevealPct] = useState(0);
  const [autoRevealed, setAutoRevealed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw the scratch surface
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#C8A93A");
    grad.addColorStop(0.5, "#FFD700");
    grad.addColorStop(1, "#C8943A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texture dots
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text
    ctx.fillStyle = "rgba(100, 70, 0, 0.5)";
    ctx.font = `bold ${canvas.width * 0.07}px 'Syne', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GRATTEZ ICI", canvas.width / 2, canvas.height / 2);
    ctx.font = `${canvas.width * 0.05}px 'Nunito', sans-serif`;
    ctx.fillText("✦ ✦ ✦", canvas.width / 2, canvas.height * 0.65);
  }, [revealed]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const scratch = useCallback((e) => {
    if (!isDrawing || revealed) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Check reveal percentage
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const total = imgData.data.length / 4;
    let transparent = 0;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] < 128) transparent++;
    }
    const pct = Math.round((transparent / total) * 100);
    setRevealPct(pct);

    if (pct > 55 && !autoRevealed) {
      setAutoRevealed(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setRevealPct(100);
      onReveal();
    }
  }, [isDrawing, revealed, autoRevealed, onReveal]);

  if (revealed) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair rounded-2xl"
      style={{ touchAction: "none" }}
      onMouseDown={() => setIsDrawing(true)}
      onMouseUp={() => setIsDrawing(false)}
      onMouseMove={scratch}
      onTouchStart={e => { setIsDrawing(true); }}
      onTouchEnd={() => setIsDrawing(false)}
      onTouchMove={scratch}
    />
  );
}

// ─── Prize Display ────────────────────────────────────────────────────────────
const PRIZE_CONFIG = {
  points:   { emoji: "⭐", color: "#FFD600", glow: "rgba(255,214,0,0.4)", label: "Points fidélité" },
  voucher:  { emoji: "🎫", color: "#00A651", glow: "rgba(0,166,81,0.4)", label: "Bon de réduction" },
  delivery: { emoji: "🚚", color: "#0EA5E9", glow: "rgba(14,165,233,0.4)", label: "Livraison offerte" },
  travel:   { emoji: "✈️", color: "#7C3AED", glow: "rgba(124,58,237,0.4)", label: "Voyage" },
  hotel:    { emoji: "🏨", color: "#F59E0B", glow: "rgba(245,158,11,0.4)", label: "Séjour hôtel" },
  product:  { emoji: "🎁", color: "#EC4899", glow: "rgba(236,72,153,0.4)", label: "Produit offert" },
  empty:    { emoji: "😔", color: "#6B7280", glow: "rgba(107,114,128,0.2)", label: "" },
};

function PrizeReveal({ card }) {
  const cfg = PRIZE_CONFIG[card.prize_type] || PRIZE_CONFIG.empty;
  const won = card.prize_type !== "empty";

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {won && <Confetti />}
      <div className="relative">
        <div className="text-7xl anim-bounce-in">{cfg.emoji}</div>
        {won && (
          <div className="absolute inset-0 rounded-full" style={{
            background: cfg.glow, filter: "blur(25px)", transform: "scale(1.5)", animation: "pulse-ring 2s ease-out infinite",
          }} />
        )}
      </div>
      <div className="text-center">
        {won ? (
          <>
            <p className="game-font text-white font-black text-2xl mb-1">Félicitations !</p>
            <p className="text-lg body-font font-bold" style={{ color: cfg.color }}>{card.prize_label}</p>
            {card.prize_value > 0 && (
              <p className="text-gray-400 text-sm mt-1 body-font">
                {card.prize_type === "points" ? `+${card.prize_value} points` : `Valeur : ${Number(card.prize_value).toLocaleString("fr-FR")} FCFA`}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="game-font text-gray-300 font-black text-xl mb-1">Pas de chance !</p>
            <p className="text-gray-500 text-sm body-font">Retentez votre chance le mois prochain.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Single Card Component ────────────────────────────────────────────────────
function ScratchCardItem({ card, onScratched }) {
  const [scratching, setScratching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localCard, setLocalCard] = useState(card);
  const [error, setError] = useState("");

  const handleReveal = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await publicGameApi.scratch.reveal(card.id);
      setLocalCard(prev => ({
        ...prev,
        is_scratched: true,
        prize_type: res.prize_type,
        prize_label: res.prize_label,
        prize_value: res.prize_value,
      }));
      onScratched?.();
    } catch (e) { setError(e.message); setScratching(false); }
    finally { setLoading(false); }
  };

  const isExpired = localCard.expires_at && new Date(localCard.expires_at) < new Date();
  const triggerLabels = { purchase: "Achat mensuel", charity: "Don charity", manual: "Cadeau" };

  return (
    <div className="game-card overflow-hidden">
      {/* Card top bar */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs body-font">{localCard.month_year}</p>
          <p className="text-white font-bold text-sm game-font">Carte à Gratter</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold body-font"
          style={{ background: "rgba(255,214,0,0.1)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.2)" }}>
          {triggerLabels[localCard.trigger_type] || localCard.trigger_type}
        </span>
      </div>

      {/* Scratch area */}
      <div className="mx-5 mb-5">
        <div className="relative rounded-2xl overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #1a1a1a, #222)" }}>
          {/* Prize content (behind scratch surface) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {localCard.is_scratched ? (
              <PrizeReveal card={localCard} />
            ) : (
              <div className="text-center text-gray-600">
                <p className="text-4xl mb-2">🎟️</p>
                <p className="text-xs body-font">Grattez pour révéler votre lot</p>
              </div>
            )}
          </div>

          {/* Scratch canvas overlay */}
          {!localCard.is_scratched && !isExpired && (
            <ScratchCanvas revealed={localCard.is_scratched} onReveal={handleReveal} />
          )}

          {/* Expired overlay */}
          {isExpired && !localCard.is_scratched && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
              <div className="text-center">
                <p className="text-gray-500 text-3xl mb-2">⏰</p>
                <p className="text-gray-400 text-sm body-font font-bold">Carte expirée</p>
              </div>
            </div>
          )}
        </div>

        {/* Tap to reveal fallback */}
        {!localCard.is_scratched && !isExpired && (
          <button onClick={() => { setScratching(true); handleReveal(); }} disabled={loading}
            className="w-full text-center text-xs text-gray-600 mt-2 body-font hover:text-orange-400 transition-colors">
            {loading ? "⏳ Chargement…" : "Appuyez ici pour gratter ou utilisez votre doigt"}
          </button>
        )}

        {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyCards() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4 anim-float">🎟️</div>
      <h3 className="game-font text-white font-black text-xl mb-3">Aucune carte disponible</h3>
      <p className="text-gray-500 text-sm body-font leading-relaxed max-w-xs mx-auto">
        Vous obtenez une carte à gratter lorsque votre total d'achats atteint <strong className="text-orange-400">15 000 FCFA</strong> par mois, ou lors d'un don charity de <strong className="text-orange-400">5 000 FCFA</strong>.
      </p>

      {/* Progress hint */}
      <div className="mt-6 p-4 rounded-2xl mx-auto max-w-xs"
        style={{ background: "rgba(255,214,0,0.06)", border: "1px solid rgba(255,214,0,0.15)" }}>
        <div className="flex justify-between text-xs body-font text-gray-400 mb-1.5">
          <span>Progression mensuelle</span>
          <span className="text-yellow-400">0 / 15 000 FCFA</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full w-0 rounded-full" style={{ background: "linear-gradient(90deg, #FFD600, #FF6B00)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ScratchCardPage({ onBack }) {
  const { data, loading, error, reload } = useGameData(() => publicGameApi.scratch.list());
  const cards = data?.data || [];
  const unscratched = cards.filter(c => !c.is_scratched && (!c.expires_at || new Date(c.expires_at) > new Date()));
  const scratched = cards.filter(c => c.is_scratched);

  return (
    <GamePageLayout back={onBack} hero={
      <div className="pt-8 pb-6 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(255,214,0,0.08) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-5xl mb-3 anim-float">🎟️</div>
          <h1 className="game-font text-3xl font-black text-white mb-2">Carte à Gratter</h1>
          <p className="text-gray-400 text-sm body-font max-w-xs mx-auto mb-3">
            Grattez et découvrez votre lot instantanément !
          </p>
          {/* Stats */}
          {cards.length > 0 && (
            <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-full text-xs body-font"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-yellow-400 font-bold">{unscratched.length} à gratter</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-400">{scratched.length} grattée{scratched.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
    }>
      {loading ? <GameLoader /> : error ? <GameError message={error} onRetry={reload} /> : (
        <>
          {cards.length === 0 ? <EmptyCards /> : (
            <div className="space-y-4">
              {/* Unscratched first */}
              {unscratched.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest body-font">
                    🎯 À gratter ({unscratched.length})
                  </p>
                  {unscratched.map(c => (
                    <ScratchCardItem key={c.id} card={c} onScratched={reload} />
                  ))}
                </>
              )}

              {/* Already scratched */}
              {scratched.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest body-font mt-6">
                    Historique ({scratched.length})
                  </p>
                  {scratched.slice(0, 5).map(c => (
                    <div key={c.id} className="game-card p-4 flex items-center gap-4">
                      <div className="text-3xl">{(PRIZE_CONFIG[c.prize_type] || PRIZE_CONFIG.empty).emoji}</div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm body-font">{c.prize_label || "—"}</p>
                        <p className="text-gray-500 text-xs">{c.month_year}</p>
                      </div>
                      {c.prize_type !== "empty" && !c.prize_claimed && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(0,166,81,0.1)", color: "#4ade80", border: "1px solid rgba(0,166,81,0.2)" }}>
                          À réclamer
                        </span>
                      )}
                      {c.prize_claimed && <span className="text-gray-600 text-xs">✓ Réclamé</span>}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </GamePageLayout>
  );
}

const PRIZE_CONFIG = {
  points: { emoji: "⭐" }, voucher: { emoji: "🎫" }, delivery: { emoji: "🚚" },
  travel: { emoji: "✈️" }, hotel: { emoji: "🏨" }, product: { emoji: "🎁" }, empty: { emoji: "😔" },
};