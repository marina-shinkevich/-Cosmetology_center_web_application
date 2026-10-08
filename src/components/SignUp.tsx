import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../CSS/SignUp.css';
import { RegisterFormData } from '../types';
import { apiPost } from '../utils/api';

interface RegisterResponse {
  success: boolean;
  message?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    lastName: '', firstName: '', login: '', password: '', email: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const data = await apiPost<RegisterResponse>('/register', {
        firstName:    formData.firstName,
        lastName:     formData.lastName,
        login:        formData.login,
        email:        formData.email,
        phone:        formData.phone,
        passwordHash: formData.password, // TODO: хэшировать на клиенте (bcrypt) или на сервере
      });

      if (!data.success) {
        setError(data.message || 'Ошибка регистрации');
        return;
      }

      alert('Регистрация успешна! Войдите в систему.');
      navigate('/login');
    } catch (err) {
      console.error('[Register]', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-left">
        <div className="signup-container">
          <div className="signup-header"><h1>SKIN CODE</h1></div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="form-title">Регистрация</div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="lastName">Фамилия</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label htmlFor="login">Придумайте логин</label>
                <input type="text" id="login" name="login" value={formData.login} onChange={handleChange} required autoComplete="username" />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="firstName">Имя</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label htmlFor="password">Придумайте пароль</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required autoComplete="new-password" />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label htmlFor="phone">Номер телефона</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="register-link">
            <Link to="/login" className="back-button">← Назад</Link>
          </div>
        </div>
      </div>

      <div className="signup-right">
        <div className="signup-right-content">
          <img src="/images/лого.png" alt="SKIN CODE Logo" className="logo-image" />
        </div>
      </div>
    </div>
  );
};

export default Register;
