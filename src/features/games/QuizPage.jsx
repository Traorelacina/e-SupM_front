// QuizPage.jsx — Quiz e-Sup'M avec chrono
import { useState, useEffect, useCallback } from "react";
import { publicGameApi } from "../../../src/api/index";
import { useGameData, GameLoader, GameError, GamePageLayout, Confetti, PointsPill, useTimer, GAME_CSS } from "./gameUtils";

// ─── Timer ring ───────────────────────────────────────────────────────────────
function TimerRing({ seconds, total, danger = false }) {
  const pct = (seconds / total) * 100;
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = danger ? "#E8001D" : pct > 50 ? "#00A651" : "#FF6B00";

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90 absolute inset-0">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          strokeLinecap="round" />
      </svg>
      <span className={`text-lg font-black game-font ${danger ? "text-red-400" : "text-white"}`}>{seconds}</span>
    </div>
  );
}

// ─── Option button ────────────────────────────────────────────────────────────
function OptionBtn({ option, selected, answered, isCorrect, onSelect, disabled }) {
  let bg = "rgba(255,255,255,0.04)", border = "rgba(255,255,255,0.1)", textColor = "var(--g-text)";

  if (selected && !answered) { bg = "rgba(255,107,0,0.15)"; border = "#FF6B00"; textColor = "#FF8C3A"; }
  if (answered) {
    if (isCorrect) { bg = "rgba(0,166,81,0.15)"; border = "#00A651"; textColor = "#4ade80"; }
    else if (selected && !isCorrect) { bg = "rgba(232,0,29,0.15)"; border = "#E8001D"; textColor = "#f87171"; }
  }

  return (
    <button onClick={() => !disabled && !answered && onSelect(option.id)}
      disabled={disabled || answered}
      className="w-full text-left p-4 rounded-2xl text-sm body-font font-semibold transition-all"
      style={{ background: bg, border: `1.5px solid ${border}`, color: textColor, cursor: (disabled || answered) ? "default" : "pointer" }}>
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
          style={{ background: border + "33", color: border, border: `1px solid ${border}55` }}>
          {answered && isCorrect ? "✓" : answered && selected ? "✗" : String.fromCharCode(65 + (option.order - 1))}
        </div>
        <span>{option.option_text}</span>
      </div>
    </button>
  );
}

