import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // This effect runs ONCE when the app loads to check for a stored user
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      // If we have a token and user info, set them in the app
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }
    // We are done checking, so set loading to false
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: loggedInUser } = response.data;

      // Store token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      // Set the default auth header for all future API calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Update the user state in the application
      setUser(loggedInUser);

      // --- NEW: Role-based redirect ---
      // This logic sends the user to the correct dashboard based on their role
      if (loggedInUser.role === 'admin' || loggedInUser.role === 'staff') {
        navigate('/dashboard');
      } else if (loggedInUser.role === 'client') {
        navigate('/my-shipments');
      } else {
        // Fallback for any other case
        navigate('/');
      }

    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      alert('Login failed. Please check your credentials.');
    }
  };

  const logout = () => {
    // Clear everything from localStorage and state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
