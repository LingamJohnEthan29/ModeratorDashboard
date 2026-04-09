'use client'
import { useState, useEffect, useRef, useCallback, use } from "react";
import "./ModeratorDashboard.css";

const SITUATION_TYPES = ["Spam Campaign","Hate Campaign","Misinformation","Coordinated Harassment","Phishing Ring","Bot Network","CSAM Signal","Radicalization Thread"];

const ALERT_MESSAGES = {
  "Spam Campaign": "AI detected 47 near-identical messages sent across 12 channels within 8 minutes. Message fingerprints share 94% structural similarity.",
  "Hate Campaign": "Coordinated slur deployment detected. 6 accounts posting synchronized hate speech targeting a specific ethnic group. NLP confidence: 98.2%.",
  "Misinformation": "Viral false claim about election results being amplified by a cluster of accounts created within the same 2-hour window.",
  "Coordinated Harassment": "Personal information of a user being shared across accounts with increasing frequency. 11 unique users involved in targeted pile-on.",
  "Phishing Ring": "Lookalike domain links being rotated across accounts to evade URL filters. Credential harvesting pattern confirmed.",
  "Bot Network": "Abnormal behavioral signatures: sub-100ms response times, 24/7 activity, identical device fingerprints across 8 accounts.",
  "CSAM Signal": "Image hash match against NCMEC database. Immediate escalation required. Zero tolerance protocol activated.",
  "Radicalization Thread": "Progressive ideological escalation detected over 72hrs. User cluster migrating from mainstream to extremist content.",
};

const generateUsers = (count) =>
  Array.from({ length: count }, () => ({
    id: "usr_" + Math.random().toString(36).slice(2, 8),
    name: ["shadow_echo","void_signal","neon_flux","null_byte","proxy_ghost","dark_node","anon_wave","cipher_run","ghost_link","bit_drift"][Math.floor(Math.random() * 10)],
  }));

const generateMessages = (type) => {
  const pools = {
    "Spam Campaign": ["INSANE DEAL ENDS TONIGHT bit.ly/xr99k","FREE CRYPTO just click here NOW!!","You have been selected! Claim your prize","Make $5000/day from home, no experience needed","URGENT: Your account will be deleted unless you verify"],
    "Hate Campaign": ["[REDACTED - hate speech]","They don't belong here. Never did.","[REDACTED - ethnic slur]","Share this everywhere before they delete it","These people are the problem with society"],
    "Misinformation": ["BREAKING: The election was stolen. Here's the proof [fake doc]","Mainstream media won't show you this.","My uncle works at CDC - the vaccine contains tracking chips","Official-looking graphic with fabricated statistics attached","Thread: Everything you were not supposed to know"],
  };
  return pools[type] || ["Message cluster 1 - similarity 97.3%","Message cluster 2 - similarity 94.8%","Forwarded 847 times in past 3 hours","Account created 6 days ago, 0 prior posts","IP geolocation anomaly detected"];
};

const SEED_DATA = Array.from({ length: 14 }, (_, i) => {
  const type = SITUATION_TYPES[i % SITUATION_TYPES.length];
  const risk = Math.floor(Math.random() * 100);
  return {
    id: "sit_" + Math.random().toString(36).slice(2, 10),
    type, risk,
    users: generateUsers(Math.floor(Math.random() * 8) + 2),
    alert: ALERT_MESSAGES[type],
    messages: generateMessages(type),
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
    similarity: Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 60),
    newFlag: false,
  };
}).sort((a, b) => b.risk - a.risk);

const riskColor = (risk) => {
  if (risk >= 70) return { bg: "#FF2D55", text: "#FF2D55", label: "HIGH", tier: "high" };
  if (risk >= 40) return { bg: "#FF9500", text: "#FF9500", label: "MED", tier: "medium" };
  return { bg: "#30D158", text: "#30D158", label: "LOW", tier: "low" };
};

const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return diff + "s ago";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  return Math.floor(diff / 3600) + "h ago";
};

const typeIcon = (type) => {
  const icons = { "Spam Campaign":"📧","Hate Campaign":"🔥","Misinformation":"📰","Coordinated Harassment":"🎯","Phishing Ring":"🪤","Bot Network":"🤖","CSAM Signal":"⚠️","Radicalization Thread":"📡" };
  return icons[type] || "⚡";
};

