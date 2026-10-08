import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from "react-router-dom";
import '../CSS/Header.css';
import '../CSS/Services.css';
import '../CSS/Keyframes.css';
import '../CSS/Footer.css';
import '../CSS/ReservForm.css';
import { apiGet, apiPost } from '../utils/api';

interface ServiceFilter { type: string; maxPrice: number; maxDuration: string; }
interface ServiceCard { id: number; name: string; description: string; hasPhoto?: boolean; price: number; duration: number; category: string; }
interface BookingForm { serviceId: number; serviceName: string; date: string; time: string; specialistId: string; }
interface Master { id: number; fullName: string; }

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Маппинг fallback-изображений
const SERVICE_IMAGES: Record<string, string> = {
  'Ультразвуковая чистка лица': '/images/Ультразвуковая чистка лица.jpg',
  'Мезотерапия': '/images/Мезотерапия.jpg',
  'Пилинг Джесснера': '/images/Пилинг Джесснера.jpg',
  'Ботулинотерапия': '/images/Ботулинотерапия.jpg',
  'Биоревитализация': '/images/Биоревитализация.jpg',
  'Лазерная эпиляция': '/images/Лазерная.jpg',
  'Восковая эпиляция ног': '/images/Восковая эпиляция ног.jpg',
  'Аппаратный педикюр': '/images/аппаратный педикюр.jpg',
  'Наращивание ногтей гелем': '/images/Наращивание ногтей гелем.jpg',
  'SPA-массаж тела': '/images/SPA-массаж тела.jpg',
};

