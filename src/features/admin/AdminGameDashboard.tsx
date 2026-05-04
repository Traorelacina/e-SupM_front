import { useState, useEffect, useCallback } from "react";
import { adminGameApi } from "../../api/index";
import {
  Gamepad2, Target, Ticket, RotateCcw, HelpCircle, Swords, DollarSign,
  Trophy, Users, Eye, Plus, CheckCircle, XCircle, Clock, BarChart3,
  Play, Pause, Settings, Award, ChevronRight, Loader2, AlertCircle,
  Calendar, Star, Zap,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fNum = (n: any) => Number(n || 0).toLocaleString("fr-FR");
const fmt = (d: any) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDT = (d: any) =>
  d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatusBadgeProps { status: string }
interface StatCardProps { icon: React.ElementType; label: string; value: any; sub?: string; color?: string }
interface GameSummaryCardProps { title: string; icon: React.ElementType; color: string; items: { label: string; val: any }[] }
interface ActionBtnProps { icon: React.ElementType; onClick: () => void; title: string; color?: string }
interface SmallBtnProps { children: React.ReactNode; onClick: () => void; color?: string }
interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }
interface ModalFooterProps { onClose: () => void; onSave: () => void; saving: boolean }
interface FormFieldProps { label: string; children: React.ReactNode }

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    active:  { label: "Actif",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    draft:   { label: "Brouillon",  cls: "bg-stone-100 text-stone-500 border-stone-200" },
    voting:  { label: "Vote",       cls: "bg-amber-100 text-amber-700 border-amber-200" },
    closed:  { label: "Clôturé",    cls: "bg-red-100 text-red-600 border-red-200" },
    pending: { label: "En attente", cls: "bg-blue-100 text-blue-600 border-blue-200" },
  };
  const s = map[status] || { label: status, cls: "bg-stone-100 text-stone-500 border-stone-200" };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${s.cls}`}>{s.label}</span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, sub, color = "text-amber-500" }) => (
  <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-3 hover:border-stone-300 hover:shadow-sm transition-all">
    <div className={`p-2 rounded-lg bg-stone-50 ${color}`}><Icon size={18} /></div>
    <div>
      <p className="text-2xl font-bold text-stone-900 font-mono">{fNum(value)}</p>
      <p className="text-xs text-stone-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Color Map ────────────────────────────────────────────────────────────────
const colorMap: Record<string, { border: string; text: string; bg: string; icon: string }> = {
  orange:  { border: "border-orange-200",  text: "text-orange-600",  bg: "bg-orange-50",  icon: "text-orange-500"  },
  purple:  { border: "border-purple-200",  text: "text-purple-600",  bg: "bg-purple-50",  icon: "text-purple-500"  },
  emerald: { border: "border-emerald-200", text: "text-emerald-600", bg: "bg-emerald-50", icon: "text-emerald-500" },
  red:     { border: "border-red-200",     text: "text-red-600",     bg: "bg-red-50",     icon: "text-red-500"     },
  amber:   { border: "border-amber-200",   text: "text-amber-600",   bg: "bg-amber-50",   icon: "text-amber-500"   },
  blue:    { border: "border-blue-200",    text: "text-blue-600",    bg: "bg-blue-50",    icon: "text-blue-500"    },
};

const GameSummaryCard: React.FC<GameSummaryCardProps> = ({ title, icon: Icon, color, items }) => {
  const c = colorMap[color] || colorMap.amber;
  return (
    <div className={`border ${c.border} rounded-xl p-4 ${c.bg}`}>
      <div className={`flex items-center gap-2 mb-3 ${c.text}`}>
        <Icon size={16} /><span className="font-semibold text-sm">{title}</span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex justify-between text-sm py-1.5 border-b border-white/80 last:border-0">
          <span className="text-stone-500">{item.label}</span>
          <span className="text-stone-900 font-mono font-bold">{fNum(item.val)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
export const inputCls = "w-full bg-white border border-stone-200 text-stone-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 placeholder-stone-400";

export const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-stone-500 text-xs font-medium">{label}</label>
    {children}
  </div>
);

export const ActionBtn: React.FC<ActionBtnProps> = ({ icon: Icon, onClick, title, color = "text-stone-400" }) => (
  <button onClick={onClick} title={title} className={`p-1.5 rounded-lg hover:bg-stone-100 transition-colors ${color}`}>
    <Icon size={14} />
  </button>
);

export const SmallBtn: React.FC<SmallBtnProps> = ({ children, onClick, color = "zinc" }) => {
  const cls: Record<string, string> = {
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    red:     "bg-red-600 hover:bg-red-700 text-white",
    amber:   "bg-amber-500 hover:bg-amber-600 text-white",
  };
  return (
    <button onClick={onClick} className={`px-3 py-1 text-xs rounded-lg transition-colors ${cls[color] || "bg-stone-200 hover:bg-stone-300 text-stone-700"}`}>
      {children}
    </button>
  );
};

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className={`bg-white border border-stone-200 rounded-2xl shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"} w-full max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-4 border-b border-stone-100">
        <h3 className="text-stone-900 font-semibold">{title}</h3>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
          <XCircle size={20} />
        </button>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  </div>
);