let toastId = 0;

function SituationCard({ situation, onAction, onToast }) {
  const [expanded, setExpanded] = useState(false);
  const [resolved, setResolved] = useState(null);
  const rc = riskColor(situation.risk);
  const emojis = ["👤","🧑","👩","🧔","👱"];

  const handleAction = (e, action) => {
    e.stopPropagation();
    setResolved(action);
    onAction(situation.id, action);
    const msgs = { delete: situation.messages.length + " messages deleted", ban: situation.users.length + " users banned", ignore: "Situation marked as ignored" };
    onToast(msgs[action]);
  };

  const visibleUsers = situation.users.slice(0, 4);
  const extra = situation.users.length - 4;

  return (
    <div className={"card" + (expanded ? " expanded" : "") + (situation.newFlag ? " new-flag" : "")} style={{ "--risk-color": rc.text }} onClick={() => setExpanded((x) => !x)}>
      <div className="card-header">
        <div className="type-icon">{typeIcon(situation.type)}</div>
        <div className="card-meta">
          <div className="card-type-row">
            <span className="card-type">{situation.type}</span>
            {situation.newFlag && <span className="new-badge">NEW</span>}
          </div>
          <div className="card-timestamp">{timeAgo(situation.timestamp)}</div>
        </div>
        <div className="risk-badge" style={{ color: rc.text, borderColor: rc.text + "55", background: rc.text + "15" }}>
          <div className="dot" style={{ background: rc.bg, boxShadow: "0 0 5px " + rc.bg }} />
          {rc.label}
        </div>
      </div>
      <div className="card-body">
        <div className="alert-box" style={{ borderColor: rc.text + "60" }}>{situation.alert}</div>
        <div className="progress-section">
          <div className="progress-label-row">
            <span className="progress-label">Risk Score</span>
            <span className="progress-value" style={{ color: rc.text }}>{situation.risk}/100</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: situation.risk + "%", background: "linear-gradient(90deg, " + rc.bg + "88, " + rc.bg + ")", color: rc.bg }} />
          </div>
        </div>
        <div className="users-row">
          <div className="avatars">
            {visibleUsers.map((u, i) => (
              <div key={u.id} className="avatar" title={u.name}><span style={{ fontSize: 14 }}>{emojis[i % emojis.length]}</span></div>
            ))}
            {extra > 0 && <div className="avatar avatar-overflow" style={{ fontSize: 9 }}>+{extra}</div>}
          </div>
          <span className="user-count-label">{situation.users.length} user{situation.users.length !== 1 ? "s" : ""} involved</span>
        </div>
      </div>
      {expanded && (
        <div className="expanded-body" onClick={(e) => e.stopPropagation()}>
          <p className="expanded-section-title">Flagged Messages</p>
          <div className="message-list">
            {situation.messages.map((msg, i) => (
              <div key={i} className="message-item">
                <span className="msg-index">#{i + 1}</span>
                <span className="msg-text">{msg}</span>
              </div>
            ))}
          </div>
          <p className="expanded-section-title">Message Similarity</p>
          <div className="similarity-list">
            {situation.similarity.map((sim, i) => (
              <div key={i} className="similarity-row">
                <span className="sim-label">Pair {i + 1}</span>
                <div className="sim-track"><div className="sim-fill" style={{ width: sim + "%" }} /></div>
                <span className="sim-value">{sim}%</span>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button className={"action-btn delete" + (resolved ? " resolved" : "")} onClick={(e) => handleAction(e, "delete")} disabled={!!resolved}>Delete</button>
            <button className={"action-btn ban" + (resolved ? " resolved" : "")} onClick={(e) => handleAction(e, "ban")} disabled={!!resolved}>Ban Users</button>
            <button className={"action-btn ignore" + (resolved ? " resolved" : "")} onClick={(e) => handleAction(e, "ignore")} disabled={!!resolved}>{resolved ? "Resolved" : "Ignore"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => <div key={t.id} className={"toast" + (t.exiting ? " exit" : "")}>{t.message}</div>)}
    </div>
  );
}

export default function ModeratorDashboard() {
  const [situations, setSituations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("risk-desc");
  const [toasts, setToasts] = useState([]);
  const intervalRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((message) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 3000);
  }, []);

  useEffect(() => {
    setSituations(SEED_DATA);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (Math.random() < 0.3) {
        const type = SITUATION_TYPES[Math.floor(Math.random() * SITUATION_TYPES.length)];
        const risk = Math.floor(Math.random() * 100);
        const newSit = {
          id: "sit_" + Math.random().toString(36).slice(2, 10),
          type, risk,
          users: generateUsers(Math.floor(Math.random() * 6) + 2),
          alert: ALERT_MESSAGES[type],
          messages: generateMessages(type),
          timestamp: new Date().toISOString(),
          similarity: Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 60),
          newFlag: true,
        };
        setSituations((prev) => [newSit, ...prev.slice(0, 19)]);
        addToast("New " + type + " detected - risk " + risk);
        setTimeout(() => setSituations((prev) => prev.map((s) => (s.id === newSit.id ? { ...s, newFlag: false } : s))), 3000);
      }
    }, 8000);
    return () => clearInterval(intervalRef.current);
  }, [addToast]);

  const handleAction = useCallback((id, action) => {
    if (action !== "ignore") setTimeout(() => setSituations((prev) => prev.filter((s) => s.id !== id)), 1200);
  }, []);

  const filtered = situations
    .filter((s) => {
      const rc = riskColor(s.risk);
      if (filter !== "all" && rc.tier !== filter) return false;
      if (search) { const q = search.toLowerCase(); return s.type.toLowerCase().includes(q) || s.alert.toLowerCase().includes(q); }
      return true;
    })
    .sort((a, b) => {
      if (sort === "risk-desc") return b.risk - a.risk;
      if (sort === "risk-asc") return a.risk - b.risk;
      if (sort === "newest") return new Date(b.timestamp) - new Date(a.timestamp);
      if (sort === "oldest") return new Date(a.timestamp) - new Date(b.timestamp);
      return 0;
    });

  const highCount = situations.filter((s) => s.risk >= 70).length;
  const medCount = situations.filter((s) => s.risk >= 40 && s.risk < 70).length;
  const lowCount = situations.filter((s) => s.risk < 40).length;

  return (
    <div className="dashboard-root">
      <div className="scanline" />
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">🛡</div>
          <div>
            <div className="header-title">Moderator Dashboard</div>
            <div className="header-subtitle">AI Threat Intelligence</div>
          </div>
        </div>
        <div className="header-center">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search situations, alerts..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="header-right">
          <div className="live-dot">LIVE</div>
          <div className="stat-pill"><span>Situations</span><span className="stat-pill-num">{situations.length}</span></div>
          <div className="stat-pill"><span className="stat-pill-num" style={{ color: "#FF2D55" }}>{highCount} HIGH</span></div>
        </div>
      </header>
      <div className="toolbar">
        <span className="toolbar-label">Filter</span>
        {[
          { id: "all", label: "All", color: null },
          { id: "high", label: "High (" + highCount + ")", color: "#FF2D55" },
          { id: "medium", label: "Medium (" + medCount + ")", color: "#FF9500" },
          { id: "low", label: "Low (" + lowCount + ")", color: "#30D158" },
        ].map((f) => (
          <button key={f.id} className={"filter-btn" + (filter === f.id ? " active-" + f.id : "")} onClick={() => setFilter(f.id)}>
            {f.color && <div className="dot" style={{ background: f.color }} />}
            {f.label}
          </button>
        ))}
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="risk-desc">Risk High First</option>
          <option value="risk-asc">Risk Low First</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
      <main className="main">
        <div className="results-label">{filtered.length} situation{filtered.length !== 1 ? "s" : ""} detected</div>
        <div className="grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛡</div>
              <div className="empty-text">No situations match your filters</div>
            </div>
          ) : (
            filtered.map((s) => <SituationCard key={s.id} situation={s} onAction={handleAction} onToast={addToast} />)
          )}
        </div>
      </main>
      <ToastContainer toasts={toasts} />
    </div>
  );
}