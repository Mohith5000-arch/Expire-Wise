import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ArrowDownUp, Bell, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, CreditCard, FileBadge, FileText, LayoutDashboard,
  Plus, Search, Settings2, ShieldCheck, Sparkles, Trash2, Pencil, X,
  RefreshCw, MoreHorizontal
} from "lucide-react";

const API = "/api";
const emptyForm = {
  name: "", kind: "document", category: "Identity", issuer: "",
  expiry_date: "", reminder_days: 30, notes: ""
};

const categories = {
  document: ["Identity", "Transport", "Education", "Insurance", "Finance", "Travel", "Other"],
  subscription: ["Entertainment", "Software", "Cloud", "Utilities", "Membership", "Other"]
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function daysLabel(item) {
  if (item.days_remaining < 0) return `${Math.abs(item.days_remaining)} days overdue`;
  if (item.days_remaining === 0) return "Expires today";
  if (item.days_remaining === 1) return "1 day left";
  return `${item.days_remaining} days left`;
}

function statusText(status) {
  return status === "expired" ? "Expired" : status === "expiring" ? "Expiring soon" : "Active";
}

function App() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, expired: 0, expiring: 0, active: 0, documents: 0, subscriptions: 0, upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeNav, setActiveNav] = useState("Overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [itemsRes, statsRes] = await Promise.all([
        fetch(`${API}/items`), fetch(`${API}/stats`)
      ]);
      if (!itemsRes.ok || !statsRes.ok) throw new Error("The API did not respond correctly.");
      setItems(await itemsRes.json());
      setStats(await statsRes.json());
    } catch (e) {
      setError("Couldn’t connect to the backend. Start the FastAPI server, then refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleItems = useMemo(() => {
    return items.filter(item => {
      const text = `${item.name} ${item.category} ${item.issuer || ""}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesKind = kindFilter === "all" || item.kind === kindFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesNav = activeNav === "Overview" ||
        (activeNav === "Documents" && item.kind === "document") ||
        (activeNav === "Subscriptions" && item.kind === "subscription");
      return matchesQuery && matchesKind && matchesStatus && matchesNav;
    });
  }, [items, query, kindFilter, statusFilter, activeNav]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name, kind: item.kind, category: item.category,
      issuer: item.issuer || "", expiry_date: item.expiry_date,
      reminder_days: item.reminder_days, notes: item.notes || ""
    });
    setModalOpen(true);
  }

  async function saveItem(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editing ? `${API}/items/${editing.id}` : `${API}/items`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, reminder_days: Number(form.reminder_days), issuer: form.issuer || null, notes: form.notes || null })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail?.[0]?.msg || payload.detail || "Could not save item.");
      setModalOpen(false);
      setToast(editing ? "Item updated successfully" : "Expiry added to your tracker");
      await loadData();
    } catch (e) {
      setToast(typeof e.message === "string" ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete “${item.name}” from your tracker?`)) return;
    try {
      const response = await fetch(`${API}/items/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setToast("Item deleted");
      await loadData();
    } catch {
      setToast("Could not delete this item");
    }
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><CalendarDays size={21} strokeWidth={2.5} /></div>
          <div><span className="brand-name">expirywise</span><span className="brand-caption">LIFE, IN ORDER.</span></div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Documents", icon: FileText },
            { name: "Subscriptions", icon: CreditCard }
          ].map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${activeNav === name ? "selected" : ""}`} onClick={() => setActiveNav(name)}>
              <Icon size={18} /><span>{name}</span>
              {name === "Documents" && <span className="nav-count">{stats.documents}</span>}
              {name === "Subscriptions" && <span className="nav-count">{stats.subscriptions}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-tip">
          <div className="tip-icon"><Sparkles size={17} /></div>
          <strong>Stay one step ahead</strong>
          <p>Keep renewals off your mind and on your calendar.</p>
          <button onClick={() => { setStatusFilter("expiring"); setActiveNav("Overview"); }}>View upcoming <span>↗</span></button>
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item muted" onClick={() => setToast("Settings are planned for a future version.")}><Settings2 size={18} /><span>Settings</span></button>
          <div className="profile">
            <div className="avatar">M</div>
            <div className="profile-text"><strong>My workspace</strong><span>Personal account</span></div>
            <MoreHorizontal size={18} className="profile-more" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{activeNav}</strong></div>
          <div className="topbar-right">
            <div className="today-label"><CalendarDays size={15} /> {today}</div>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => { setStatusFilter("expiring"); setToast("Showing items expiring within 30 days"); }}><Bell size={18} /><i /></button>
            <div className="top-avatar">M</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL EXPIRY HUB</div>
              <h1>Everything, <em>right on time.</em></h1>
              <p className="page-subtitle">A little less to remember. A lot more peace of mind.</p>
            </div>
            <button className="primary-button" onClick={openCreate}><Plus size={18} /> Add new expiry</button>
          </section>

          {error && <div className="error-banner"><AlertCircle size={18} /> {error} <button onClick={loadData}>Try again</button></div>}

          <section className="stats-grid">
            <StatCard label="Total tracked" value={stats.total} helper="Across all categories" icon={FileBadge} tone="lavender" />
            <StatCard label="Expiring soon" value={stats.expiring} helper="Within the next 30 days" icon={Clock3} tone="amber" />
            <StatCard label="Already expired" value={stats.expired} helper="Needs your attention" icon={AlertCircle} tone="rose" />
            <StatCard label="All up to date" value={stats.active} helper="More than 30 days left" icon={ShieldCheck} tone="mint" />
          </section>

          <section className="content-grid">
            <div className="list-panel panel">
              <div className="panel-heading">
                <div><h2>{activeNav === "Overview" ? "Your expiry list" : activeNav}</h2><p>Everything you’re keeping an eye on.</p></div>
                <button className="subtle-button" onClick={loadData}><RefreshCw size={15} /> Refresh</button>
              </div>

              <div className="toolbar">
                <label className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search documents, plans..." /></label>
                <label className="select-wrap"><select value={kindFilter} onChange={e => setKindFilter(e.target.value)}><option value="all">All types</option><option value="document">Documents</option><option value="subscription">Subscriptions</option></select><ChevronDown size={15} /></label>
                <label className="select-wrap"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="expiring">Expiring soon</option><option value="expired">Expired</option><option value="active">Active</option></select><ChevronDown size={15} /></label>
              </div>

              <div className="table-wrap">
                <table>
                  <thead><tr><th>ITEM</th><th>CATEGORY</th><th>EXPIRY DATE <ArrowDownUp size={12} /></th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan="5" className="empty-state"><div className="loader" />Loading your expiry list…</td></tr> :
                    visibleItems.length === 0 ? <tr><td colSpan="5" className="empty-state"><div className="empty-icon"><Search size={20} /></div><strong>No matching items</strong><span>Try a different filter or add a new expiry.</span></td></tr> :
                    visibleItems.map(item => <ItemRow key={item.id} item={item} onEdit={openEdit} onDelete={deleteItem} />)}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Showing <strong>{visibleItems.length}</strong> of <strong>{items.length}</strong> items</span><span className="live-dot">● <span>Live data</span></span></div>
            </div>

            <aside className="right-column">
              <div className="upcoming-panel panel">
                <div className="panel-heading compact"><div><h2>Coming up next</h2><p>Your next important dates.</p></div><span className="mini-calendar"><CalendarDays size={17} /></span></div>
                {stats.upcoming?.length ? <div className="upcoming-list">{stats.upcoming.slice(0, 4).map(item => (
                  <div className="upcoming-item" key={item.id}>
                    <div className={`upcoming-date ${item.status === "expiring" ? "date-soon" : ""}`}><span>{new Date(`${item.expiry_date}T00:00:00`).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</span><strong>{new Date(`${item.expiry_date}T00:00:00`).getDate()}</strong></div>
                    <div className="upcoming-info"><strong>{item.name}</strong><span>{item.kind === "document" ? "Official document" : "Subscription"}</span></div>
                    <span className={`tiny-status ${item.status}`}>{item.days_remaining === 0 ? "Today" : `${item.days_remaining}d`}</span>
                  </div>
                ))}</div> : <div className="upcoming-empty">Your upcoming dates will appear here.</div>}
                <button className="text-link" onClick={() => { setStatusFilter("expiring"); setActiveNav("Overview"); }}>See all upcoming <span>→</span></button>
              </div>

              <div className="reminder-card">
                <div className="reminder-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-calendar"><CalendarDays size={26} /><span /></div><Sparkles className="art-spark" size={19} /></div>
                <div className="reminder-copy"><span className="reminder-kicker">A GENTLE NUDGE</span><h3>Future you says thanks.</h3><p>Set a reminder early, and give yourself room to renew without the rush.</p></div>
                <button className="reminder-button" onClick={openCreate}>Plan a renewal <span>↗</span></button>
              </div>

              <div className="privacy-note"><ShieldCheck size={17} /><p><strong>Your information matters.</strong><br />This starter app stores data locally. Don’t enter sensitive document numbers.</p></div>
            </aside>
          </section>

          <footer className="page-footer"><span>Made for a more organized life <span className="footer-heart">♥</span></span><span>EXPIRYWISE <b>·</b> PERSONAL TRACKER</span></footer>
        </div>
      </main>

      {modalOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <form className="modal" onSubmit={saveItem}>
          <div className="modal-header"><div><span className="eyebrow">KEEP IT ON YOUR RADAR</span><h2>{editing ? "Edit expiry" : "Add a new expiry"}</h2><p>We’ll keep the important date easy to find.</p></div><button type="button" className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={19} /></button></div>
          <div className="form-grid">
            <label className="field full"><span>Name <b>*</b></span><input required maxLength="120" placeholder="e.g. Passport, Netflix plan" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
            <label className="field"><span>Type <b>*</b></span><select value={form.kind} onChange={e => setForm({...form, kind: e.target.value, category: categories[e.target.value][0]})}><option value="document">Official document</option><option value="subscription">Subscription</option></select></label>
            <label className="field"><span>Category <b>*</b></span><select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{categories[form.kind].map(c => <option key={c}>{c}</option>)}</select></label>
            <label className="field full"><span>Expiry date <b>*</b></span><input required type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} /></label>
            <label className="field full"><span>Issuer / provider</span><input maxLength="120" placeholder="e.g. RTO, service provider (optional)" value={form.issuer} onChange={e => setForm({...form, issuer: e.target.value})} /></label>
            <label className="field"><span>Remind me before</span><select value={form.reminder_days} onChange={e => setForm({...form, reminder_days: e.target.value})}><option value="0">On the expiry date</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label>
            <label className="field"><span>Notes</span><input maxLength="1000" placeholder="Optional note" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></label>
          </div>
          <div className="form-safety"><ShieldCheck size={16} /><span>Only enter the name and expiry date. Never add passwords or full document numbers.</span></div>
          <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : <>{editing ? <Check size={17} /> : <Plus size={17} />}{editing ? "Save changes" : "Add to tracker"}</>}</button></div>
        </form>
      </div>}
      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-label">{label}</div><div className="stat-bottom"><strong>{value}</strong><span>{helper}</span></div><div className={`stat-accent ${tone}`} /></div>;
}

function ItemRow({ item, onEdit, onDelete }) {
  const Icon = item.kind === "document" ? FileText : CreditCard;
  return <tr>
    <td><div className="item-cell"><div className={`item-icon ${item.kind}`}><Icon size={17} /></div><div className="item-text"><strong>{item.name}</strong><span>{item.issuer || (item.kind === "document" ? "Official document" : "Subscription")}</span></div></div></td>
    <td><span className="category-pill">{item.category}</span></td>
    <td><div className="date-cell"><strong>{formatDate(item.expiry_date)}</strong><span>{daysLabel(item)}</span></div></td>
    <td><span className={`status-pill ${item.status}`}><i />{statusText(item.status)}</span></td>
    <td><div className="row-actions"><button title="Edit" aria-label={`Edit ${item.name}`} onClick={() => onEdit(item)}><Pencil size={15} /></button><button title="Delete" aria-label={`Delete ${item.name}`} onClick={() => onDelete(item)}><Trash2 size={15} /></button></div></td>
  </tr>;
}

export default App;
