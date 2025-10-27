import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderHistory from './OrderHistory';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className='profile-container'>
      <h2>Welcome, {user.name}!</h2>
      <p>Email: {user.email}</p>
      <OrderHistory userId={user.id} />
    </div>
  );
}

export default Profile;