function getServiceImage(s: ServiceCard): string {
  if (s.hasPhoto) return `${BASE_URL}/api/services/${s.id}/photo`;
  return SERVICE_IMAGES[s.name] || '/images/лого.png';
}

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ServiceFilter>({ type: '', maxPrice: 1000, maxDuration: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({ serviceId: 0, serviceName: '', date: '', time: '', specialistId: '' });
  const [masters, setMasters] = useState<Master[]>([]);

  // Загрузка категорий
  useEffect(() => {
    apiGet<{ CategoryID: number; CategoryName: string }[]>('/api/categories')
      .then(data => setCategories(data.map(c => c.CategoryName)))
      .catch(() => setCategories([]));
  }, []);

  // Загрузка услуг с фильтрацией (серверная)
  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiPost<any[]>('/api/services/filter', {
        ServiceType: filters.type && filters.type !== 'Все процедуры' ? filters.type : undefined,
        MaxPrice: filters.maxPrice < 1000 ? filters.maxPrice : undefined,
        MaxDuration: filters.maxDuration ? parseInt(filters.maxDuration) : undefined,
      });
      setServices(data.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        hasPhoto: !!s.hasPhoto,
        price: s.price,
        duration: s.duration,
        category: s.category || '',
      })));
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.maxPrice, filters.maxDuration]);

  useEffect(() => { loadServices(); }, [loadServices]);

  // Поиск — клиентская фильтрация по имени
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFilterChange = (field: keyof ServiceFilter, value: string | number) =>
    setFilters(prev => ({ ...prev, [field]: value }));

  const handleResetFilters = () => {
    setFilters({ type: '', maxPrice: 1000, maxDuration: '' });
    setSearchTerm('');
  };

  const handleBookService = async (service: ServiceCard) => {
    setBookingForm({ serviceId: service.id, serviceName: service.name, date: '', time: '', specialistId: '' });
    setMasters([]);
    setShowBookingModal(true);
    try {
      const data = await apiGet<Master[]>(`/api/specialists/by-service/${service.id}`);
      setMasters(data || []);
    } catch { setMasters([]); }
  };

  // Загрузка слотов при выборе мастера или даты
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const loadSlots = async (specialistId: string, date: string, serviceId: number) => {
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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stored = sessionStorage.getItem('user');
    if (!stored) { alert('Необходимо войти в систему'); navigate('/login'); return; }
    const user = JSON.parse(stored);
    try {
      await apiPost('/api/reservations', {
        userId: user.UserID,
        serviceId: bookingForm.serviceId,
        specialistId: parseInt(bookingForm.specialistId),
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
    setBookingForm({ serviceId: 0, serviceName: '', date: '', time: '', specialistId: '' });
  };

  const serviceTypes = ['Все процедуры', ...categories];

  return (
    <div className="services-container">
      <div className="wave-bg wave-left">
        <svg width="674" height="1093" viewBox="0 0 1108 1093" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_8_180)"><path d="M-79.7518 909.181C-126.718 955.326 -118.418 1033.19 -62.7794 1068.4C-12.5469 1100.19 54.1111 1082.55 82.0446 1030.07L151.173 900.218C163.845 876.413 170.449 849.849 170.398 822.882C170.298 770.314 195.416 720.889 237.937 689.981L264.709 670.521C313.306 635.195 346.055 582.168 355.879 522.897L361.371 489.763C371.524 428.503 399.801 371.691 442.555 326.657L642.411 116.14C685.459 70.796 676.344 -2.58024 623.509 -36.0132C571.381 -68.999 502.108 -46.9248 478.675 10.1388L415.354 164.335C397.706 207.312 367.918 244.216 329.632 270.536L311.083 283.287C258.476 319.453 222.548 375.186 211.331 438.032L208.467 454.072C198.045 512.46 162.638 563.382 111.532 593.482L104.612 597.558C50.2412 629.581 15.5273 686.711 12.1544 749.722L11.4204 763.434C9.37878 801.572 -6.86168 837.566 -34.1057 864.333L-79.7518 909.181Z" fill="#7C9575"/></g><defs><filter id="filter0_d_8_180" x="-114.324" y="-51.4233" width="788.005" height="1143.68" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_180"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_180" result="shape"/></filter></defs></svg>
      </div>
      <div className="wave-bg wave-right">
        <svg width="648" height="1115" viewBox="0 0 208 1115" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_8_187)"><path d="M746.288 953.066C786.1 994.421 777.956 1061.89 729.449 1092.59C685.148 1120.62 626.376 1105.36 601.312 1059.31L525.041 919.202C512.443 896.061 505.137 870.413 503.649 844.107C500.781 793.429 476.426 746.381 436.703 714.781L409.651 693.261C363.306 656.393 331.22 604.559 318.889 546.635L311.976 514.165C299.351 454.861 271.272 399.949 230.585 354.995L26.8537 129.894C-9.93429 89.2472 -1.20994 25.2577 45.1166 -4.05713C90.8907 -33.0224 151.713 -14.3549 173.357 35.302L247.33 205.019C264.26 243.861 290.892 277.697 324.669 303.277L345.97 319.408C396.159 357.418 431.266 411.973 445.066 473.399L448.718 489.653C461.463 546.385 495.671 595.983 544.174 628.051L551.117 632.642C602.588 666.674 636.227 721.862 642.889 783.206L644.671 799.612C648.472 834.613 663.781 867.362 688.198 892.725L746.288 953.066Z" fill="#7C9575"/></g><defs><filter id="filter0_d_8_187" x="0" y="-17.7771" width="775.648" height="1132.44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_187"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_187" result="shape"/></filter></defs></svg>
      </div>

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

      <div className="services-content">
        <h1 className="services-title">УСЛУГИ</h1>
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="58" height="56" viewBox="0 0 48 56" fill="none"><circle cx="29.3612" cy="18" r="16.5" stroke="#DAA520" strokeWidth="3"/><path d="M20.2184 32L1.50006 54" stroke="#DAA520" strokeWidth="3" strokeLinecap="round"/><circle cx="29.5001" cy="18" r="12.5" stroke="#DAA520"/></svg>
            <input type="text" className="search-input" placeholder="Найти процедуру..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="filters-container">
          <div className="filters-header">
            <p className="filters-title">Не нашли нужную процедуру?</p>
            <p className="filters-subtitle">Воспользуйтесь фильтром:</p>
          </div>
          <div className="filters-content">
            <div className="filter-group">
              <label className="filter-label">Тип процедуры:</label>
              <select className="filter-select" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                <option value="">Выберите тип процедуры</option>
                {serviceTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Макс. цена:</label>
              <div className="price-slider-container">
                <input type="range" className="price-slider" min="0" max="1000" step="10" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))} />
                <span className="price-value">{filters.maxPrice} BYN</span>
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Макс. длительность (мин):</label>
              <input type="text" className="duration-input" value={filters.maxDuration} onChange={(e) => { if (/^\d*$/.test(e.target.value)) handleFilterChange('maxDuration', e.target.value); }} />
            </div>
            <div className="filter-buttons">
              <button className="reset-button" onClick={handleResetFilters}>Сбросить фильтр</button>
            </div>
          </div>
        </div>
      </div>

      <div className="services-cards-section">
        <div className="services-cards-container">
          {loading ? (
            <p style={{ color: '#c8a84b', textAlign: 'center', width: '100%', padding: '40px' }}>Загрузка...</p>
          ) : filteredServices.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', width: '100%', padding: '40px' }}>Процедуры не найдены</p>
          ) : filteredServices.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-image-container" onClick={() => navigate(`/procedures/${service.id}`)} style={{ cursor: 'pointer' }}>
                <img src={getServiceImage(service)} alt={service.name} className="service-image" onError={(e) => { e.currentTarget.src = '/images/лого.png'; }} />
              </div>
              <div className="service-content">
                <h3 className="service-name" onClick={() => navigate(`/procedures/${service.id}`)} style={{ cursor: 'pointer' }}>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-details">
                  <span className="service-price">{service.price} BYN</span>
                  <span className="service-duration">{service.duration} мин</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="book-button" onClick={() => handleBookService(service)}>Записаться</button>
                  <button className="book-button" style={{ background: 'transparent', border: '1px solid rgba(234,192,85,0.5)', color: '#EAC055' }} onClick={() => navigate(`/procedures/${service.id}`)}>Подробнее</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showBookingModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h2 className="modal-title">Запись на процедуру</h2>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group44"><label className="form-label44">Процедура:</label><div className="form-value44">{bookingForm.serviceName}</div></div>
              <div className="form-group44"><label className="form-label44">Дата:</label><input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} value={bookingForm.date} onChange={(e) => { handleInputChange('date', e.target.value); loadSlots(bookingForm.specialistId, e.target.value, bookingForm.serviceId); }} required /></div>
              <div className="form-group44">
                <label className="form-label44">Время:</label>
                <select className="form-select" value={bookingForm.time} onChange={(e) => handleInputChange('time', e.target.value)} required>
                  <option value="">{slotsLoading ? 'Загрузка...' : availableSlots.length === 0 ? 'Выберите мастера и дату' : 'Выберите время'}</option>
                  {availableSlots.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group44">
                <label className="form-label44">Мастер:</label>
                <select className="form-select" value={bookingForm.specialistId} onChange={(e) => { handleInputChange('specialistId', e.target.value); loadSlots(e.target.value, bookingForm.date, bookingForm.serviceId); }} required>
                  <option value="">Выберите мастера</option>
                  {masters.map(m => <option key={m.id} value={String(m.id)}>{m.fullName}</option>)}
                </select>
              </div>
              <button type="submit" className="submit-booking-button">Записаться</button>
            </form>
          </div>
        </div>
      )}

      <footer className="main-footer">
        <div className="footer-container2">
          <div className="footer-left"><div className="footer-logo">SKIN CODE<br />COSMETIC</div><div className="footer-copyright">© 2025 Все права защищены. Косметологический центр</div></div>
          <div className="footer-center">
            <h3 className="form-title2">Контакты</h3>
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

export default Services;
