import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiSearch } from 'react-icons/fi';

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users', { params: search ? { search } : {} })
      .then(res => { setUsers(res.data.data.users); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header"><h1>Team Members</h1><p>All users in the system</p></div>
      <div className="filters-bar">
        <div style={{position:'relative'}}>
          <FiSearch style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />
          <input className="form-input search-input" style={{paddingLeft:36}} placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {users.length > 0 ? (
        <div className="team-grid">
          {users.map(u => (
            <div key={u._id} className="team-card">
              <div className="avatar" style={{background: u.avatar || '#7c3aed'}}>{u.name?.charAt(0).toUpperCase()}</div>
              <div className="info">
                <div className="name">{u.name}</div>
                <div className="email">{u.email}</div>
              </div>
              <span className={`badge badge-${u.role}`}>{u.role}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><div className="empty-icon">👥</div><h3>No members found</h3></div>
      )}
    </div>
  );
};

export default Team;
