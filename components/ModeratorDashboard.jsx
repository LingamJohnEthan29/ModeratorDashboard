'use client'
import { useState, useEffect, useRef, useCallback, use } from "react";
import "./ModeratorDashboard.css";
import socket from "@/lib/socket";


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
              <div style={{ fontSize: "11px", opacity: 0.7 }}>
    #{situation.roomId}
  </div>
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
          {/* 🔥 USER PROFILE SECTION */}
{ situation.userProfile && (
  <>
    <p className="expanded-section-title">User Profile</p>

    <div style={{
      fontSize: "12px",
      marginBottom: "12px",
      background: "#111",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #333"
    }}>
      <div><b>User:</b> {situation.userProfile.username}</div>

      <div><b>Messages:</b> {situation.userProfile.messageCount}</div>

      <div>
        <b>Spam Rate:</b>{" "}
        {((situation.userProfile?.spamRate || 0 )* 100).toFixed(1)}%
      </div>

      <div>
        <b>Toxic Rate:</b>{" "}
        {((situation.userProfile?.toxicRate || 0) * 100).toFixed(1)}%
      </div>

      <div>
        <b>Risk:</b>{" "}
        {((situation.userProfile.riskScore || 0)* 100).toFixed(0)}%
      </div>

      <div>
        <b>Status:</b>{" "}
        <span style={{
          color:
            situation.userProfile.riskScore > 0.7
              ? "#FF2D55"
              : situation.userProfile.riskScore > 0.4
              ? "#FF9500"
              : "#30D158",
          fontWeight : "bold"
        }}>
          {situation.userProfile.flag}
        </span>
      </div>
    </div>
  </>
)}
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
  const [, setMounted] = useState(false);
    const addToast = useCallback((message) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 3000);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

 useEffect(() => {
  socket.connect();

  socket.on("connect", () => {
    console.log("✅ Connected to backend");

    // ✅ JOIN ROOM AFTER CONNECT
    socket.emit("join_dashboard");
  });

  socket.on("moderation_event", (data) => {
    console.log("🔥 RECEIVED:", data);

    const newSituation = {
  id: data.clusterId,
  roomId: data.roomId || "unknown",

  type: data.type,
  risk: Math.floor(data.risk * 100),

  users: data.users.map((u) => ({
    id: u,
    name: u,
  })),

  alert: `[${data.roomId || "unknown"}] ${data.count} similar messages across ${data.users.length} users`,

  messages: data.messages,
  timestamp: data.timestamp,
  similarity: [85, 90, 88, 92, 87],
  newFlag: true,

  // 🔥 ADD USER PROFILE
  userProfile: data.userProfile || null,
};
    

    setSituations((prev) => {
      const index = prev.findIndex((s) => s.id === data.clusterId);

      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newSituation };
        return updated;
      }

      addToast(`${newSituation.type} detected - risk ${newSituation.risk}`);
      return [newSituation, ...prev.slice(0, 20)];
    });
  });

  return () => {
    socket.off("connect");
    socket.off("moderation_event");
    socket.disconnect();
  };
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