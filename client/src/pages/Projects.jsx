import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { FiPlus, FiSearch } from 'react-icons/fi';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProjects = () => {
    api.get('/projects').then(res => { setProjects(res.data.data.projects); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create project'); }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="page-header" style={{marginBottom:0}}>
          <h1>Projects</h1>
          <p>Manage and track all your team projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> New Project</button>
      </div>

      <div className="filters-bar">
        <div style={{position:'relative'}}>
          <FiSearch style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />
          <input className="form-input search-input" style={{paddingLeft:36}} placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="project-grid">
          {filtered.map(p => (
            <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)} style={{'--card-color': p.color}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:p.color}}></div>
              <div className="project-header">
                <div className="project-name">{p.name}</div>
                <span className={`badge badge-${p.status === 'active' ? 'in-progress' : p.status === 'completed' ? 'done' : 'todo'}`}>{p.status}</span>
              </div>
              <div className="project-desc">{p.description || 'No description'}</div>
              <div className="project-stats">
                <div className="project-stat"><span>{p.taskCounts?.total || 0}</span> tasks</div>
                <div className="project-stat"><span>{p.taskCounts?.done || 0}</span> done</div>
                <div className="project-stat"><span>{p.members?.length || 0}</span> members</div>
              </div>
              {p.taskCounts?.total > 0 && (
                <div className="status-bar" style={{marginBottom:12}}>
                  <div className="status-bar-segment" style={{width:`${(p.taskCounts.todo/p.taskCounts.total)*100}%`,background:'var(--text-secondary)'}}></div>
                  <div className="status-bar-segment" style={{width:`${(p.taskCounts['in-progress']/p.taskCounts.total)*100}%`,background:'var(--info)'}}></div>
                  <div className="status-bar-segment" style={{width:`${(p.taskCounts.review/p.taskCounts.total)*100}%`,background:'var(--warning)'}}></div>
                  <div className="status-bar-segment" style={{width:`${(p.taskCounts.done/p.taskCounts.total)*100}%`,background:'var(--success)'}}></div>
                </div>
              )}
              <div className="project-members">
                {p.members?.slice(0, 4).map((m, i) => (
                  <div key={i} className="member-avatar" style={{background: m.user?.avatar || '#7c3aed'}}>{m.user?.name?.charAt(0)}</div>
                ))}
                {p.members?.length > 4 && <div className="member-more">+{p.members.length - 4}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Create Project</button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief project description..." rows={3}></textarea>
          </div>
          <div className="modal-footer" style={{padding:0}}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
