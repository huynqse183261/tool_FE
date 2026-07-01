import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  
  // Check cả token trong context lẫn localStorage
  if (!token && !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;