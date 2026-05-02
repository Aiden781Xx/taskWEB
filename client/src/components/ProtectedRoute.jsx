import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
