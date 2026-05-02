import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(name, email, password, role, adminKey);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="logo"><div className="logo-icon">T</div><h2>TaskFlow</h2></div>
        <h1>Create Account</h1>
        <p className="subtitle">Start managing your team's tasks today</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label className="form-label">Register As</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">User / Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {role === 'admin' && (
            <div className="form-group">
              <label className="form-label">Admin Registration Key</label>
              <input type="password" className="form-input" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="Required after first admin" />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px'}} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

export default Signup;