// ─── Quiz Play Screen ─────────────────────────────────────────────────────────
function QuizPlay({ quizData, onComplete }) {
  const questions = quizData.questions || [];
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null); // per-question result
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const q = questions[qIndex];
  const isLast = qIndex === questions.length - 1;

  const { seconds, pct, start, stop } = useTimer(
    quizData.time_limit_seconds || 60,
    () => handleSubmitAll() // timer expired = submit whatever we have
  );

  useEffect(() => { start(); return () => stop(); }, []);

  const handleSelect = (optionId) => {
    if (answered) return;
    setSelectedOption(optionId);
    setAnswered(true);
    setAnswers(prev => ({ ...prev, [q.id]: { question_id: q.id, option_id: optionId } }));

    // Show if correct
    const correct = q.options?.find(o => o.is_correct);
    setResult({ isCorrect: correct?.id === optionId, correctId: correct?.id });
  };

  const next = () => {
    setSelectedOption(null);
    setAnswered(false);
    setResult(null);
    if (isLast) {
      handleSubmitAll();
    } else {
      setQIndex(i => i + 1);
    }
  };

  const handleSubmitAll = async () => {
    stop();
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    try {
      const payload = Object.values(answers);
      const res = await publicGameApi.quiz.submit(quizData.id, {
        answers: payload,
        time_taken_seconds: timeTaken,
      });
      onComplete(res);
    } catch (e) {
      onComplete({ won: false, score_percent: 0, correct_count: 0, total: questions.length, message: e.message });
    }
  };

  if (!q) return null;

  return (
    <div className="space-y-5">
      {/* Progress & Timer */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 body-font">
            <span>Question {qIndex + 1} / {questions.length}</span>
            <span className="text-gray-600">{Math.round(((qIndex) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((qIndex + 1) / questions.length) * 100}%`, background: "linear-gradient(90deg, #7C3AED, #EC4899)" }} />
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <TimerRing seconds={seconds} total={quizData.time_limit_seconds || 60} danger={seconds <= 10} />
        </div>
      </div>

      {/* Question */}
      <div className="p-5 rounded-2xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full body-font"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
            {q.points || 10} pts
          </span>
          <span className="text-xs text-gray-500 body-font">{q.type === "true_false" ? "Vrai / Faux" : "Choix multiple"}</span>
        </div>
        <p className="text-white font-bold text-base leading-relaxed game-font">{q.question_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {(q.options || []).map(opt => (
          <OptionBtn
            key={opt.id}
            option={opt}
            selected={selectedOption === opt.id}
            answered={answered}
            isCorrect={result?.correctId === opt.id}
            onSelect={handleSelect}
            disabled={submitting}
          />
        ))}
      </div>

      {/* Explanation after answer */}
      {answered && q.explanation && (
        <div className="p-4 rounded-xl anim-slide-up"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-xs text-gray-500 font-bold mb-1 body-font">💡 Explication</p>
          <p className="text-gray-300 text-sm body-font leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {/* Next / Submit */}
      {answered && (
        <button onClick={next} disabled={submitting} className="btn-orange w-full py-4 text-base anim-slide-up">
          {submitting ? "Envoi des réponses…" : isLast ? "🏁 Voir mes résultats" : "Suite →"}
        </button>
      )}
    </div>
  );
}

// ─── Quiz Results ─────────────────────────────────────────────────────────────
function QuizResults({ result, quizId, onBack }) {
  const [tab, setTab] = useState("result");
  const { data: lb } = useGameData(() => publicGameApi.quiz.leaderboard(quizId), [quizId]);

  return (
    <div className="space-y-5">
      {result.won && <Confetti />}

      {/* Big result card */}
      <div className="p-8 rounded-3xl text-center relative overflow-hidden"
        style={{
          background: result.won ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))" : "rgba(255,255,255,0.04)",
          border: result.won ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
        }}>
        <div className="text-7xl mb-4 anim-bounce-in">{result.won ? "🏆" : "📊"}</div>
        <h2 className="game-font text-3xl font-black text-white mb-2">{result.score_percent}%</h2>
        <p className="text-gray-400 body-font mb-1">
          {result.correct_count} bonne{result.correct_count > 1 ? "s" : ""} réponse{result.correct_count > 1 ? "s" : ""} / {result.total}
        </p>
        <p className={`font-bold text-sm body-font mb-4 ${result.won ? "text-green-400" : "text-orange-400"}`}>
          {result.message}
        </p>
        {result.won && result.loyalty_points_won > 0 && (
          <PointsPill points={result.loyalty_points_won} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        {["result", "leaderboard"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all game-font"
            style={{ background: tab === t ? "#7C3AED" : "transparent", color: tab === t ? "white" : "#888" }}>
            {t === "result" ? "Mon résultat" : "🏅 Classement"}
          </button>
        ))}
      </div>

      {tab === "leaderboard" && (
        <div className="space-y-2">
          {(lb?.data || []).slice(0, 10).map((entry, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: i === 0 ? "rgba(255,214,0,0.08)" : "rgba(255,255,255,0.04)", border: i === 0 ? "1px solid rgba(255,214,0,0.2)" : "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black game-font"
                style={{ background: i === 0 ? "#FFD600" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(255,255,255,0.1)", color: i < 3 ? "#000" : "#fff" }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold body-font truncate">{entry.user?.name}</p>
                <p className="text-gray-500 text-xs">{entry.correct_answers} bonnes réponses</p>
              </div>
              <span className="text-right">
                <p className="text-white font-black game-font">{Math.round(entry.score_percent)}%</p>
                {entry.won && <p className="text-green-400 text-xs">🏆 Gagné</p>}
              </span>
            </div>
          ))}
        </div>
      )}

      <button onClick={onBack} className="btn-green w-full py-4 text-base">
        ← Retour aux quiz
      </button>
    </div>
  );
}

// ─── Quiz Session card ────────────────────────────────────────────────────────
function QuizCard({ session, onClick }) {
  const themes = { alimentaire: "🥗", nutrition: "💊", production: "🏭", culture: "📚", surprise: "🎲" };

  return (
    <button onClick={onClick} className="game-card w-full text-left p-5 group">
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
          {themes[session.theme] || "🧠"}
        </div>
        <div className="flex-1">
          <h3 className="game-font text-white font-black text-base mb-1">{session.title}</h3>
          <p className="text-gray-500 text-xs body-font capitalize">{session.theme}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" className="flex-shrink-0 group-hover:translate-x-1 transition-transform">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>

      <div className="flex items-center gap-4 text-xs body-font text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {session.time_limit_seconds}s
        </span>
        <span>{session.questions_count || "?"} questions</span>
        <span>{session.participations_count || 0} participant{(session.participations_count || 0) > 1 ? "s" : ""}</span>
        {session.loyalty_points_prize > 0 && <PointsPill points={session.loyalty_points_prize} />}
      </div>
    </button>
  );
}

// ─── Quiz Detail + Play ───────────────────────────────────────────────────────
function QuizDetail({ session, onBack }) {
  const { data, loading } = useGameData(() => publicGameApi.quiz.get(session.id));
  const [playing, setPlaying] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  if (loading) return <GameLoader text="Préparation du quiz…" />;
  if (!data?.data) return null;
  const q = data.data;

  if (quizResult) return <QuizResults result={quizResult} quizId={session.id} onBack={onBack} />;

  if (playing) {
    return <QuizPlay quizData={q} onComplete={(r) => { setPlaying(false); setQuizResult(r); }} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.06))", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="text-4xl mb-3">🧠</div>
        <h2 className="game-font text-2xl font-black text-white mb-2">{q.title}</h2>
        {q.description && <p className="text-gray-400 text-sm body-font mb-4 leading-relaxed">{q.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Questions", val: q.questions?.length || "?" },
            { label: "Durée", val: `${q.time_limit_seconds}s` },
            { label: "Score mini", val: `${q.min_score_to_win || 100}%` },
            { label: "Participants", val: q.participations_count || 0 },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white font-black text-xl game-font">{s.val}</p>
              <p className="text-gray-500 text-xs body-font">{s.label}</p>
            </div>
          ))}
        </div>

        {q.loyalty_points_prize > 0 && (
          <div className="mt-4 flex justify-center"><PointsPill points={q.loyalty_points_prize} /></div>
        )}
      </div>

      {/* Can play or not */}
      {!q.can_play && q.next_play_at ? (
        <div className="p-4 rounded-2xl text-center"
          style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)" }}>
          <p className="text-orange-400 font-bold body-font mb-1">⏳ Réessai disponible :</p>
          <p className="text-white text-sm body-font">
            {new Date(q.next_play_at).toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-gray-500 text-xs mt-1">(délai de {Math.round((q.retry_delay_hours || 72))}h entre chaque tentative)</p>
        </div>
      ) : (
        <button onClick={() => setPlaying(true)} className="btn-orange w-full py-5 text-lg"
          style={{ boxShadow: "0 0 30px rgba(124,58,237,0.25)", background: "#7C3AED" }}>
          🧠 Commencer le quiz
        </button>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function QuizPage({ onBack }) {
  const { data, loading, error, reload } = useGameData(() => publicGameApi.quiz.list());
  const [selected, setSelected] = useState(null);
  const sessions = data?.data || [];

  return (
    <GamePageLayout back={onBack} hero={
      <div className="pt-8 pb-6 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(124,58,237,0.1) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-5xl mb-3 anim-float">🧠</div>
          <h1 className="game-font text-3xl font-black text-white mb-2">Quiz e-Sup'M</h1>
          <p className="text-gray-400 text-sm body-font max-w-xs mx-auto">
            Teste tes connaissances alimentaires, remporte des points et des lots !
          </p>
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500 body-font">
            <span>Chaque mardi</span><span>·</span><span>Chronométré</span><span>·</span><span>Ouvert à tous</span>
          </div>
        </div>
      </div>
    }>
      {loading ? <GameLoader /> : error ? <GameError message={error} onRetry={reload} /> : (
        <>
          {selected ? (
            <div>
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors text-sm mb-5 font-semibold body-font">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M5 12l7 7M5 12l7-7"/></svg>
                Tous les quiz
              </button>
              <QuizDetail session={selected} onBack={() => setSelected(null)} />
            </div>
          ) : (
            <>
              {sessions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">📅</div>
                  <p className="game-font text-white font-black text-xl mb-2">Aucun quiz actif</p>
                  <p className="text-gray-500 text-sm body-font">Reviens chaque mardi pour un nouveau quiz !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => <QuizCard key={s.id} session={s} onClick={() => setSelected(s)} />)}
                </div>
              )}
            </>
          )}
        </>
      )}
    </GamePageLayout>
  );
}