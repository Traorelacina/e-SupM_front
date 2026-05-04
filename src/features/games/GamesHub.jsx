// GamesHub.jsx — Page d'accueil des jeux e-Sup'M
import { useState, useEffect } from "react";
import { publicGameApi } from "../../../src/api/index";
import { GAME_CSS, GameLoader, useGameData, CountdownDisplay, PointsPill } from "./gameUtils";

// ─── Game card configs ────────────────────────────────────────────────────────
const GAME_DEFS = [
  {
    id: "defis",
    label: "e-Sup'M Défis",
    tagline: "Relève le défi, gagne des lots !",
    emoji: "🎯",
    color: "#FF6B00",
    glow: "rgba(255,107,0,0.3)",
    schedule: "Chaque jeudi · 2 semaines",
    tag: "ouvert à tous",
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "scratch",
    label: "Carte à Gratter",
    tagline: "Gratte et découvre ton lot !",
    emoji: "🎟️",
    color: "#FFD600",
    glow: "rgba(255,214,0,0.3)",
    schedule: "Cumul 15 000 FCFA/mois",
    tag: "conditionné achat",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    id: "wheel",
    label: "Roue e-Sup'M",
    tagline: "Tourne la roue, tente ta chance !",
    emoji: "🎡",
    color: "#00A651",
    glow: "rgba(0,166,81,0.3)",
    schedule: "1–2 fois par mois",
    tag: "conditionné achat",
    gradient: "from-green-600 to-teal-500",
  },
  {
    id: "quiz",
    label: "Quiz",
    tagline: "Teste tes connaissances alimentaires !",
    emoji: "🧠",
    color: "#7C3AED",
    glow: "rgba(124,58,237,0.3)",
    schedule: "Chaque mardi",
    tag: "ouvert à tous",
    gradient: "from-purple-600 to-indigo-600",
  },
  {
    id: "battle",
    label: "e-Sup'M Battle",
    tagline: "Vote pour ton produit préféré !",
    emoji: "⚔️",
    color: "#E8001D",
    glow: "rgba(232,0,29,0.3)",
    schedule: "Chaque mercredi",
    tag: "ouvert à tous",
    gradient: "from-red-600 to-pink-600",
  },
  {
    id: "justeprix",
    label: "Juste Prix",
    tagline: "Devine le prix exact, gagne !",
    emoji: "💰",
    color: "#0EA5E9",
    glow: "rgba(14,165,233,0.3)",
    schedule: "Tous les jours · chrono",
    tag: "ouvert à tous",
    gradient: "from-sky-500 to-blue-600",
  },
];

// ─── Floating particle ────────────────────────────────────────────────────────
function FloatParticle({ delay, top, left, color }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        top, left, backgroundColor: color, opacity: 0.4,
        animation: `float ${3 + Math.random() * 2}s ${delay}s ease-in-out infinite`,
      }}
    />
  );
}

