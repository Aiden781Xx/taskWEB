import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiFolder, FiCheckSquare, FiUsers, FiAlertTriangle, FiClock, FiTrendingUp } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard/stats').then(res => { setStats(res.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  const formatDate = (d) => { if (!d) return ''; const date = new Date(d); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  const isOverdue = (d) => d && new Date(d) < new Date();

  const priorityColors = { low: 'var(--text-secondary)', medium: 'var(--info)', high: 'var(--warning)', urgent: 'var(--danger)' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's what's happening with your projects</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(124,58,237,0.15)',color:'var(--primary-light)'}}><FiFolder /></div>
          <div className="stat-value">{stats?.totalProjects || 0}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(59,130,246,0.15)',color:'var(--info)'}}><FiCheckSquare /></div>
          <div className="stat-value">{stats?.totalTasks || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(16,185,129,0.15)',color:'var(--success)'}}><FiTrendingUp /></div>
          <div className="stat-value">{stats?.completionRate || 0}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)',color:'var(--warning)'}}><FiUsers /></div>
          <div className="stat-value">{stats?.totalMembers || 0}</div>
          <div className="stat-label">Team Members</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:32}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Task Status</span></div>
          {stats?.statusCounts && (
            <div>
              <div className="status-bar" style={{marginBottom:16,height:10}}>
                {stats.totalTasks > 0 && <>
                  <div className="status-bar-segment" style={{width:`${(stats.statusCounts.todo/stats.totalTasks)*100}%`,background:'var(--text-secondary)'}}></div>
                  <div className="status-bar-segment" style={{width:`${(stats.statusCounts['in-progress']/stats.totalTasks)*100}%`,background:'var(--info)'}}></div>
                  <div className="status-bar-segment" style={{width:`${(stats.statusCounts.review/stats.totalTasks)*100}%`,background:'var(--warning)'}}></div>
                  <div className="status-bar-segment" style={{width:`${(stats.statusCounts.done/stats.totalTasks)*100}%`,background:'var(--success)'}}></div>
                </>}
              </div>
              <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
                {[{k:'todo',l:'To Do',c:'var(--text-secondary)'},{k:'in-progress',l:'In Progress',c:'var(--info)'},{k:'review',l:'Review',c:'var(--warning)'},{k:'done',l:'Done',c:'var(--success)'}].map(s=>(
                  <div key={s.k} style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:10,height:10,borderRadius:3,background:s.c}}></div>
                    <span style={{fontSize:13,color:'var(--text-secondary)'}}>{s.l}: <strong style={{color:'var(--text-primary)'}}>{stats.statusCounts[s.k]}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Priority Breakdown</span></div>
          {stats?.priorityCounts && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[{k:'urgent',l:'Urgent'},{k:'high',l:'High'},{k:'medium',l:'Medium'},{k:'low',l:'Low'}].map(p=>{
                const total = Object.values(stats.priorityCounts).reduce((a,b)=>a+b,0) || 1;
                return (
                  <div key={p.k}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                      <span style={{color:'var(--text-secondary)'}}>{p.l}</span>
                      <span style={{fontWeight:600}}>{stats.priorityCounts[p.k]}</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:'var(--bg-input)'}}>
                      <div style={{height:'100%',borderRadius:3,background:priorityColors[p.k],width:`${(stats.priorityCounts[p.k]/total)*100}%`,transition:'width 0.5s'}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* My Tasks & Overdue */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div className="card">
          <div className="card-header"><span className="card-title">📋 My Tasks</span></div>
          {stats?.myTasks?.length > 0 ? (
            <div className="task-list">
              {stats.myTasks.map(t => (
                <div key={t._id} className={`task-card ${isOverdue(t.dueDate) ? 'overdue-bg' : ''}`}>
                  <div className="task-priority-bar" style={{background:priorityColors[t.priority]}}></div>
                  <div className="task-info">
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      {t.project && <span className="task-project-tag"><span className="task-project-dot" style={{background:t.project.color}}></span>{t.project.name}</span>}
                      {t.dueDate && <span className={isOverdue(t.dueDate)?'overdue':''}><FiClock size={12}/> {formatDate(t.dueDate)}</span>}
                    </div>
                  </div>
                  <span className={`badge badge-${t.status}`}>{t.status}</span>
                </div>
              ))}
            </div>
          ) : <div className="empty-state" style={{padding:30}}><p>No pending tasks</p></div>}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title" style={{color:'var(--danger)'}}>⚠️ Overdue Tasks</span></div>
          {stats?.overdueTasks?.length > 0 ? (
            <div className="task-list">
              {stats.overdueTasks.map(t => (
                <div key={t._id} className="task-card overdue-bg">
                  <div className="task-priority-bar" style={{background:'var(--danger)'}}></div>
                  <div className="task-info">
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      {t.project && <span className="task-project-tag"><span className="task-project-dot" style={{background:t.project.color}}></span>{t.project.name}</span>}
                      <span className="overdue"><FiAlertTriangle size={12}/> {formatDate(t.dueDate)}</span>
                    </div>
                  </div>
                  {t.assignee && <div className="task-assignee" style={{background:t.assignee.avatar}}>{t.assignee.name?.charAt(0)}</div>}
                </div>
              ))}
            </div>
          ) : <div className="empty-state" style={{padding:30}}><p>No overdue tasks 🎉</p></div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
