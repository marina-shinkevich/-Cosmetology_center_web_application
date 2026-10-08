import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/LogIn';
import ProfilePage from './components/ProfilePage';
import MainPage from './components/MainPage';
import Register from './components/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import Reviews from './components/Reviews';
import Reviews_Admin from './components/Reviews_Admin';
import Services from './components/Services';
import ProcedureDetail from './components/ProcedureDetail';
import Specialists from './components/Specialists';
import Users_Admin from './components/Users_Admin';
import Specialists_Admin from './components/Specialists_Admin';
import Services_Admin from './components/Services_Admin';
import Reservations_Admin from './components/Reservations_Admin';
import SpecProc_Admin from './components/SpecProc_Admin';
import Medications_Admin from './components/Medications_Admin';
import ProcMed_Admin from './components/ProcMed_Admin';
import Categories_Admin from './components/Categories_Admin';
import AdminSchedule from './components/AdminSchedule';
import MasterDashboard from './components/MasterDashboard';
import './App.css';

function App() {
  const isAuthenticated = () => sessionStorage.getItem('isAuthenticated') === 'true';

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Корневой маршрут — редирект по состоянию авторизации */}
          <Route path="/" element={<Navigate to={isAuthenticated() ? '/main' : '/login'} replace />} />

          <Route path="/login" element={isAuthenticated() ? <Navigate to="/main" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated() ? <Navigate to="/main" replace /> : <Register />} />

          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="/main" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/procedures/:id" element={<ProtectedRoute><ProcedureDetail /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
          <Route path="/specialists" element={<ProtectedRoute><Specialists /></ProtectedRoute>} />
          <Route path="/users_admin" element={<ProtectedRoute><Users_Admin /></ProtectedRoute>} />
          <Route path="/spesialists_admin" element={<ProtectedRoute><Specialists_Admin /></ProtectedRoute>} />
          <Route path="/services_admin" element={<ProtectedRoute><Services_Admin /></ProtectedRoute>} />
          <Route path="/reservations_admin" element={<ProtectedRoute><Reservations_Admin /></ProtectedRoute>} />
          <Route path="/specproc_admin" element={<ProtectedRoute><SpecProc_Admin /></ProtectedRoute>} />
          <Route path="/medications_admin" element={<ProtectedRoute><Medications_Admin /></ProtectedRoute>} />
          <Route path="/procmed_admin" element={<ProtectedRoute><ProcMed_Admin /></ProtectedRoute>} />
          <Route path="/categories_admin" element={<ProtectedRoute><Categories_Admin /></ProtectedRoute>} />
          <Route path="/reviews_admin" element={<ProtectedRoute><Reviews_Admin /></ProtectedRoute>} />
          <Route path="/admin/schedule" element={<ProtectedRoute><AdminSchedule /></ProtectedRoute>} />
          <Route path="/master" element={<MasterDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
