import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiSearch, FiClock } from 'react-icons/fi';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const fetchTasks = () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;
    api.get('/tasks', { params }).then(res => { setTasks(res.data.data.tasks); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [filters.status, filters.priority]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTasks(), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleStatusChange = async (taskId, status) => {
    try { await api.patch(`/tasks/${taskId}/status`, { status }); fetchTasks(); } catch {}
  };

  const prioColors = { low: 'var(--text-secondary)', medium: 'var(--info)', high: 'var(--warning)', urgent: 'var(--danger)' };
  const statusLabels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const isOverdue = (d, s) => d && new Date(d) < new Date() && s !== 'done';

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header"><h1>All Tasks</h1><p>View and manage tasks across all projects</p></div>

      <div className="filters-bar">
        <div style={{position:'relative'}}>
          <FiSearch style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />
          <input className="form-input search-input" style={{paddingLeft:36}} placeholder="Search tasks..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        </div>
        <select className="form-input" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select className="form-input" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {tasks.length > 0 ? (
        <div className="task-list">
          {tasks.map(t => (
            <div key={t._id} className={`task-card ${isOverdue(t.dueDate, t.status) ? 'overdue-bg' : ''}`}>
              <div className="task-priority-bar" style={{background: prioColors[t.priority]}}></div>
              <div className="task-info">
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  {t.project && <span className="task-project-tag"><span className="task-project-dot" style={{background: t.project.color}}></span>{t.project.name}</span>}
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  {t.dueDate && <span className={isOverdue(t.dueDate, t.status) ? 'overdue' : ''} style={{display:'flex',alignItems:'center',gap:4}}><FiClock size={12}/> {formatDate(t.dueDate)}</span>}
                </div>
              </div>
              <select value={t.status} onChange={(e) => handleStatusChange(t._id, e.target.value)} className="form-input" style={{width:'auto',padding:'6px 30px 6px 10px',fontSize:12}}>
                {Object.entries(statusLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {t.assignee ? (
                <div className="task-assignee" style={{background: t.assignee.avatar || '#7c3aed'}} title={t.assignee.name}>{t.assignee.name?.charAt(0)}</div>
              ) : (
                <div className="task-assignee" style={{background:'var(--bg-input)',color:'var(--text-muted)',fontSize:14}}>?</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No tasks found</h3>
          <p>Tasks will appear here once created in a project</p>
        </div>
      )}
    </div>
  );
};

export default Tasks;