export const ModalFooter: React.FC<ModalFooterProps> = ({ onClose, onSave, saving }) => (
  <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
    <button onClick={onClose} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm rounded-lg transition-colors">Annuler</button>
    <button onClick={onSave} disabled={saving} className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2">
      {saving && <Loader2 size={14} className="animate-spin" />}Enregistrer
    </button>
  </div>
);

export const Loader = () => (
  <div className="flex items-center justify-center p-10">
    <Loader2 size={24} className="animate-spin text-brand-orange" />
  </div>
);

export const Empty = ({ msg }: { msg: string }) => (
  <div className="text-center py-10 text-stone-400 text-sm">{msg}</div>
);

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE — DASHBOARD OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
export function GamesDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGameApi.dashboard()
      .then(({ stats }: any) => { setStats(stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Gamepad2 size={24} className="text-brand-orange" />Jeux e-Sup'M
        </h1>
        <p className="text-stone-500 text-sm mt-1">Vue d'ensemble de tous les jeux concours</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Target}     label="Défis actifs"        value={stats?.defis?.active}                color="text-orange-500" />
        <StatCard icon={Ticket}     label="Cartes émises"       value={stats?.scratch_cards?.issued}        color="text-purple-500" />
        <StatCard icon={RotateCcw}  label="Tours roue/mois"     value={stats?.wheel?.spins_this_month}      color="text-blue-500"   />
        <StatCard icon={HelpCircle} label="Quiz actifs"         value={stats?.quiz?.active}                 color="text-emerald-500"/>
        <StatCard icon={Swords}     label="Battles actifs"      value={stats?.battle?.active}               color="text-red-500"    />
        <StatCard icon={DollarSign} label="Participants JP"     value={stats?.juste_prix?.participations}   color="text-amber-500"  />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GameSummaryCard title="Défis" icon={Target} color="orange" items={[
          { label: "Total défis",          val: stats?.defis?.total },
          { label: "En phase vote",         val: stats?.defis?.voting },
          { label: "Participants/semaine",  val: stats?.defis?.participants_this_week },
        ]} />
        <GameSummaryCard title="Cartes à gratter" icon={Ticket} color="purple" items={[
          { label: "Émises",               val: stats?.scratch_cards?.issued },
          { label: "Grattées",             val: stats?.scratch_cards?.scratched },
          { label: "Lots à réclamer",      val: stats?.scratch_cards?.prizes_unclaimed },
        ]} />
        <GameSummaryCard title="Quiz" icon={HelpCircle} color="emerald" items={[
          { label: "Sessions totales",     val: stats?.quiz?.sessions },
          { label: "Participations",       val: stats?.quiz?.participations },
          { label: "Gagnants",             val: stats?.quiz?.winners },
        ]} />
        <GameSummaryCard title="Battle / Vote" icon={Swords} color="red" items={[
          { label: "Battles totaux",       val: stats?.battle?.total },
          { label: "Votes aujourd'hui",    val: stats?.battle?.votes_today },
        ]} />
        <GameSummaryCard title="Juste Prix" icon={DollarSign} color="amber" items={[
          { label: "Sessions",             val: stats?.juste_prix?.sessions },
          { label: "Participations",       val: stats?.juste_prix?.participations },
          { label: "Gagnants",             val: stats?.juste_prix?.winners },
        ]} />
        <GameSummaryCard title="Roue e-Sup'M" icon={RotateCcw} color="blue" items={[
          { label: "Tours ce mois",        val: stats?.wheel?.spins_this_month },
          { label: "Configs actives",      val: stats?.wheel?.configs },
          { label: "Lots à réclamer",      val: stats?.wheel?.prizes_unclaimed },
        ]} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE — DÉFIS
// ══════════════════════════════════════════════════════════════════════════════
function DefiForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: "", challenge_text: "", starts_at: "", ends_at: "", voting_ends_at: "", loyalty_points_prize: 0,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await adminGameApi.defis.create(form); onSave(); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Nouveau Défi" onClose={onClose}>
      <FormField label="Titre *">
        <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Titre du défi" />
      </FormField>
      <FormField label="Description du défi *">
        <textarea className={inputCls + " h-24 resize-none"} value={form.challenge_text} onChange={e => set("challenge_text", e.target.value)} placeholder="Décrivez le défi..." />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Début"><input type="datetime-local" className={inputCls} value={form.starts_at} onChange={e => set("starts_at", e.target.value)} /></FormField>
        <FormField label="Fin dépôt"><input type="datetime-local" className={inputCls} value={form.ends_at} onChange={e => set("ends_at", e.target.value)} /></FormField>
        <FormField label="Fin vote"><input type="datetime-local" className={inputCls} value={form.voting_ends_at} onChange={e => set("voting_ends_at", e.target.value)} /></FormField>
      </div>
      <FormField label="Points fidélité (lot)">
        <input type="number" className={inputCls} value={form.loyalty_points_prize} onChange={e => set("loyalty_points_prize", e.target.value)} />
      </FormField>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

function DefiDetail({ defi, onClose }: { defi: any; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGameApi.defis.get(defi.id)
      .then(({ data }: any) => { setDetail(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [defi.id]);

  const awardWinner = async (participantId: number) => {
    await adminGameApi.defis.awardWinner(defi.id, participantId);
    onClose();
  };

  return (
    <Modal title={`Défi : ${defi.title}`} onClose={onClose} wide>
      {loading ? <Loader /> : (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-stone-500 text-xs mb-1">Description du défi</p>
              <p className="text-stone-900 text-sm bg-stone-50 rounded-lg p-3 border border-stone-100">{detail.challenge_text}</p>
            </div>
            <div className="text-right space-y-1">
              <StatusBadge status={detail.status} />
              <p className="text-xs text-stone-400">Vote jusqu'au {fmtDT(detail.voting_ends_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-stone-500 text-xs mb-2 font-medium">PARTICIPANTS ({detail.participants?.length || 0})</p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(detail.participants || []).map((p: any) => (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.is_winner ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50"}`}>
                  <div>
                    <p className="text-stone-900 text-sm font-medium">{p.user?.name}</p>
                    <p className="text-stone-400 text-xs">{p.submission_text?.slice(0, 60)}…</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-600 font-mono text-sm">{fNum(p.votes_count)} votes</span>
                    {p.is_winner
                      ? <span className="flex items-center gap-1 text-amber-600 text-xs"><Trophy size={12} />Gagnant</span>
                      : detail.status === "voting" && (
                          <button onClick={() => awardWinner(p.id)} className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg transition-colors">
                            Désigner gagnant
                          </button>
                        )
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function DefisPage() {
  const [defis, setDefis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminGameApi.defis.list()
      .then(({ data }: any) => { setDefis(data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: string) => {
    await adminGameApi.defis.setStatus(id, status);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Target size={22} className="text-orange-500" />Défis e-Sup'M
          </h1>
          <p className="text-stone-500 text-sm mt-1">Gérez les défis et participations</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />Nouveau défi
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl text-sm overflow-hidden shadow-sm">
        <div className="bg-stone-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-stone-500 text-xs font-medium border-b border-stone-200">
          <span className="col-span-4">TITRE</span>
          <span className="col-span-2">STATUT</span>
          <span className="col-span-2">PARTICIPANTS</span>
          <span className="col-span-2">FIN VOTE</span>
          <span className="col-span-2">ACTIONS</span>
        </div>
        {loading ? <Loader /> : defis.length === 0 ? <Empty msg="Aucun défi créé" /> :
          defis.map((d: any) => (
            <div key={d.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center border-t border-stone-100 hover:bg-stone-50 transition-colors">
              <div className="col-span-4">
                <p className="text-stone-900 font-medium truncate">{d.title}</p>
                <p className="text-stone-400 text-xs">{fmt(d.starts_at)} → {fmt(d.ends_at)}</p>
              </div>
              <div className="col-span-2"><StatusBadge status={d.status} /></div>
              <div className="col-span-2 text-stone-700 font-mono">{fNum(d.participants_count)}</div>
              <div className="col-span-2 text-stone-400 text-xs">{fmt(d.voting_ends_at)}</div>
              <div className="col-span-2 flex gap-1">
                <ActionBtn icon={Eye}    onClick={() => setSelected(d)} title="Voir" color="text-stone-400" />
                {d.status === "draft"  && <ActionBtn icon={Play}   onClick={() => setStatus(d.id, "active")} title="Activer"  color="text-emerald-500" />}
                {d.status === "active" && <ActionBtn icon={Users}  onClick={() => setStatus(d.id, "voting")} title="→ Vote"   color="text-amber-500"  />}
                {d.status === "voting" && <ActionBtn icon={Trophy} onClick={() => setStatus(d.id, "closed")} title="Clôturer" color="text-red-500"    />}
              </div>
            </div>
          ))
        }
      </div>

      {creating && <DefiForm onSave={() => { setCreating(false); load(); }} onClose={() => setCreating(false)} />}
      {selected && <DefiDetail defi={selected} onClose={() => { setSelected(null); load(); }} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE — CARTE À GRATTER
// ══════════════════════════════════════════════════════════════════════════════
export function ScratchPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [userId, setUserId] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminGameApi.scratch.list(),
      adminGameApi.scratch.stats(),
    ]).then(([c, s]: any) => {
      setCards(c.data?.data || []);
      setStats(s.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const triggerManual = async () => {
    if (!userId) return;
    setTriggering(true);
    try {
      await adminGameApi.scratch.triggerManual({ user_id: Number(userId), trigger_type: "manual" });
      setUserId(""); load();
    } finally { setTriggering(false); }
  };

  const claimPrize = async (id: number) => {
    await adminGameApi.scratch.claimPrize(id);
    load();
  };

  const prizeColor = (type: string) => ({
    points: "text-amber-600", voucher: "text-blue-600", travel: "text-purple-600",
    product: "text-emerald-600", delivery: "text-teal-600", empty: "text-stone-400",
  }[type] || "text-stone-500");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Ticket size={22} className="text-purple-500" />Carte à Gratter Digitale
        </h1>
        <p className="text-stone-500 text-sm mt-1">Suivi des cartes émises et lots à réclamer</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Ticket}      label="Cartes émises"   value={stats.totals?.issued}           color="text-purple-500" />
          <StatCard icon={CheckCircle} label="Grattées"        value={stats.totals?.scratched}        color="text-emerald-500" />
          <StatCard icon={AlertCircle} label="Lots à réclamer" value={stats.totals?.prizes_unclaimed} color="text-amber-500" />
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-white border border-purple-200 rounded-xl shadow-sm">
        <Zap size={18} className="text-purple-500 flex-shrink-0" />
        <input
          className={inputCls + " flex-1"} placeholder="ID utilisateur..."
          value={userId} onChange={e => setUserId(e.target.value)} type="number"
        />
        <button
          onClick={triggerManual} disabled={!userId || triggering}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {triggering && <Loader2 size={14} className="animate-spin" />}Déclencher manuellement
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden text-sm shadow-sm">
        <div className="bg-stone-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-stone-500 text-xs font-medium border-b border-stone-200">
          <span className="col-span-3">UTILISATEUR</span><span className="col-span-2">MOIS</span>
          <span className="col-span-2">DÉCLENCHEUR</span><span className="col-span-3">LOT</span><span className="col-span-2">ACTIONS</span>
        </div>
        {loading ? <Loader /> : cards.length === 0 ? <Empty msg="Aucune carte émise" /> :
          cards.map((c: any) => (
            <div key={c.id} className={`px-4 py-3 grid grid-cols-12 gap-2 items-center border-t border-stone-100 hover:bg-stone-50 ${c.is_scratched && c.prize_type === "empty" ? "opacity-50" : ""}`}>
              <div className="col-span-3">
                <p className="text-stone-900 font-medium">{c.user?.name}</p>
                <p className="text-stone-400 text-xs">{c.user?.email}</p>
              </div>
              <div className="col-span-2 text-stone-700 font-mono">{c.month_year}</div>
              <div className="col-span-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.trigger_type === "charity" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}>
                  {c.trigger_type}
                </span>
              </div>
              <div className="col-span-3">
                {c.is_scratched
                  ? <span className={`text-xs font-medium ${prizeColor(c.prize_type)}`}>{c.prize_label}</span>
                  : <span className="text-stone-400 text-xs italic">Non grattée</span>}
              </div>
              <div className="col-span-2">
                {c.is_scratched && c.prize_type !== "empty" && !c.prize_claimed &&
                  <button onClick={() => claimPrize(c.id)} className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors">
                    Marquer réclamé
                  </button>
                }
                {c.prize_claimed &&
                  <span className="text-xs text-stone-400 flex items-center gap-1"><CheckCircle size={12} />Réclamé</span>
                }
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE — ROUE E-SUP'M
// ══════════════════════════════════════════════════════════════════════════════
export function WheelPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [spins, setSpins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [spinForm, setSpinForm] = useState({ user_id: "", wheel_config_id: "" });
  const [lastPrize, setLastPrize] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminGameApi.wheel.configs(),
      adminGameApi.wheel.spins(),
    ]).then(([c, s]: any) => {
      setConfigs(c.data || []);
      setSpins(s.data?.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const spinManual = async () => {
    if (!spinForm.user_id || !spinForm.wheel_config_id) return;
    setSpinning(true);
    try {
      const res: any = await adminGameApi.wheel.spinManual({
        user_id: Number(spinForm.user_id),
        wheel_config_id: Number(spinForm.wheel_config_id),
      });
      if (res.data?.prize) { setLastPrize(res.data.prize); load(); }
    } finally { setSpinning(false); }
  };

  const claimPrize = async (id: number) => {
    await adminGameApi.wheel.claimPrize(id);
    load();
  };

  const prizeTypeColors: Record<string, string> = {
    delivery: "bg-teal-100 text-teal-700",
    points:   "bg-amber-100 text-amber-700",
    voucher:  "bg-blue-100 text-blue-700",
    travel:   "bg-purple-100 text-purple-700",
    empty:    "bg-stone-100 text-stone-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <RotateCcw size={22} className="text-blue-500" />Roue e-Sup'M
        </h1>
        <p className="text-stone-500 text-sm mt-1">Configurations et historique des tours</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configs.map((cfg: any) => (
          <div key={cfg.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-stone-900 font-semibold">{cfg.name}</p>
                <p className="text-stone-400 text-xs">
                  {cfg.wheel_type === "wholesale" ? "Grossiste/½ Gros" : "Standard"} — min {fNum(cfg.min_purchase_amount)} FCFA
                </p>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${cfg.is_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-400 border-stone-200"}`}>
                {cfg.is_active ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(cfg.prizes || []).slice(0, 8).map((p: any, i: number) => (
                <div key={i} className="text-center p-1.5 rounded-lg text-xs border" style={{ backgroundColor: p.color + "15", color: p.color, borderColor: p.color + "40" }}>
                  <span className="block font-medium leading-tight">{p.label}</span>
                  <span className="text-stone-400">{p.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Déclencher un spin */}
      <div className="p-4 bg-white border border-blue-200 rounded-xl space-y-3 shadow-sm">
        <p className="text-blue-600 font-semibold text-sm flex items-center gap-2">
          <Zap size={14} />Déclencher un tour manuellement
        </p>
        <div className="flex gap-3">
          <input
            type="number" placeholder="ID utilisateur"
            className={inputCls + " flex-1"}
            value={spinForm.user_id} onChange={e => setSpinForm(f => ({ ...f, user_id: e.target.value }))}
          />
          <select
            className={inputCls + " flex-1"}
            value={spinForm.wheel_config_id} onChange={e => setSpinForm(f => ({ ...f, wheel_config_id: e.target.value }))}
          >
            <option value="">— Choisir la roue —</option>
            {configs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={spinManual}
            disabled={!spinForm.user_id || !spinForm.wheel_config_id || spinning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {spinning ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}Tourner
          </button>
        </div>
        {lastPrize && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Trophy size={20} className="text-amber-500" />
            <div>
              <p className="text-amber-700 font-medium">{lastPrize.label}</p>
              <p className="text-stone-500 text-xs">Type : {lastPrize.type} — Valeur : {fNum(lastPrize.value)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden text-sm shadow-sm">
        <div className="bg-stone-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-stone-500 text-xs font-medium border-b border-stone-200">
          <span className="col-span-3">UTILISATEUR</span><span className="col-span-2">ROUE</span>
          <span className="col-span-2">MOIS</span><span className="col-span-3">LOT</span><span className="col-span-2">STATUT</span>
        </div>
        {loading ? <Loader /> : spins.length === 0 ? <Empty msg="Aucun tour de roue" /> :
          spins.map((s: any) => (
            <div key={s.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center border-t border-stone-100 hover:bg-stone-50">
              <div className="col-span-3">
                <p className="text-stone-900 font-medium">{s.user?.name}</p>
                <p className="text-stone-400 text-xs">{s.user?.email}</p>
              </div>
              <div className="col-span-2 text-stone-500 text-xs">{s.wheel_config?.name}</div>
              <div className="col-span-2 text-stone-700 font-mono text-xs">{s.month_year} #{s.spin_number}</div>
              <div className="col-span-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${prizeTypeColors[s.prize_type] || "bg-stone-100 text-stone-500"}`}>
                  {s.prize_label}
                </span>
              </div>
              <div className="col-span-2">
                {s.prize_claimed
                  ? <span className="text-stone-400 text-xs flex items-center gap-1"><CheckCircle size={12} />Réclamé</span>
                  : s.prize_type !== "empty" &&
                    <button onClick={() => claimPrize(s.id)} className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors">
                      Réclamer
                    </button>
                }
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE — QUIZ
// ══════════════════════════════════════════════════════════════════════════════
function QuizForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: "", theme: "alimentaire", description: "", starts_at: "", ends_at: "",
    time_limit_seconds: 60, min_score_to_win: 100, retry_delay_hours: 72, loyalty_points_prize: 0,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await adminGameApi.quiz.create(form); onSave(); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Nouveau Quiz" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Titre *">
          <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} />
        </FormField>
        <FormField label="Thème">
          <select className={inputCls} value={form.theme} onChange={e => set("theme", e.target.value)}>
            {["alimentaire", "nutrition", "production", "culture", "surprise"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Début"><input type="datetime-local" className={inputCls} value={form.starts_at} onChange={e => set("starts_at", e.target.value)} /></FormField>
        <FormField label="Fin"><input type="datetime-local" className={inputCls} value={form.ends_at} onChange={e => set("ends_at", e.target.value)} /></FormField>
        <FormField label="Durée (secondes)"><input type="number" className={inputCls} value={form.time_limit_seconds} onChange={e => set("time_limit_seconds", e.target.value)} /></FormField>
        <FormField label="Score min pour gagner (%)"><input type="number" min="1" max="100" className={inputCls} value={form.min_score_to_win} onChange={e => set("min_score_to_win", e.target.value)} /></FormField>
        <FormField label="Délai réessai (h)"><input type="number" className={inputCls} value={form.retry_delay_hours} onChange={e => set("retry_delay_hours", e.target.value)} /></FormField>
        <FormField label="Points fidélité lot"><input type="number" className={inputCls} value={form.loyalty_points_prize} onChange={e => set("loyalty_points_prize", e.target.value)} /></FormField>
      </div>
      <FormField label="Description">
        <textarea className={inputCls + " h-20 resize-none"} value={form.description} onChange={e => set("description", e.target.value)} />
      </FormField>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

function QuizDetail({ quiz, onClose }: { quiz: any; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingQ, setAddingQ] = useState(false);
  const [qForm, setQForm] = useState({
    question_text: "", type: "multiple_choice", points: 10,
    options: [{ text: "", is_correct: false }, { text: "", is_correct: false }],
  });

  const loadDetail = useCallback(() => {
    adminGameApi.quiz.get(quiz.id)
      .then(({ data }: any) => { setDetail(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [quiz.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const addOption = () => setQForm(f => ({ ...f, options: [...f.options, { text: "", is_correct: false }] }));
  const setOpt = (i: number, k: string, v: any) => setQForm(f => {
    const opts = [...f.options]; opts[i] = { ...opts[i], [k]: v }; return { ...f, options: opts };
  });

  const saveQuestion = async () => {
    await adminGameApi.quiz.addQuestion(quiz.id, qForm);
    setAddingQ(false);
    loadDetail();
  };

  return (
    <Modal title={`Quiz : ${quiz.title}`} onClose={onClose} wide>
      {loading ? <Loader /> : (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2"><span className="text-stone-500">Questions : </span><span className="text-stone-900 font-mono">{detail.questions_count}</span></div>
            <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2"><span className="text-stone-500">Participations : </span><span className="text-stone-900 font-mono">{detail.participations_count}</span></div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"><span className="text-stone-500">Gagnants : </span><span className="text-amber-600 font-mono">{detail.winners_count}</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-stone-500 text-xs font-medium">QUESTIONS</p>
              <button onClick={() => setAddingQ(!addingQ)} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                <Plus size={12} />Ajouter
              </button>
            </div>
            {addingQ && (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-3 mb-3">
                <textarea
                  className={inputCls + " resize-none h-16"} placeholder="Texte de la question"
                  value={qForm.question_text} onChange={e => setQForm(f => ({ ...f, question_text: e.target.value }))}
                />
                <div className="space-y-2">
                  {qForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="checkbox" checked={opt.is_correct} onChange={e => setOpt(i, "is_correct", e.target.checked)} className="accent-emerald-600" />
                      <input className={inputCls + " flex-1"} placeholder={`Option ${i + 1}`} value={opt.text} onChange={e => setOpt(i, "text", e.target.value)} />
                    </div>
                  ))}
                  <button onClick={addOption} className="text-xs text-stone-400 hover:text-stone-600">+ Option</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveQuestion} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors">Sauvegarder</button>
                  <button onClick={() => setAddingQ(false)} className="px-3 py-1 bg-stone-200 text-stone-700 text-xs rounded transition-colors">Annuler</button>
                </div>
              </div>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(detail.questions || []).map((q: any, i: number) => (
                <div key={q.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-900 text-sm font-medium">{i + 1}. {q.question_text}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(q.options || []).map((o: any) => (
                      <span key={o.id} className={`text-xs px-2 py-0.5 rounded-full ${o.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                        {o.option_text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function QuizPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminGameApi.quiz.list()
      .then(({ data }: any) => { setSessions(data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: string) => {
    await adminGameApi.quiz.setStatus(id, status);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <HelpCircle size={22} className="text-emerald-500" />Quiz e-Sup'M
          </h1>
          <p className="text-stone-500 text-sm mt-1">Gérez les sessions de quiz et questions</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />Nouveau quiz
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden text-sm shadow-sm">
        <div className="bg-stone-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-stone-500 text-xs font-medium border-b border-stone-200">
          <span className="col-span-3">TITRE</span><span className="col-span-2">THÈME</span>
          <span className="col-span-1">STATUT</span><span className="col-span-2">QUESTIONS</span>
          <span className="col-span-2">PARTICIPATIONS</span><span className="col-span-2">ACTIONS</span>
        </div>
        {loading ? <Loader /> : sessions.length === 0 ? <Empty msg="Aucun quiz créé" /> :
          sessions.map((s: any) => (
            <div key={s.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center border-t border-stone-100 hover:bg-stone-50">
              <div className="col-span-3">
                <p className="text-stone-900 font-medium">{s.title}</p>
                <p className="text-stone-400 text-xs">{fmt(s.starts_at)}</p>
              </div>
              <div className="col-span-2 text-stone-500 text-xs capitalize">{s.theme}</div>
              <div className="col-span-1"><StatusBadge status={s.status} /></div>
              <div className="col-span-2 text-stone-700 font-mono">{fNum(s.questions_count)}</div>
              <div className="col-span-2">
                <span className="text-stone-700 font-mono">{fNum(s.participations_count)}</span>
                <span className="text-stone-400 text-xs ml-2">({fNum(s.winners_count)} gagnants)</span>
              </div>
              <div className="col-span-2 flex gap-1">
                <ActionBtn icon={Settings} onClick={() => setSelected(s)} title="Gérer" color="text-stone-400" />
                {s.status === "draft"  && <ActionBtn icon={Play}  onClick={() => setStatus(s.id, "active")} title="Activer"  color="text-emerald-500" />}
                {s.status === "active" && <ActionBtn icon={Pause} onClick={() => setStatus(s.id, "closed")} title="Clôturer" color="text-red-500" />}
              </div>
            </div>
          ))
        }
      </div>

      {creating && <QuizForm onSave={() => { setCreating(false); load(); }} onClose={() => setCreating(false)} />}
      {selected && <QuizDetail quiz={selected} onClose={() => { setSelected(null); load(); }} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE — BATTLE
// ══════════════════════════════════════════════════════════════════════════════
function BattleForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: "", type: "product", starts_at: "", ends_at: "", loyalty_points_prize: 0,
    candidates: [{ name: "", description: "" }, { name: "", description: "" }],
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setC = (i: number, k: string, v: any) => setForm(f => {
    const c = [...f.candidates]; c[i] = { ...c[i], [k]: v }; return { ...f, candidates: c };
  });

  const save = async () => {
    setSaving(true);
    try { await adminGameApi.battle.create(form); onSave(); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Nouveau Battle" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Titre"><input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} /></FormField>
        <FormField label="Type">
          <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value)}>
            <option value="product">Produit</option>
            <option value="promo">Promo</option>
            <option value="team">Team</option>
          </select>
        </FormField>
        <FormField label="Début"><input type="datetime-local" className={inputCls} value={form.starts_at} onChange={e => set("starts_at", e.target.value)} /></FormField>
        <FormField label="Fin"><input type="datetime-local" className={inputCls} value={form.ends_at} onChange={e => set("ends_at", e.target.value)} /></FormField>
      </div>
      <p className="text-stone-500 text-xs font-medium mt-4 mb-2">CANDIDATS</p>
      {form.candidates.map((c, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 mb-2">
          <input className={inputCls} placeholder={`Candidat ${i + 1} — Nom`} value={c.name} onChange={e => setC(i, "name", e.target.value)} />
          <input className={inputCls} placeholder="Description (optionnel)" value={c.description} onChange={e => setC(i, "description", e.target.value)} />
        </div>
      ))}
      <button
        onClick={() => setForm(f => ({ ...f, candidates: [...f.candidates, { name: "", description: "" }] }))}
        className="text-xs text-stone-400 hover:text-stone-600 mb-3"
      >
        + Ajouter un candidat
      </button>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

export function BattlePage() {
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminGameApi.battle.list()
      .then(({ data }: any) => { setBattles(data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: string) => {
    await adminGameApi.battle.setStatus(id, status);
    load();
  };

  const closeBattle = async (id: number) => {
    await adminGameApi.battle.close(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Swords size={22} className="text-red-500" />e-Sup'M Battle
          </h1>
          <p className="text-stone-500 text-sm mt-1">Battles et votes en temps réel</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />Nouveau battle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <Loader /> : battles.length === 0 ? <Empty msg="Aucun battle créé" /> :
          battles.map((b: any) => (
            <div key={b.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-stone-900 font-semibold">{b.title}</p>
                  <p className="text-stone-400 text-xs">{b.type} — {fmt(b.starts_at)} → {fmt(b.ends_at)}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(b.candidates || []).map((c: any) => (
                  <div key={c.id} className={`p-2 rounded-lg border text-sm ${c.id === b.winner_candidate_id ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50"}`}>
                    <p className="text-stone-900 font-medium truncate">{c.name}</p>
                    <p className="text-stone-400 text-xs">{fNum(c.votes_count)} votes</p>
                    {c.id === b.winner_candidate_id &&
                      <span className="text-amber-600 text-xs flex items-center gap-1"><Trophy size={10} />Gagnant</span>
                    }
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <ActionBtn icon={Eye} onClick={() => setSelected(b)} title="Détails" color="text-stone-400" />
                {b.status === "draft"  && <SmallBtn onClick={() => setStatus(b.id, "active")} color="emerald">Activer</SmallBtn>}
                {b.status === "active" && <SmallBtn onClick={() => closeBattle(b.id)} color="red">Clôturer & Déclarer gagnant</SmallBtn>}
              </div>
            </div>
          ))
        }
      </div>

      {creating && <BattleForm onSave={() => { setCreating(false); load(); }} onClose={() => setCreating(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE — JUSTE PRIX
// ══════════════════════════════════════════════════════════════════════════════
function JustePrixForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ title: "", starts_at: "", ends_at: "", tolerance_percent: 5, loyalty_points_prize: 0 });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await adminGameApi.justePrix.create(form); onSave(); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Nouvelle session Juste Prix" onClose={onClose}>
      <FormField label="Titre"><input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Début"><input type="datetime-local" className={inputCls} value={form.starts_at} onChange={e => set("starts_at", e.target.value)} /></FormField>
        <FormField label="Fin"><input type="datetime-local" className={inputCls} value={form.ends_at} onChange={e => set("ends_at", e.target.value)} /></FormField>
        <FormField label="Tolérance (%)"><input type="number" min="0" max="50" className={inputCls} value={form.tolerance_percent} onChange={e => set("tolerance_percent", e.target.value)} /></FormField>
        <FormField label="Points fidélité lot"><input type="number" className={inputCls} value={form.loyalty_points_prize} onChange={e => set("loyalty_points_prize", e.target.value)} /></FormField>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

export function JustePrixPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminGameApi.justePrix.list()
      .then(({ data }: any) => { setGames(data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: string) => {
    await adminGameApi.justePrix.setStatus(id, status);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <DollarSign size={22} className="text-amber-500" />Juste Prix
          </h1>
          <p className="text-stone-500 text-sm mt-1">Sessions de devinette de prix</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />Nouvelle session
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden text-sm shadow-sm">
        <div className="bg-stone-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-stone-500 text-xs font-medium border-b border-stone-200">
          <span className="col-span-3">TITRE</span><span className="col-span-2">STATUT</span>
          <span className="col-span-2">PARTICIPANTS</span><span className="col-span-2">GAGNANTS</span>
          <span className="col-span-2">TOLÉRANCE</span><span className="col-span-1">ACTIONS</span>
        </div>
        {loading ? <Loader /> : games.length === 0 ? <Empty msg="Aucune session Juste Prix" /> :
          games.map((g: any) => (
            <div key={g.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center border-t border-stone-100 hover:bg-stone-50">
              <div className="col-span-3">
                <p className="text-stone-900 font-medium">{g.title}</p>
                <p className="text-stone-400 text-xs">{fmt(g.starts_at)} → {fmt(g.ends_at)}</p>
              </div>
              <div className="col-span-2"><StatusBadge status={g.status} /></div>
              <div className="col-span-2 text-stone-700 font-mono">{fNum(g.participations_count)}</div>
              <div className="col-span-2 text-amber-600 font-mono">{fNum(g.winners_count)}</div>
              <div className="col-span-2 text-stone-400 text-xs">±{g.tolerance_percent}%</div>
              <div className="col-span-1 flex gap-1">
                {g.status === "draft"  && <ActionBtn icon={Play}  onClick={() => setStatus(g.id, "active")} title="Activer"  color="text-emerald-500" />}
                {g.status === "active" && <ActionBtn icon={Pause} onClick={() => setStatus(g.id, "closed")} title="Clôturer" color="text-red-500" />}
              </div>
            </div>
          ))
        }
      </div>

      {creating && <JustePrixForm onSave={() => { setCreating(false); load(); }} onClose={() => setCreating(false)} />}
    </div>
  );
}