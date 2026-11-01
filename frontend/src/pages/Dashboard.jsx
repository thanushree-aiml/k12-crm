import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api.js';

const USER_TYPES = ['Parent', 'Student', 'School'];
const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const STATUSES = ['New', 'In Progress', 'Resolved'];
const LIMIT = 10;

export default function Dashboard() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, New: 0, 'In Progress': 0, Resolved: 0 });
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [userType, setUserType] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const logout = useCallback(() => { clearToken(); nav('/admin/login'); }, [nav]);

  const loadStats = useCallback(async () => {
    try { setStats(await api('/inquiries/stats', { auth: true })); } catch (e) { if (e.status === 401) logout(); }
  }, [logout]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const q = new URLSearchParams({ page, limit: LIMIT });
    if (category) q.set('category', category);
    if (userType) q.set('user_type', userType);
    if (debounced) q.set('search', debounced);
    try {
      const res = await api(`/inquiries?${q}`, { auth: true });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      if (err.status === 401) return logout();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, category, userType, debounced, logout]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  async function changeStatus(id, status) {
    try {
      await api(`/inquiries/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
      setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
      setSelected((s) => (s && s.id === id ? { ...s, status } : s));
      loadStats();
    } catch (err) {
      if (err.status === 401) return logout();
      setError(err.message);
    }
  }

  const pages = Math.max(Math.ceil(total / LIMIT), 1);
  const reset = () => { setCategory(''); setUserType(''); setSearch(''); setPage(1); };
  const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <div className="row between">
        <div>
          <h1>Inquiry Dashboard</h1>
          <p className="muted">Manage and track every inquiry in one place</p>
        </div>
        <button className="btn secondary" onClick={logout}>Logout</button>
      </div>

      <div className="stats">
        <div className="stat s-total"><b>{stats.total}</b><span>Total</span></div>
        <div className="stat s-new"><b>{stats.New}</b><span>New</span></div>
        <div className="stat s-prog"><b>{stats['In Progress']}</b><span>In Progress</span></div>
        <div className="stat s-done"><b>{stats.Resolved}</b><span>Resolved</span></div>
      </div>

      <div className="filters">
        <input placeholder="🔍 Search by name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={userType} onChange={(e) => { setUserType(e.target.value); setPage(1); }}>
          <option value="">All user types</option>
          {USER_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button className="btn secondary" onClick={reset}>Reset</button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Email</th><th>User Type</th><th>Category</th><th>Date</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="center">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="8" className="center">No inquiries found</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td><b>{r.name}</b></td>
                <td>{r.phone}</td>
                <td>{r.email}</td>
                <td><span className="tag">{r.user_type}</span></td>
                <td><span className="tag cat">{r.category}</span></td>
                <td>{fmt(r.created_at)}</td>
                <td>
                  <select className={`badge ${r.status.replace(' ', '')}`} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="link" onClick={() => setSelected(r)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row pager">
        <button className="btn secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
        <span>Page {page} of {pages}</span>
        <button className="btn secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <h2>{selected.name}</h2>
              <button className="link" onClick={() => setSelected(null)}>✕</button>
            </div>
            <p className="muted">{selected.user_type} · {selected.category} · {fmt(selected.created_at)}</p>
            <p><b>Email:</b> {selected.email}<br /><b>Phone:</b> {selected.phone}</p>
            <div className="msgbox">{selected.message}</div>
            <label className="field"><span>Status</span>
              <select value={selected.status} onChange={(e) => changeStatus(selected.id, e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}