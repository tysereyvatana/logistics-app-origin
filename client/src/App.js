import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TrackingPage from './pages/TrackingPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ClientDashboardPage from './pages/ClientDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import RateManagementPage from './pages/RateManagementPage'; // 1. Import the new page

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="container mx-auto mt-8 p-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<TrackingPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Staff & Admin Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/rates" element={<RateManagementPage />} /> {/* 2. Add the new route */}
            
            {/* Client Route */}
            <Route path="/my-shipments" element={<ClientDashboardPage />} />
          </Route>
        </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
