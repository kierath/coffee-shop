import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar-container">
      <div className="nav-left">
        <Link to="/">Grind</Link>
      </div>

      <div className="nav-right">
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to="/profile">({user.name})</Link>
            <button onClick={handleLogout}>LOGOUT</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