// ─── My games stats banner ────────────────────────────────────────────────────
function MyStatsBanner() {
  const { data, loading } = useGameData(() => publicGameApi.myGames());
  if (loading || !data?.data) return null;
  const d = data.data;

  const stats = [
    { icon: "🎯", label: "Défis", val: d.defis?.participated || 0 },
    { icon: "🏆", label: "Victoires", val: (d.defis?.won || 0) + (d.quiz?.won || 0) + (d.juste_prix?.won || 0) },
    { icon: "🎟️", label: "Cartes", val: d.scratch_cards?.this_month || 0 },
    { icon: "🧠", label: "Quiz", val: d.quiz?.played || 0 },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {stats.map(s => (
        <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xl mb-1">{s.icon}</div>
          <div className="text-white font-black text-lg game-font leading-none">{s.val}</div>
          <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main GameCard ─────────────────────────────────────────────────────────────
function GameCard({ game, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      className="game-card w-full text-left p-5 group relative overflow-hidden"
      onClick={() => onSelect(game.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      {/* Glow bg */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at center, ${game.glow} 0%, transparent 70%)` }}
      />

      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full"
        style={{ background: `linear-gradient(135deg, ${game.color}, transparent)` }} />

      <div className="relative flex items-start gap-4">
        {/* Emoji bubble */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: `linear-gradient(135deg, ${game.color}22, ${game.color}11)`,
            border: `1.5px solid ${game.color}44`,
            boxShadow: hovered ? `0 0 20px ${game.glow}` : "none",
            transition: "box-shadow 0.3s",
          }}>
          {game.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="game-font text-white font-black text-base leading-tight">{game.label}</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${game.color}22`, color: game.color, border: `1px solid ${game.color}44` }}>
              {game.tag}
            </span>
          </div>
          <p className="text-gray-400 text-xs body-font mb-2 leading-relaxed">{game.tagline}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {game.schedule}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 self-center transition-transform group-hover:translate-x-1 duration-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={game.color} strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </button>
  );
}

// ─── Featured active game banner ──────────────────────────────────────────────
function FeaturedGame() {
  // Quick poll of active games
  const [activeGames, setActiveGames] = useState([]);
  useEffect(() => {
    Promise.allSettled([
      publicGameApi.defis.list(),
      publicGameApi.quiz.list(),
      publicGameApi.battle.list(),
    ]).then(results => {
      const games = [];
      results[0].value?.data?.data?.forEach(d => d.status === "active" && games.push({ type: "defis", data: d }));
      results[1].value?.data?.forEach(d => games.push({ type: "quiz", data: d }));
      results[2].value?.data?.data?.forEach(d => d.status === "active" && games.push({ type: "battle", data: d }));
      setActiveGames(games.slice(0, 3));
    });
  }, []);

  if (!activeGames.length) return null;

  const icons = { defis: "🎯", quiz: "🧠", battle: "⚔️" };
  const colors = { defis: "#FF6B00", quiz: "#7C3AED", battle: "#E8001D" };

  return (
    <div className="mb-6">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 body-font">🔴 En cours maintenant</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {activeGames.map((g, i) => (
          <div key={i} className="flex-shrink-0 rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[180px]"
            style={{ background: `${colors[g.type]}15`, border: `1px solid ${colors[g.type]}30` }}>
            <span className="text-xl">{icons[g.type]}</span>
            <div>
              <p className="text-white text-xs font-bold game-font leading-tight line-clamp-1">{g.data.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs">Actif</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GamesHub({ onNavigate }) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    delay: i * 0.4, top: `${10 + Math.random() * 80}%`, left: `${Math.random() * 100}%`,
    color: ["#FF6B00", "#FFD600", "#00A651", "#E8001D"][i % 4],
  }));

  return (
    <div className="min-h-screen body-font" style={{ background: "var(--g-black)", color: "var(--g-text)" }}>
      <style>{GAME_CSS}</style>

      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => <FloatParticle key={i} {...p} />)}
      </div>

      {/* Hero Header */}
      <div className="relative pt-12 pb-8 px-4 text-center overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at top, rgba(255,107,0,0.12) 0%, transparent 65%)",
        }} />

        {/* Logo */}
        <div className="relative inline-flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg, #FF6B00, #FF3D00)", boxShadow: "0 0 40px rgba(255,107,0,0.4)" }}>
              🎮
            </div>
            <div className="absolute inset-0 rounded-2xl" style={{
              background: "rgba(255,107,0,0.3)", filter: "blur(15px)", transform: "scale(1.2)",
              animation: "pulse-ring 2s ease-out infinite",
            }} />
          </div>
          <div className="text-left">
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">e-Sup'M</p>
            <h1 className="game-font text-3xl font-black text-white leading-none">
              <span className="shimmer-text">GAME</span>
            </h1>
          </div>
        </div>

        <p className="text-gray-400 text-sm body-font max-w-xs mx-auto leading-relaxed">
          Participe aux jeux, accumule des points et remporte des lots incroyables !
        </p>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* My stats */}
        <MyStatsBanner />

        {/* Active games */}
        <FeaturedGame />

        {/* Game grid */}
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 body-font">Tous les jeux</p>
        <div className="space-y-3">
          {GAME_DEFS.map(game => (
            <GameCard key={game.id} game={game} onSelect={onNavigate} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-2xl text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-gray-500 text-xs body-font leading-relaxed">
            📋 Les participants aux jeux doivent obligatoirement avoir un compte.
            Les votants également, afin d'être mieux récompensés.
          </p>
        </div>
      </div>
    </div>
  );
}