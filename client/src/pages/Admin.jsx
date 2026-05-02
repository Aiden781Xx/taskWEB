import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { FiActivity, FiCheckSquare, FiEdit3, FiRefreshCw, FiSearch, FiShield, FiTrash2, FiUsers } from 'react-icons/fi';

const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const priorityColors = { low: 'var(--text-secondary)', medium: 'var(--info)', high: 'var(--warning)', urgent: 'var(--danger)' };

const Admin = () => {
  const { user: me } = useAuth();
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', avatar: '', role: 'member' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [msg, setMsg] = useState('');

  const showMessage = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const fetchOverview = async () => {
    const res = await api.get('/users/activity/overall');
    setOverview(res.data.data);
  };

  const fetchUsers = async () => {
    const res = await api.get('/users', { params: search ? { search } : {} });
    setUsers(res.data.data.users);
  };

  const fetchTasks = async () => {
    const params = {};
    if (taskSearch) params.search = taskSearch;
    if (taskStatus) params.status = taskStatus;
    const res = await api.get('/tasks', { params });
    setTasks(res.data.data.tasks);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchOverview(), fetchUsers(), fetchTasks()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshAll(); }, []);
  useEffect(() => { fetchUsers().catch(() => {}); }, [search]);
  useEffect(() => { fetchTasks().catch(() => {}); }, [taskStatus]);
  useEffect(() => {
    const t = setTimeout(() => fetchTasks().catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [taskSearch]);

  const openUser = async (u) => {
    setSelected(u);
    setForm({ name: u.name || '', email: u.email || '', avatar: u.avatar || '', role: u.role || 'member' });
    setSelectedActivity(null);
    const res = await api.get(`/users/${u._id}/activity`);
    setSelectedActivity(res.data.data.activity);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/users/${selected._id}`, form);
      showMessage('User profile updated');
      await Promise.all([fetchUsers(), fetchOverview()]);
      const res = await api.get(`/users/${selected._id}/activity`);
      setSelected(res.data.data.user);
      setSelectedActivity(res.data.data.activity);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to update user');
    }
  };

  const deleteUser = async () => {
    if (!selected || !window.confirm(`Delete ${selected.name}? Their assignments will be cleaned up.`)) return;
    try {
      await api.delete(`/users/${selected._id}`);
      setSelected(null);
      showMessage('User deleted');
      await refreshAll();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleTaskStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status`, { status });
    await Promise.all([fetchTasks(), fetchOverview()]);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    await Promise.all([fetchTasks(), fetchOverview()]);
  };

  const completionRate = useMemo(() => {
    if (!overview?.totalTasks) return 0;
    return Math.round(((overview.statusCounts?.done || 0) / overview.totalTasks) * 100);
  }, [overview]);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage users, profiles, roles, tasks, and overall activity</p>
      </div>

      {msg && <div className="notice success">{msg}</div>}

      <div className="tab-buttons">
        <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}><FiActivity style={{ marginRight: 6 }} />Overview</button>
        <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}><FiUsers style={{ marginRight: 6 }} />Users</button>
        <button className={`tab-btn ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}><FiCheckSquare style={{ marginRight: 6 }} />All Tasks</button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--primary-light)' }}><FiUsers /></div><div className="stat-value">{overview?.totalUsers || 0}</div><div className="stat-label">Users</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--info)' }}><FiCheckSquare /></div><div className="stat-value">{overview?.totalTasks || 0}</div><div className="stat-label">Tasks</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}><FiActivity /></div><div className="stat-value">{completionRate}%</div><div className="stat-label">Completion</div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}><FiShield /></div><div className="stat-value">{overview?.roleCounts?.admin || 0}</div><div className="stat-label">Admins</div></div>
          </div>

          <div className="admin-grid">
            <div className="card">
              <div className="card-header"><span className="card-title">Recent Activity</span><button className="btn btn-secondary btn-sm" onClick={refreshAll}><FiRefreshCw size={14} /></button></div>
              <div className="task-list">
                {overview?.recentTasks?.map(t => (
                  <div key={t._id} className="task-card">
                    <div className="task-priority-bar" style={{ background: priorityColors[t.priority] }}></div>
                    <div className="task-info">
                      <div className="task-title">{t.title}</div>
                      <div className="task-meta">{t.project?.name || 'No project'} · {t.assignee?.name || 'Unassigned'} · {statusLabels[t.status]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Newest Users</span></div>
              <div className="task-list">
                {overview?.recentUsers?.map(u => <UserRow key={u._id} user={u} me={me} onOpen={openUser} />)}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <>
          <div className="filters-bar">
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input search-input" style={{ paddingLeft: 36 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={refreshAll}><FiRefreshCw size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => <UserRow key={u._id} user={u} me={me} onOpen={openUser} />)}
            {users.length === 0 && <div className="empty-state"><h3>No users found</h3></div>}
          </div>
        </>
      )}

      {tab === 'tasks' && (
        <>
          <div className="filters-bar">
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input search-input" style={{ paddingLeft: 36 }} placeholder="Search tasks..." value={taskSearch} onChange={e => setTaskSearch(e.target.value)} />
            </div>
            <select className="form-input" value={taskStatus} onChange={e => setTaskStatus(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Status</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={refreshAll}><FiRefreshCw size={14} /></button>
          </div>
          <div className="task-list">
            {tasks.map(t => (
              <div key={t._id} className="task-card">
                <div className="task-priority-bar" style={{ background: priorityColors[t.priority] }}></div>
                <div className="task-info">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">{t.project?.name || 'No project'} · {t.assignee?.name || 'Unassigned'} · {t.priority}</div>
                </div>
                <select value={t.status} onChange={e => handleTaskStatus(t._id, e.target.value)} className="form-input" style={{ width: 'auto', padding: '6px 30px 6px 10px', fontSize: 12 }}>
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(t._id)}><FiTrash2 /> Delete</button>
              </div>
            ))}
            {tasks.length === 0 && <div className="empty-state"><h3>No tasks found</h3></div>}
          </div>
        </>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Manage User Profile">
        {selected && (
          <form onSubmit={saveUser}>
            <div className="profile-preview">
              <div className="avatar avatar-lg" style={{ background: form.avatar || '#7c3aed' }}>{form.name?.charAt(0).toUpperCase() || 'U'}</div>
              <div><div style={{ fontWeight: 700 }}>{selected.name}</div><div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selected.email}</div></div>
            </div>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Avatar Color</label><input className="form-input" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Role</label><select className="form-input" value={form.role} disabled={selected._id === me?._id} onChange={e => setForm({ ...form, role: e.target.value })}><option value="member">member</option><option value="admin">admin</option></select></div>
            <div className="profile-stats" style={{ marginBottom: 20 }}>
              <div><strong>{selectedActivity?.memberProjects || 0}</strong><span>Projects</span></div>
              <div><strong>{selectedActivity?.assigned?.total || 0}</strong><span>Assigned</span></div>
              <div><strong>{selectedActivity?.created?.total || 0}</strong><span>Created</span></div>
            </div>
            <div className="modal-footer" style={{ padding: 0 }}>
              {selected._id !== me?._id && <button type="button" className="btn btn-danger" onClick={deleteUser}><FiTrash2 /> Delete</button>}
              <button type="submit" className="btn btn-primary"><FiEdit3 /> Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const UserRow = ({ user, me, onOpen }) => (
  <div className="admin-user-row">
    <div className="avatar" style={{ background: user.avatar || '#7c3aed' }}>{user.name?.charAt(0).toUpperCase()}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        {user.name}
        {user._id === me?._id && <span className="badge badge-admin">You</span>}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.email}</div>
    </div>
    <span className={`badge badge-${user.role}`}>{user.role}</span>
    <button className="btn btn-secondary btn-sm" onClick={() => onOpen(user)}><FiEdit3 /> Manage</button>
  </div>
);

export default Admin;
