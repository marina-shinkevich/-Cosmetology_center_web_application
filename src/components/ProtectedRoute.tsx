import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Используем sessionStorage, чтобы соответствовать Login.tsx
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    // Если пользователь не авторизован, перенаправляем на страницу логина
    return <Navigate to="/login" replace />;
  }

  // Если авторизован, отображаем дочерние компоненты (защищённый маршрут)
  return <>{children}</>;
};

export default ProtectedRoute;