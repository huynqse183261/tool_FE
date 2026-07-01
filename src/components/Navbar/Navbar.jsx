import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.scss';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar__brand">GRE•911</div>

      <div className="navbar__links">
        <Link
          to="/dashboard"
          className={`navbar__link ${isActive('/dashboard') ? 'navbar__link--active' : ''}`}
        >
          Dashboard
        </Link>
        <Link
          to="/drafts"
          className={`navbar__link ${isActive('/drafts') ? 'navbar__link--active' : ''}`}
        >
          Posts
        </Link>
      </div>

      <div className="navbar__right">
        <span className="navbar__user">{user?.fullName || user?.email}</span>
        <button className="navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;