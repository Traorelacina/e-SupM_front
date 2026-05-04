// DefisPage.jsx — Page des défis e-Sup'M (public utilisateur)
import { useState } from "react";
import { publicGameApi } from "../../../src/api/index";
import {
  useGameData, GameLoader, GameError, GamePageLayout,
  StatusBadge, CountdownDisplay, WinModal, PointsPill, GAME_CSS
} from "./gameUtils";

// ─── Participation form ───────────────────────────────────────────────────────
function ParticipateForm({ defi, onSuccess, onClose }) {
  const [text, setText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!text.trim() && !videoUrl.trim()) { setError("Ajoutez votre participation (texte ou vidéo)."); return; }
    setLoading(true); setError("");
    try {
      await publicGameApi.defis.participate(defi.id, {
        submission_text: text || undefined,
        submission_video_url: videoUrl || undefined,
      });
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-lg rounded-3xl p-6 anim-slide-up"
        style={{ background: "#181818", border: "1px solid rgba(255,107,0,0.2)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="game-font text-white font-black text-xl">Ma participation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-4 rounded-2xl mb-4" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)" }}>
          <p className="text-orange-400 text-sm font-bold game-font mb-1">🎯 Le défi</p>
          <p className="text-gray-300 text-sm body-font leading-relaxed">{defi.challenge_text}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs font-bold body-font block mb-1.5">Votre réponse / texte</label>
            <textarea
              className="w-full rounded-xl p-3 text-white text-sm body-font resize-none h-28 focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Décrivez votre participation…"
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
            <span className="text-gray-500 text-xs">ou</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold body-font block mb-1.5">Lien vidéo (optionnel)</label>
            <input
              type="url"
              className="w-full rounded-xl p-3 text-white text-sm body-font focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="https://youtube.com/…"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3 body-font">{error}</p>}

        <button onClick={submit} disabled={loading} className="btn-orange w-full py-4 text-base mt-5">
          {loading ? "Envoi en cours…" : "🚀 Envoyer ma participation"}
        </button>
      </div>
    </div>
  );
}

// ─── Participant card (voting phase) ──────────────────────────────────────────
function ParticipantCard({ participant, hasVoted, onVote, isMyVote, loading }) {
  const pct = Math.min((participant.votes_count / Math.max(1, participant.votes_count + 1)) * 100, 100);

  return (
    <div className="game-card p-5 relative overflow-hidden">
      {isMyVote && (
        <div className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.3)", color: "#4ade80" }}>
          ✓ Mon vote
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black game-font"
          style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00" }}>
          {(participant.user?.name || "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{participant.user?.name || "Anonyme"}</p>
          <p className="text-gray-500 text-xs">{participant.votes_count} vote{participant.votes_count !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Submission */}
      {participant.submission_text && (
        <p className="text-gray-400 text-sm body-font mb-3 leading-relaxed line-clamp-3">
          {participant.submission_text}
        </p>
      )}
      {participant.submission_video_url && (
        <a href={participant.submission_video_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:underline mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l19 9-19 9V3z"/></svg>
          Voir la vidéo
        </a>
      )}

      {/* Vote bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF6B00, #FFD600)" }} />
      </div>

      {/* Vote button */}
      {!hasVoted && !participant.is_winner && (
        <button onClick={() => onVote(participant.id)} disabled={loading}
          className="btn-orange w-full py-3 text-sm">
          {loading ? "…" : "🗳️ Voter pour cette participation"}
        </button>
      )}
      {participant.is_winner && (
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold"
          style={{ background: "rgba(255,214,0,0.1)", color: "#FFD600" }}>
          🏆 Gagnant(e) !
        </div>
      )}
    </div>
  );
}

// ─── Defi Detail ──────────────────────────────────────────────────────────────
function DefiDetail({ defi, onBack }) {
  const { data: detail, loading, reload } = useGameData(() => publicGameApi.defis.get(defi.id));
  const { data: statusData } = useGameData(() => publicGameApi.defis.getUserStatus(defi.id));

  const [showForm, setShowForm] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [winModal, setWinModal] = useState(null);

  const hasParticipated = statusData?.has_participated;
  const hasVoted = statusData?.has_voted;

  const handleVote = async (participantId) => {
    setVoteLoading(true);
    try {
      await publicGameApi.defis.vote(defi.id, participantId);
      setFeedback({ ok: true, msg: "🗳️ Votre vote a bien été enregistré !" });
      reload();
    } catch (e) { setFeedback({ ok: false, msg: e.message }); }
    finally { setVoteLoading(false); }
  };

  if (loading) return <GameLoader text="Chargement du défi…" />;
  if (!detail) return null;
  const d = detail.data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.12), rgba(255,61,0,0.06))", border: "1px solid rgba(255,107,0,0.2)" }}>
        <div className="absolute top-4 right-4"><StatusBadge status={d.status} /></div>
        <div className="text-4xl mb-3">🎯</div>
        <h2 className="game-font text-2xl font-black text-white mb-2">{d.title}</h2>
        {d.description && <p className="text-gray-400 text-sm body-font mb-3 leading-relaxed">{d.description}</p>}

        <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.05)" }}>
          <p className="text-orange-400 text-xs font-bold mb-1">LE DÉFI :</p>
          <p className="text-white text-sm body-font leading-relaxed">{d.challenge_text}</p>
        </div>

        {d.challenge_video_url && (
          <a href={d.challenge_video_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-orange-400 hover:underline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l19 9-19 9V3z"/></svg>
            Voir la vidéo du défi
          </a>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <CountdownDisplay targetDate={d.status === "active" ? d.ends_at : d.voting_ends_at}
            label={d.status === "active" ? "Clôture dépôts" : "Fin des votes"} />
          {d.loyalty_points_prize > 0 && <PointsPill points={d.loyalty_points_prize} />}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-xl text-sm body-font ${feedback.ok ? "text-green-400" : "text-red-400"}`}
          style={{ background: feedback.ok ? "rgba(0,166,81,0.1)" : "rgba(232,0,29,0.1)" }}>
          {feedback.msg}
        </div>
      )}

      {/* Actions */}
      {d.status === "active" && !hasParticipated && (
        <button onClick={() => setShowForm(true)} className="btn-orange w-full py-4 text-base">
          🙋 Participer au défi
        </button>
      )}
      {d.status === "active" && hasParticipated && (
        <div className="p-4 rounded-2xl text-center text-green-400 font-bold body-font"
          style={{ background: "rgba(0,166,81,0.08)", border: "1px solid rgba(0,166,81,0.2)" }}>
          ✅ Votre participation est enregistrée — bonne chance !
        </div>
      )}

      {/* Participants (voting phase) */}
      {(d.status === "voting" || d.status === "closed") && d.participants?.length > 0 && (
        <div>
          <h3 className="game-font text-white font-black text-lg mb-3">
            {d.status === "voting" ? "🗳️ Votez pour votre favori !" : "🏆 Résultats"}
          </h3>
          <div className="space-y-3">
            {d.participants.map(p => (
              <ParticipantCard
                key={p.id} participant={p}
                hasVoted={hasVoted || d.status === "closed"}
                onVote={handleVote}
                isMyVote={false}
                loading={voteLoading}
              />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <ParticipateForm defi={d} onSuccess={() => { setShowForm(false); reload(); setFeedback({ ok: true, msg: "🎉 Participation envoyée !" }); }} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

// ─── Defi card (list) ─────────────────────────────────────────────────────────
function DefiCard({ defi, onClick }) {
  return (
    <button onClick={onClick} className="game-card w-full text-left p-5 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="game-font text-white font-black text-base">{defi.title}</h3>
            <StatusBadge status={defi.status} />
          </div>
          {defi.description && <p className="text-gray-500 text-xs body-font line-clamp-2 leading-relaxed">{defi.description}</p>}
        </div>
        <span className="text-3xl flex-shrink-0">🎯</span>
      </div>

      <div className="p-3 rounded-xl mb-3 text-sm body-font text-gray-400 line-clamp-2"
        style={{ background: "rgba(255,255,255,0.04)" }}>
        {defi.challenge_text}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>👥 {defi.participants_count || 0} participant{(defi.participants_count || 0) > 1 ? "s" : ""}</span>
          {defi.loyalty_points_prize > 0 && <PointsPill points={defi.loyalty_points_prize} />}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DefisPage({ onBack }) {
  const { data, loading, error, reload } = useGameData(() => publicGameApi.defis.list());
  const [selected, setSelected] = useState(null);
  const defis = data?.data?.data || [];

  return (
    <GamePageLayout back={onBack} hero={
      <div className="pt-8 pb-6 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(255,107,0,0.1) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-5xl mb-3 anim-float">🎯</div>
          <h1 className="game-font text-3xl font-black text-white mb-2">e-Sup'M Défis</h1>
          <p className="text-gray-400 text-sm body-font max-w-xs mx-auto">
            Relève les défis, fais voter la communauté et remporte des lots !
          </p>
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Chaque jeudi</span>
            <span>·</span>
            <span>2 semaines</span>
            <span>·</span>
            <span>Ouvert à tous</span>
          </div>
        </div>
      </div>
    }>
      {loading ? <GameLoader /> : error ? <GameError message={error} onRetry={reload} /> : (
        <>
          {selected ? (
            <div>
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors text-sm mb-5 font-semibold body-font">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M5 12l7 7M5 12l7-7"/></svg>
                Tous les défis
              </button>
              <DefiDetail defi={selected} onBack={() => setSelected(null)} />
            </div>
          ) : (
            <>
              {defis.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">😴</div>
                  <p className="game-font text-white font-bold text-xl mb-2">Aucun défi actif</p>
                  <p className="text-gray-500 text-sm body-font">Reviens chaque jeudi pour de nouveaux défis !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {defis.map(d => <DefiCard key={d.id} defi={d} onClick={() => setSelected(d)} />)}
                </div>
              )}
            </>
          )}
        </>
      )}
    </GamePageLayout>
  );
}