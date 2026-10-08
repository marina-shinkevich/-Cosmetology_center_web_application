import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../CSS/ProcedureDetail.css';
import '../CSS/Header.css';
import '../CSS/ReservForm.css';
import { apiGet, apiPost } from '../utils/api';

export interface Drug {
  id: number;
  name: string;
  description: string;
  hasPhoto?: boolean;
  contraindications?: string[];
}

export interface Procedure {
  id: number;
  name: string;
  description: string;
  hasPhoto?: boolean;
  duration: number;
  price: number;
  effect: string;
  indications: string;
  drugs: Drug[];
}

interface Master { id: number; fullName: string; }

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Маппинг fallback-изображений по названию
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

function getServiceImg(p: Procedure): string {
  if (p.hasPhoto) return `${BASE_URL}/api/services/${p.id}/photo`;
  return SERVICE_IMAGES[p.name] || '/images/лого.png';
}

function getDrugImg(d: Drug): string {
  if (d.hasPhoto) return `${BASE_URL}/api/medications/${d.id}/photo`;
  return '/images/лого.png';
}

const SkeletonLoader: React.FC = () => (
  <div className="pd-skeleton" aria-label="Загрузка...">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="pd-skeleton__line" style={{ width: `${70 + i * 7}%` }} />
    ))}
  </div>
);

const ProcedureDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [contraindications, setContraindications] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const loadSlots = async (specialistId: string, date: string) => {
    if (!specialistId || !date || !id) { setAvailableSlots([]); return; }
    setSlotsLoading(true);
    try {
      const d = await apiGet<{ success: boolean; slots: string[] }>(
        `/api/slots?specialistId=${specialistId}&serviceId=${id}&date=${date}`
      );
      setAvailableSlots(d.slots || []);
    } catch { setAvailableSlots([]); }
    finally { setSlotsLoading(false); }
  };

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', specialistId: '' });
  const [masters, setMasters] = useState<Master[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet<Procedure>(`/api/services/${id}/detail`)
      .then(data => setProcedure(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Загрузка мастеров при открытии модалки записи
  useEffect(() => {
    if (showBookingModal && id) {
      apiGet<Master[]>(`/api/specialists/by-service/${id}`)
        .then(data => setMasters(data || []))
        .catch(() => setMasters([]));
    }
  }, [showBookingModal, id]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setSelectedDrug(null); setShowBookingModal(false); }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleDrugClick = (drug: Drug) => {
    setSelectedDrug(drug);
    setContraindications([]);
    setAiError(false);
    setAiLoading(true);

    const stored = sessionStorage.getItem('user');
    const userId = stored ? JSON.parse(stored).UserID : null;

    apiPost<{ success: boolean; contraindications: string[]; error?: string }>(
      '/api/ai/contraindications',
      { drugId: drug.id, drugName: drug.name, drugDescription: drug.description, userId }
    )
      .then(data => {
        if (data.success) {
          setContraindications(data.contraindications);
        } else {
          setAiError(true);
        }
      })
      .catch(() => setAiError(true))
      .finally(() => setAiLoading(false));
  };

  const closeDrugModal = () => { setSelectedDrug(null); setContraindications([]); setAiError(false); };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stored = sessionStorage.getItem('user');
    if (!stored) { alert('Необходимо войти в систему'); navigate('/login'); return; }
    const user = JSON.parse(stored);
    try {
      await apiPost('/api/reservations', {
        userId: user.UserID,
        serviceId: Number(id),
        specialistId: parseInt(bookingForm.specialistId),
        date: bookingForm.date,
        time: bookingForm.time,
      });
      alert('Запись успешно оформлена!');
      setShowBookingModal(false);
      setBookingForm({ date: '', time: '', specialistId: '' });
    } catch {
      alert('Ошибка при создании записи');
    }
  };

  if (loading) return (
    <div className="pd-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#c8a84b', fontSize: '1.2rem' }}>
      Загрузка...
    </div>
  );

  if (notFound || !procedure) return (
    <div className="pd-not-found">
      <h2>Процедура не найдена</h2>
      <Link to="/services" className="pd-back-btn">← Вернуться к процедурам</Link>
    </div>
  );

  const indicationsList = procedure.indications
    ? procedure.indications.split(/[;\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="pd-page">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/main" className="nav-link">Главная</Link>
            <Link to="/services" className="nav-link">Услуги</Link>
          </div>
          <div className="nav-center">
            <img src="/images/лого.png" alt="SKIN CODE" className="nav-logo" />
          </div>
          <div className="nav-right">
            <Link to="/specialists" className="nav-link">Специалисты</Link>
            <Link to="/reviews" className="nav-link">Отзывы</Link>
            <Link to="/profile" className="account-icon">
              <img src="/images/IconUser.png" alt="Личный кабинет" className="account-icon-img" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="pd-breadcrumbs">
        <Link to="/main" className="pd-breadcrumb-link">Главная</Link>
        <span className="pd-breadcrumb-sep">→</span>
        <Link to="/services" className="pd-breadcrumb-link">Услуги</Link>
        <span className="pd-breadcrumb-sep">→</span>
        <span className="pd-breadcrumb-current">{procedure.name}</span>
      </div>

      <button className="pd-back-btn" onClick={() => navigate('/services')}>← Назад к процедурам</button>

      <section className="pd-hero">
        <div className="pd-hero__image-wrap">
          <img
            src={getServiceImg(procedure)}
            alt={procedure.name}
            className="pd-hero__image"
            onError={(e) => { e.currentTarget.src = '/images/лого.png'; }}
          />
        </div>
        <div className="pd-hero__info">
          <h1 className="pd-hero__title">{procedure.name}</h1>
          <p className="pd-hero__description">{procedure.description}</p>
          <div className="pd-hero__meta">
            <div className="pd-meta-item">
              <span className="pd-meta-label">Длительность</span>
              <span className="pd-meta-value">{procedure.duration} мин</span>
            </div>
            <div className="pd-meta-item">
              <span className="pd-meta-label">Стоимость</span>
              <span className="pd-meta-value pd-meta-value--price">{procedure.price} BYN</span>
            </div>
          </div>
          <button className="pd-book-btn" onClick={() => setShowBookingModal(true)}>
            Записаться на процедуру
          </button>
        </div>
      </section>

      <section className="pd-details">
        {procedure.effect && (
          <div className="pd-details__block">
            <h2 className="pd-section-title">Эффект от процедуры</h2>
            <p className="pd-details__text">{procedure.effect}</p>
          </div>
        )}
        {indicationsList.length > 0 && (
          <div className="pd-details__block">
            <h2 className="pd-section-title">Показания</h2>
            <ul className="pd-indications-list">
              {indicationsList.map((item, i) => (
                <li key={i} className="pd-indications-item">
                  <span className="pd-check">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {procedure.drugs && procedure.drugs.length > 0 && (
        <section className="pd-drugs">
          <h2 className="pd-section-title pd-section-title--center">Препараты</h2>
          <p className="pd-drugs__hint">
            Нажмите на препарат, чтобы узнать противопоказания
            <span className="pd-ai-badge">✦ ИИ-анализ</span>
          </p>
          <div className="pd-drugs__grid">
            {procedure.drugs.map(drug => (
              <button key={drug.id} className="pd-drug-card" onClick={() => handleDrugClick(drug)} aria-label={`Показать противопоказания для ${drug.name}`}>
                <div className="pd-drug-card__img-wrap">
                  <img
                    src={getDrugImg(drug)}
                    alt={drug.name}
                    className="pd-drug-card__img"
                    onError={(e) => { e.currentTarget.src = '/images/лого.png'; }}
                  />
                </div>
                <div className="pd-drug-card__body">
                  <h3 className="pd-drug-card__name">{drug.name}</h3>
                  <p className="pd-drug-card__desc">{drug.description}</p>
                  <span className="pd-drug-card__cta">Противопоказания →</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedDrug && (
        <div className="pd-modal-overlay" onClick={closeDrugModal} role="dialog" aria-modal="true" aria-labelledby="pd-modal-title">
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <button className="pd-modal__close" onClick={closeDrugModal} aria-label="Закрыть">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <div className="pd-modal__header">
              <div className="pd-ai-icon" aria-hidden="true">✦</div>
              <div>
                <h2 id="pd-modal-title" className="pd-modal__title">{selectedDrug.name}</h2>
                <p className="pd-modal__subtitle">Анализ противопоказаний</p>
              </div>
            </div>
            {aiLoading && (
              <div className="pd-modal__loading">
                <div className="pd-loading-dots" aria-label="ИИ анализирует данные..."><span /><span /><span /></div>
                <p className="pd-loading-text">ИИ анализирует противопоказания...</p>
                <SkeletonLoader />
              </div>
            )}
            {aiError && !aiLoading && (
              <div className="pd-modal__error" role="alert">
                <span className="pd-error-icon">⚠</span>
                <p>Не удалось получить данные. Попробуйте ещё раз.</p>
                <button className="pd-retry-btn" onClick={() => handleDrugClick(selectedDrug)}>Повторить запрос</button>
              </div>
            )}
            {!aiLoading && !aiError && (
              <div className="pd-modal__content">
                {contraindications.length === 0 ? (
                  <div className="pd-modal__empty">
                    <span className="pd-empty-icon">✓</span>
                    <p>Противопоказания для данного препарата не выявлены.</p>
                  </div>
                ) : (
                  <>
                    <p className="pd-modal__warning-note">
                      <span className="pd-warn-icon">⚠</span>
                      Проконсультируйтесь с врачом перед процедурой
                    </p>
                    <div className="pd-contraindications-text">
                      {contraindications.map((paragraph, i) => (
                        <p key={i} className="pd-contraindication-paragraph">{paragraph}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBookingModal(false)} aria-label="Закрыть">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h2 className="modal-title">Запись на процедуру</h2>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group44"><label className="form-label44">Процедура:</label><div className="form-value44">{procedure.name}</div></div>
              <div className="form-group44"><label className="form-label44">Дата:</label><input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} value={bookingForm.date} onChange={e => { setBookingForm(p => ({ ...p, date: e.target.value })); loadSlots(bookingForm.specialistId, e.target.value); }} required /></div>
              <div className="form-group44">
                <label className="form-label44">Время:</label>
                <select className="form-select" value={bookingForm.time} onChange={e => setBookingForm(p => ({ ...p, time: e.target.value }))} required>
                  <option value="">{slotsLoading ? 'Загрузка...' : availableSlots.length === 0 ? 'Выберите мастера и дату' : 'Выберите время'}</option>
                  {availableSlots.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group44">
                <label className="form-label44">Мастер:</label>
                <select className="form-select" value={bookingForm.specialistId} onChange={e => { setBookingForm(p => ({ ...p, specialistId: e.target.value })); loadSlots(e.target.value, bookingForm.date); }} required>
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
              <input type="text" placeholder="Номер телефона" className="form-input" required />
              <input type="tel" placeholder="Коротко вопрос" className="form-input" required />
              <button type="submit" className="submit-button">Отправить</button>
            </form>
          </div>
          <div className="footer-right"><div className="contact-info"><div className="contact-item"><strong>Почта:</strong> dearYouthLab@gmail.com</div><div className="contact-item"><strong>Телефон:</strong> 375(33)-444-44-44</div><div className="contact-item"><strong>Адрес:</strong> ул. Руссиянова 13/1</div></div></div>
        </div>
      </footer>
    </div>
  );
};

export default ProcedureDetail;
