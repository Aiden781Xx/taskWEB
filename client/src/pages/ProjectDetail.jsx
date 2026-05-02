import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { FiPlus, FiTrash2, FiEdit3, FiArrowLeft, FiUserPlus } from 'react-icons/fi';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '', status: 'todo' });
  const [memberEmail, setMemberEmail] = useState('');
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'active' });
  const [error, setError] = useState('');

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data.project);
      setTasks(res.data.data.tasks);
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const isAdmin = project?.members?.some(m => m.user?._id === user?._id && m.role === 'admin') || user?.role === 'admin';
  const statuses = ['todo', 'in-progress', 'review', 'done'];
  const statusLabels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
  const statusColors = { 'todo': 'var(--text-secondary)', 'in-progress': 'var(--info)', 'review': 'var(--warning)', 'done': 'var(--success)' };
  const prioColors = { low: 'var(--text-secondary)', medium: 'var(--info)', high: 'var(--warning)', urgent: 'var(--danger)' };

  const handleCreateTask = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/tasks', { ...taskForm, project: id });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '', status: 'todo' });
      fetchProject();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const handleStatusChange = async (taskId, status) => {
    try { await api.patch(`/tasks/${taskId}/status`, { status }); fetchProject(); } catch {}
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setShowMemberModal(false); setMemberEmail(''); fetchProject();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); fetchProject(); } catch {}
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); fetchProject(); } catch {}
  };

  const handleEditProject = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.put(`/projects/${id}`, editForm);
      setShowEditModal(false); fetchProject();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all tasks?')) return;
    try { await api.delete(`/projects/${id}`); navigate('/projects'); } catch {}
  };

  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button className="btn-icon" onClick={() => navigate('/projects')}><FiArrowLeft /></button>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:12,height:12,borderRadius:4,background:project.color}}></div>
            <h1 style={{fontSize:24,fontWeight:800}}>{project.name}</h1>
            <span className={`badge badge-${project.status==='active'?'in-progress':project.status==='completed'?'done':'todo'}`}>{project.status}</span>
          </div>
          {project.description && <p style={{color:'var(--text-secondary)',fontSize:14,marginTop:4}}>{project.description}</p>}
        </div>
        {isAdmin && (
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setEditForm({ name: project.name, description: project.description, status: project.status }); setShowEditModal(true); }}><FiEdit3 /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}><FiTrash2 /> Delete</button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header">
          <span className="card-title">Team Members ({project.members?.length})</span>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}><FiUserPlus /> Add</button>}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {project.members?.map((m,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-input)',borderRadius:20,padding:'6px 14px 6px 6px'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:m.user?.avatar||'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:'white'}}>{m.user?.name?.charAt(0)}</div>
              <span style={{fontSize:13,fontWeight:500}}>{m.user?.name}</span>
              <span className={`badge badge-${m.role}`} style={{marginLeft:4}}>{m.role}</span>
              {isAdmin && m.user?._id !== project.owner?._id && (
                <button onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.user?._id); }} style={{background:'none',color:'var(--text-muted)',fontSize:14,cursor:'pointer',padding:0}}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Toggle + Add Task */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div className="tab-buttons">
          <button className={`tab-btn ${tab==='board'?'active':''}`} onClick={() => setTab('board')}>Board</button>
          <button className={`tab-btn ${tab==='list'?'active':''}`} onClick={() => setTab('list')}>List</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}><FiPlus /> Add Task</button>
      </div>

      {/* Board View */}
      {tab === 'board' && (
        <div className="kanban-board">
          {statuses.map(s => {
            const col = tasks.filter(t => t.status === s);
            return (
              <div key={s} className="kanban-column">
                <div className="column-header">
                  <div className="column-title"><div style={{width:8,height:8,borderRadius:'50%',background:statusColors[s]}}></div>{statusLabels[s]}</div>
                  <div className="column-count">{col.length}</div>
                </div>
                {col.map(t => (
                  <div key={t._id} className="kanban-task">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:4}}>
                      <div className="kt-title">{t.title}</div>
                      {isAdmin && <button onClick={() => handleDeleteTask(t._id)} style={{background:'none',color:'var(--text-muted)',fontSize:12,cursor:'pointer',padding:2}}>✕</button>}
                    </div>
                    <div className="kt-meta">
                      <span className={`badge badge-${t.priority}`} style={{fontSize:10}}>{t.priority}</span>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        {t.dueDate && <span style={{color: new Date(t.dueDate)<new Date()?'var(--danger)':'inherit'}}>{new Date(t.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                        {t.assignee && <div className="kt-assignee" style={{background:t.assignee.avatar||'#7c3aed'}}>{t.assignee.name?.charAt(0)}</div>}
                      </div>
                    </div>
                    <select value={t.status} onChange={(e) => handleStatusChange(t._id, e.target.value)} style={{marginTop:8,width:'100%',padding:'4px 8px',background:'var(--bg-input)',color:'var(--text-primary)',borderRadius:4,border:'1px solid var(--border)',fontSize:12,cursor:'pointer'}}>
                      {statuses.map(st => <option key={st} value={st}>{statusLabels[st]}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {tab === 'list' && (
        <div className="task-list">
          {tasks.length > 0 ? tasks.map(t => (
            <div key={t._id} className={`task-card ${t.dueDate && new Date(t.dueDate)<new Date() && t.status!=='done' ? 'overdue-bg':''}`}>
              <div className="task-priority-bar" style={{background:prioColors[t.priority]}}></div>
              <div className="task-info">
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  {t.dueDate && <span>{new Date(t.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <select value={t.status} onChange={(e) => handleStatusChange(t._id, e.target.value)} className="form-input" style={{width:'auto',padding:'6px 30px 6px 10px',fontSize:12}}>
                {statuses.map(st => <option key={st} value={st}>{statusLabels[st]}</option>)}
              </select>
              {t.assignee && <div className="task-assignee" style={{background:t.assignee.avatar||'#7c3aed'}}>{t.assignee.name?.charAt(0)}</div>}
              {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(t._id)} style={{padding:'4px 8px'}}><FiTrash2 size={14}/></button>}
            </div>
          )) : <div className="empty-state"><p>No tasks yet</p></div>}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleCreateTask}>
          <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title:e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description:e.target.value})} rows={2}></textarea></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-input" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status:e.target.value})}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Assignee</label><select className="form-input" value={taskForm.assignee} onChange={e => setTaskForm({...taskForm, assignee:e.target.value})}><option value="">Unassigned</option>{project.members?.map((m,i) => <option key={i} value={m.user?._id}>{m.user?.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate:e.target.value})} /></div>
          <div className="modal-footer" style={{padding:0}}><button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Task</button></div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Add Team Member">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleAddMember}>
          <div className="form-group"><label className="form-label">User Email</label><input type="email" className="form-input" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="member@example.com" required /></div>
          <div className="modal-footer" style={{padding:0}}><button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Member</button></div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleEditProject}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name:e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={editForm.description} onChange={e => setEditForm({...editForm, description:e.target.value})} rows={3}></textarea></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={editForm.status} onChange={e => setEditForm({...editForm, status:e.target.value})}><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></div>
          <div className="modal-footer" style={{padding:0}}><button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Update</button></div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
