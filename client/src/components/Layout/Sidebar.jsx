import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiFolder, FiCheckSquare, FiUsers, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { to: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
    { to: '/projects', icon: <FiFolder />, label: 'Projects' },
    { to: '/tasks', icon: <FiCheckSquare />, label: 'Tasks' },
    { to: '/team', icon: <FiUsers />, label: 'Team' },
    { to: '/profile', icon: <FiUser />, label: 'Profile' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">T</div>
        <h2>TaskFlow</h2>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="icon">{l.icon}</span>{l.label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="icon"><FiSettings /></span>Admin Panel
          </NavLink>
        )}
      </nav>
      <div className="sidebar-user">
        <div className="avatar" style={{background: user?.avatar || '#7c3aed'}}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout"><FiLogOut /></button>
      </div>
    </aside>
  );
};

export default Sidebar;
