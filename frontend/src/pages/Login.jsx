import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const loggedInUser = await loginUser(email, password);
    localStorage.setItem('user', JSON.stringify(loggedInUser)); // store user
    navigate('/', { replace: true }); // navigate to home
  } catch (err) {
    setError(err.response?.data?.message || 'Invalid credentials');
  }
};

const handleThirdPartyLogin = (provider) => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Fuel up. Get back in the grind.</p>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn">DEPLOY</button>
        </form>

        {/* Optional Google login */}
        <div className="third-party-login">
          <button
            type="button"
            className="auth-btn-google"
            onClick={() => handleThirdPartyLogin('google')}
          >
            Sign in with Google
          </button>
        </div>

        <p className="auth-link">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
