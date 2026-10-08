import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../CSS/LogIn.css';
import { LoginFormData } from '../types';
import { apiPost } from '../utils/api';

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    UserID: number;
    FirstName: string;
    LastName: string;
    Login: string;
    Email: string;
    Phone: string;
    Role: string; // 'Клиент' | 'Администратор' | 'Специалист'
  };
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiPost<LoginResponse>('/login', {
        login: formData.login,
        password: formData.password,
      });

      if (!data.success || !data.user) {
        setError(data.message || 'Неверный логин или пароль');
        return;
      }

      // Сохраняем данные пользователя
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('user', JSON.stringify(data.user));

      // Перенаправление по роли
      const role = data.user.Role;
      if (role === 'Администратор') {
        navigate('/users_admin');
      } else if (role === 'Специалист') {
        navigate('/master');
      } else {
        navigate('/main');
      }
    } catch (err) {
      console.error('[Login]', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="login-container">
          <div className="login-header">
            <h1>SKIN CODE</h1>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="Title">Вход</div>

            <div className="input-group">
              <label htmlFor="login">Логин</label>
              <input
                type="text"
                id="login"
                name="login"
                value={formData.login}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="register-link">
            Нет аккаунта? <Link to="/register">Регистрация</Link>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-content">
          <img src="/images/лого.png" alt="SKIN CODE Logo" className="logo-image" />
        </div>
      </div>
    </div>
  );
};

export default Login;
