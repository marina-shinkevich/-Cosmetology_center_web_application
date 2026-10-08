import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import '../CSS/Header.css';
import '../CSS/Specialists.css';
import '../CSS/ReservForm.css';
import '../CSS/Keyframes.css';
import '../CSS/Footer.css';
import { apiGet, apiPost } from '../utils/api';

interface Specialist {
  id: number;
  firstName: string;
  lastName: string;
  experience: string;
  description: string;
  hasPhoto?: boolean;
}

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const FALLBACK_IMAGES = [
  '/images/косметолог1.jpg', '/images/косметолог2.jpg', '/images/косметолог3.jpg',
  '/images/косметолог4.jpg', '/images/косметолог5.jpg', '/images/косметолог6.jpg', '/images/косметолог7.jpg',
];

function getSpecialistImg(s: Specialist, idx: number): string {
  if (s.hasPhoto) return `${BASE_URL}/api/specialists/${s.id}/photo`;
  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

interface SpecialistService { id: number; name: string; }
interface BookingForm { specialistId: number; specialistName: string; date: string; time: string; serviceId: string; }

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const Specialists: React.FC = () => {
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({ specialistId: 0, specialistName: '', date: '', time: '', serviceId: '' });
  const [availableServices, setAvailableServices] = useState<SpecialistService[]>([]);

  useEffect(() => {
    apiGet<Specialist[]>('/api/specialists')
      .then(data => setSpecialists(data || []))
      .catch(() => setSpecialists([]))
      .finally(() => setLoading(false));
  }, []);

  // Поиск — запрос к серверу при вводе
  useEffect(() => {
    if (!searchTerm.trim()) {
      apiGet<Specialist[]>('/api/specialists')
        .then(data => setSpecialists(data || []))
        .catch(() => {});
      return;
    }
    const timer = setTimeout(() => {
      apiGet<Specialist[]>(`/api/specialists/search?name=${encodeURIComponent(searchTerm)}`)
        .then(data => setSpecialists(data || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const loadSlots = async (specialistId: number, date: string, serviceId: string) => {
    if (!specialistId || !date || !serviceId) { setAvailableSlots([]); return; }
    setSlotsLoading(true);
    try {
      const d = await apiGet<{ success: boolean; slots: string[] }>(
        `/api/slots?specialistId=${specialistId}&serviceId=${serviceId}&date=${date}`
      );
      setAvailableSlots(d.slots || []);
    } catch { setAvailableSlots([]); }
    finally { setSlotsLoading(false); }
  };

  const handleBookService = async (specialist: Specialist) => {
    setBookingForm({
      specialistId: specialist.id,
      specialistName: `${specialist.lastName} ${specialist.firstName}`,
      date: '', time: '', serviceId: '',
    });
    setAvailableSlots([]);
    setAvailableServices([]);
    setShowBookingModal(true);
    try {
      const data = await apiGet<SpecialistService[]>(`/api/service-names/${specialist.id}`);
      setAvailableServices(data || []);
    } catch { setAvailableServices([]); }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stored = sessionStorage.getItem('user');
    if (!stored) { alert('Необходимо войти в систему'); navigate('/login'); return; }
    const user = JSON.parse(stored);
    try {
      await apiPost('/api/reservations', {
        userId: user.UserID,
        serviceId: parseInt(bookingForm.serviceId),
        specialistId: bookingForm.specialistId,
        date: bookingForm.date,
        time: bookingForm.time,
      });
      alert('Запись успешно оформлена!');
      closeModal();
    } catch {
      alert('Ошибка при создании записи');
    }
  };

  const handleInputChange = (field: keyof BookingForm, value: string) =>
    setBookingForm(prev => ({ ...prev, [field]: value }));

  const closeModal = () => {
    setShowBookingModal(false);
    setBookingForm({ specialistId: 0, specialistName: '', date: '', time: '', serviceId: '' });
  };

  return (
    <div className="specialists-container">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left"><Link to="/main" className="nav-link">Главная</Link><Link to="/services" className="nav-link">Услуги</Link></div>
          <div className="nav-center"><img src="/images/лого.png" alt="SKIN CODE" className="nav-logo" /></div>
          <div className="nav-right">
            <Link to="/specialists" className="nav-link">Специалисты</Link>
            <Link to="/reviews" className="nav-link">Отзывы</Link>
            <Link to="/profile" className="account-icon"><img src="/images/IconUser.png" alt="Личный кабинет" className="account-icon-img" /></Link>
          </div>
        </div>
      </nav>

      <div className="specialists-content">
        <h1 className="specialists-title">СПЕЦИАЛИСТЫ</h1>
        <div className="search1-container">
          <div className="search1-input-wrapper">
            <svg className="search1-icon" width="48" height="36" viewBox="0 0 48 56" fill="none"><circle cx="29.3612" cy="18" r="16.5" stroke="#DAA520" strokeWidth="3"/><path d="M20.2184 32L1.50006 54" stroke="#DAA520" strokeWidth="3" strokeLinecap="round"/><circle cx="29.5001" cy="18" r="12.5" stroke="#DAA520"/></svg>
            <input type="text" className="search1-input" placeholder="Найти по названию процедуры..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#c8a84b', textAlign: 'center', padding: '40px' }}>Загрузка...</p>
        ) : specialists.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Специалисты не найдены</p>
        ) : (
          <div className="specialists-grid">
            {specialists.map((specialist, idx) => (
              <div key={specialist.id} className="specialist-card">
                <div className="specialist-image-container">
                  <img
                    src={getSpecialistImg(specialist, idx)}
                    alt={`${specialist.firstName} ${specialist.lastName}`}
                    className="specialist-image"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]; }}
                  />
                </div>
                <div className="specialist-info">
                  <div className="specialist-name">
                    <div className="last-name">{specialist.lastName}</div>
                    <div className="first-name">{specialist.firstName}</div>
                  </div>
                  {specialist.experience && (
                    <div className="specialist-experience">
                      <span className="experience-label">Опыт:</span>
                      <span className="experience-value">{specialist.experience} лет</span>
                    </div>
                  )}
                  {specialist.description && (
                    <p className="specialist-description">{specialist.description}</p>
                  )}
                  <button className="book-appointment-button" onClick={() => handleBookService(specialist)}>Записаться</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBookingModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h2 className="modal-title">Запись на процедуру</h2>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group44"><label className="form-label44">Специалист:</label><div className="form-value">{bookingForm.specialistName}</div></div>
              <div className="form-group44">
                <label className="form-label44">Процедура:</label>
                <select className="form-select" value={bookingForm.serviceId} onChange={(e) => { handleInputChange('serviceId', e.target.value); loadSlots(bookingForm.specialistId, bookingForm.date, e.target.value); }} required>
                  <option value="">Выберите процедуру</option>
                  {availableServices.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group44"><label className="form-label44">Дата:</label><input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} value={bookingForm.date} onChange={(e) => { handleInputChange('date', e.target.value); loadSlots(bookingForm.specialistId, e.target.value, bookingForm.serviceId); }} required /></div>
              <div className="form-group44">
                <label className="form-label44">Время:</label>
                <select className="form-select" value={bookingForm.time} onChange={(e) => handleInputChange('time', e.target.value)} required>
                  <option value="">{slotsLoading ? 'Загрузка...' : availableSlots.length === 0 ? 'Выберите процедуру и дату' : 'Выберите время'}</option>
                  {availableSlots.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <button type="submit" className="submit-booking-button">Записаться</button>
            </form>
          </div>
        </div>
      )}

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-left"><div className="footer-logo">SKIN CODE<br />COSMETIC</div><div className="footer-copyright">© 2025 Все права защищены. Косметологический центр</div></div>
          <div className="footer-center">
            <h3 className="form-title3">Контакты</h3>
            <form className="contact-form">
              <input type="text" name="phone" placeholder="Номер телефона" className="form-input" required />
              <input type="tel" name="text" placeholder="Коротко вопрос" className="form-input" required />
              <button type="submit" className="submit-button">Отправить</button>
            </form>
          </div>
          <div className="footer-right"><div className="contact-info"><div className="contact-item"><strong>Почта:</strong> dearYouthLab@gmail.com</div><div className="contact-item"><strong>Телефон:</strong> 375(33)-444-44-44</div><div className="contact-item"><strong>Адрес:</strong> ул. Руссиянова 13/1</div></div></div>
        </div>
      </footer>
    </div>
  );
};

export default Specialists;
