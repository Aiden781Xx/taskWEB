import { useEffect, useState } from 'react';
import { FiSave, FiUser, FiActivity } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', avatar: '' });
  const [activity, setActivity] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', avatar: user.avatar || '' });
  }, [user]);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/users/${user._id}/activity`).then(res => setActivity(res.data.data.activity)).catch(() => {});
  }, [user?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateProfile(form);
      setMsg('Profile updated');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Keep your account details and team identity up to date</p>
      </div>

      {msg && <div className="notice success">{msg}</div>}

      <div className="profile-layout">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header"><span className="card-title">Account Details</span></div>
          <div className="profile-preview">
            <div className="avatar avatar-lg" style={{ background: form.avatar || '#7c3aed' }}>{form.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{form.name || 'Your name'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.role}</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Avatar Color</label>
            <input className="form-input" value={form.avatar} placeholder="#7c3aed" onChange={e => setForm({ ...form, avatar: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save Profile'}</button>
        </form>

        <div className="card">
          <div className="card-header"><span className="card-title"><FiActivity /> Activity</span></div>
          <div className="profile-stats">
            <div><strong>{activity?.memberProjects || 0}</strong><span>Projects</span></div>
            <div><strong>{activity?.assigned?.total || 0}</strong><span>Assigned</span></div>
            <div><strong>{activity?.created?.total || 0}</strong><span>Created</span></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13 }}>
                <span>{label}</span>
                <strong style={{ color: 'var(--text-primary)' }}>{activity?.assigned?.[key] || 0}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
