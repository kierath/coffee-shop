import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import {jwtDecode} from 'jwt-decode';
import Register from './pages/Register';
import Menu from './pages/Menu';
import Order from './pages/Order';
import OrderHistory from './pages/OrderHistory';



function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    // Check if Google redirected with token in the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Save token
      localStorage.setItem('token', token);

      // Decode token to get user info
      const decoded = jwtDecode(token);
      const loggedUser = { 
        id: decoded.id, 
        name: decoded.name,
        email: decoded.email 
      };

      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);

      // Clean up URL (remove ?token=...)
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/order" element={<Order />} />
        <Route path="/order-history" element={<OrderHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
