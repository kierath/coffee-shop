import axios from 'axios';
axios.defaults.withCredentials = true;

const API_URL = 'https://coffee-shop-backend.onrender.com/auth';

export const registerUser = (name, email, password) =>
  axios.post(`${API_URL}/register`, { name, email, password }).then(res => res.data);

export const loginUser = (email, password) =>
  axios.post(`${API_URL}/login`, { email, password }).then(res => res.data.user);

export const getCurrentUser = () =>
  axios.get(`${API_URL}/me`).then(res => res.data);

export const logoutUser = () =>
  axios.post(`${API_URL}/logout`);
