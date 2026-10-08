import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import '../CSS/ProfilePage.css';
import '../CSS/Header.css';
import '../CSS/Keyframes.css';
import '../CSS/Footer.css';
import DownloadMedicalReportButton from './DownloadMedicalReportButton';
import { ProcedureHistoryItem } from '../utils/generateMedicalReportPDF';
import { apiGet, apiPut, apiDelete } from '../utils/api';

interface User {
  UserID: number;
  PhotoBase64?: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  Login: string;
  Email: string;
  PasswordHash: string;
}

interface Appointment {
  id: number;
  procedure_name: string;
  appointment_date: string;
  appointment_time: string;
  price: string;
  status: string;
}

interface MedicalCard {
  dateOfBirth: string;
  gender: string;
  allergies: string;
  chronicDiseases: string;
  medications: string;
  doctorRecommendations: string;
}

interface Prescription {
  id: number;
  drugName: string;
  frequency: string;
  duration: string;
  prescribedAt: string;
  instructions: string;
  specialistName: string;
}

const EMPTY_USER: User = {
  UserID: 0, PhotoBase64: '', FirstName: '', LastName: '',
  Phone: '', Login: '', Email: '', PasswordHash: '',
};

const EMPTY_MEDICAL: MedicalCard = {
  dateOfBirth: '', gender: '', allergies: '',
  chronicDiseases: '', medications: '', doctorRecommendations: '',
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<User>(EMPTY_USER);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedureHistory, setProcedureHistory] = useState<ProcedureHistoryItem[]>([]);
  const [medicalCard, setMedicalCard] = useState<MedicalCard>(EMPTY_MEDICAL);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }

    const sessionUser = JSON.parse(stored);
    const userId: number = sessionUser.UserID;
    const login: string = sessionUser.Login;

    const loadAll = async () => {
      try {
        // Личные данные
        const user = await apiGet<any>(`/api/user/${login}`);
        setUserData({
          UserID: user.UserID,
          PhotoBase64: user.PhotoBase64 || '',
          FirstName: user.FirstName || '',
          LastName: user.LastName || '',
          Phone: user.Phone || '',
          Login: user.Login || '',
          Email: user.Email || '',
          PasswordHash: user.PasswordHash || '',
        });

        // Записи на процедуры — показываем все записи
        const appointments = await apiGet<Appointment[]>(`/api/userReservations/${userId}`);
        setUserAppointments(appointments || []);

        // Медицинская карта
        const card = await apiGet<any>(`/api/medical-card/${userId}`);
        if (card) {
          setMedicalCard({
            dateOfBirth: card.BirthDate ? card.BirthDate.split('T')[0] : '',
            gender: card.Gender || '',
            allergies: card.Allergies || '',
            chronicDiseases: card.ChronicDiseases || '',
            medications: card.Medications || '',
            doctorRecommendations: '',
          });
        }

        // Рекомендации врача (только чтение)
        const recs = await apiGet<any[]>(`/api/master/recommendations/${userId}`);
        if (recs && recs.length > 0) {
          setMedicalCard(prev => ({
            ...prev,
            doctorRecommendations: recs.map(r => r.Recommendations).join('\n'),
          }));
        }

        // Назначенные препараты
        const presc = await apiGet<Prescription[]>(`/api/user/prescriptions/${userId}`);
        setPrescriptions(presc || []);

        // История процедур для PDF — только прошедшие с статусом "Подтверждена"
        const now = new Date();
        const history = appointments
          ? appointments
              .filter((a: Appointment) => {
                const isPast = new Date(`${a.appointment_date}T${a.appointment_time}`) < now;
                const isConfirmed = a.status.toLowerCase().startsWith('подтвержд');
                return isPast && isConfirmed;
              })
              .map((a: Appointment) => ({
                id: a.id,
                date: a.appointment_date,
                procedureName: a.procedure_name,
                masterName: '',
                drugsUsed: [],
                price: parseFloat(a.price) || undefined,
              }))
          : [];
        setProcedureHistory(history);

      } catch (err) {
        console.error('[ProfilePage] load error', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const keyMap: { [key: string]: keyof User } = {
      first_name: 'FirstName', last_name: 'LastName', login: 'Login',
      phone: 'Phone', email: 'Email', password_hash: 'PasswordHash',
    };
    const key = keyMap[name];
    if (key) setUserData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await apiPut('/api/user/update', {
        UserID: userData.UserID,
        FirstName: userData.FirstName,
        LastName: userData.LastName,
        Login: userData.Login,
        Phone: userData.Phone,
        Email: userData.Email,
        PasswordHash: userData.PasswordHash,
      });
      const stored = sessionStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        sessionStorage.setItem('user', JSON.stringify({ ...u, ...userData }));
      }
      alert('Данные успешно сохранены!');
    } catch (err) {
      alert('Ошибка при сохранении данных');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiDelete(`/api/users/deactivate-self/${userData.UserID}`);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isAuthenticated');
      navigate('/login');
    } catch (err) {
      alert('Ошибка при удалении аккаунта');
    }
  };

  const handleMedicalCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMedicalCard(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicalCardSave = async () => {
    try {
      await apiPut('/api/medical-card', {
        UserID: userData.UserID,
        BirthDate: medicalCard.dateOfBirth || null,
        Gender: medicalCard.gender || null,
        Allergies: medicalCard.allergies || null,
        ChronicDiseases: medicalCard.chronicDiseases || null,
        Medications: medicalCard.medications || null,
      });
      alert('Медицинская карта сохранена!');
    } catch (err) {
      alert('Ошибка при сохранении медицинской карты');
    }
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      await apiPut(`/api/reservations/cancel/${id}`, {});
      setUserAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Ошибка при отмене записи');
    }
  };

  const column1Appointments = userAppointments.filter((_, i) => i % 2 === 0);
  const column2Appointments = userAppointments.filter((_, i) => i % 2 === 1);

  const AppointmentCard: React.FC<{ appointment: Appointment; onCancel?: (id: number) => void }> = ({ appointment, onCancel }) => {
    const isPast = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) < new Date();
    const isCancelled = appointment.status.toLowerCase().includes('отмен');
    return (
      <div className="appointment-card">
        <div className="appointment-header">
          <h3 className="procedure-name">{appointment.procedure_name}</h3>
        </div>
        <div className="appointment-details">
          <div className="appointment-info">
            <span className="appointment-date">{appointment.appointment_date}</span>
            <span className="appointment-time">Время: {appointment.appointment_time}</span>
            <span className="appointment-price">Цена: {appointment.price}</span>
            {appointment.status && (
              <span className={`appointment-status appointment-status--${
                isCancelled ? 'cancelled' :
                appointment.status.toLowerCase().includes('завер') ? 'completed' :
                appointment.status.toLowerCase().includes('подтвер') ? 'confirmed' :
                'pending'
              }`}>{appointment.status}</span>
            )}
          </div>
          {!isPast && !isCancelled && (
            <button className="cancel-button" onClick={() => onCancel && onCancel(appointment.id)}>
              Отменить
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#c8a84b', fontSize: '1.2rem' }}>Загрузка...</div>;


  return (
    <div className="profile-page">
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

      <div className="profile-header">
        <h1 className="profile-title">Личный кабинет</h1>
      </div>
      <div className="breadcrumbs">
        <a href="#main" className="breadcrumb-link">Главная</a>
        <span className="breadcrumb-separator">→</span>
        <span className="breadcrumb-current">Личный кабинет</span>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-container">
              <img
                src={userData.PhotoBase64 || '/images/ава1.jpg'}
                alt={`${userData.FirstName} ${userData.LastName}`}
                className="avatar-image"
                onError={(e) => { e.currentTarget.src = '/images/ава1.jpg'; }}
              />
            </div>
          </div>
          <div className="personal-info">
            <div className="info-row">
              <div className="info-field">
                <label className="field-label">Фамилия:</label>
                <input type="text" name="last_name" value={userData.LastName} onChange={handleInputChange} className="field-input" />
              </div>
              <div className="info-field">
                <label className="field-label">Имя:</label>
                <input type="text" name="first_name" value={userData.FirstName} onChange={handleInputChange} className="field-input" />
              </div>
            </div>
            <div className="info-row">
              <div className="info-field">
                <label className="field-label">Телефон:</label>
                <input type="tel" name="phone" value={userData.Phone} onChange={handleInputChange} className="field-input" />
              </div>
              <div className="info-field">
                <label className="field-label">E-mail:</label>
                <input type="email" name="email" value={userData.Email} onChange={handleInputChange} className="field-input" />
              </div>
            </div>
            <div className="info-row">
              <div className="info-field">
                <label className="field-label">Логин:</label>
                <input type="text" name="login" value={userData.Login} onChange={handleInputChange} className="field-input" />
              </div>
              <div className="info-field">
                <label className="field-label">Пароль:</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password_hash"
                    value={userData.PasswordHash}
                    onChange={handleInputChange}
                    className="password-input"
                    placeholder="Введите пароль"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    <svg width="30" height="30" viewBox="0 0 20 20" fill="none">
                      {showPassword ? (
                        <>
                          <path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="#D4AF37" strokeWidth="1.5"/>
                          <circle cx="10" cy="10" r="3" stroke="#D4AF37" strokeWidth="1.5"/>
                          <path d="M4 4L16 16" stroke="#a0884c" strokeWidth="1.5" strokeLinecap="round"/>
                        </>
                      ) : (
                        <>
                          <path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="#D4AF37" strokeWidth="1.5"/>
                          <circle cx="10" cy="10" r="3" stroke="#a0884c" strokeWidth="1.5"/>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="save-section">
            <button className="save-button" onClick={handleSave}>Сохранить изменения</button>
            <button className="save-button" onClick={handleDeleteAccount} style={{ background: 'linear-gradient(135deg, #8C3A3A 0%, #5a1f1f 100%)' }}>Удалить аккаунт</button>
          </div>
        </div>
      </div>

      <section className="medical-card-section">
        <div className="medical-card-container">
          <div className="medical-card-header">
            <h2 className="medical-card-title">Медицинская карта</h2>
            <DownloadMedicalReportButton
              data={{
                client: {
                  id: userData.UserID,
                  fullName: `${userData.LastName} ${userData.FirstName}`,
                  dateOfBirth: medicalCard.dateOfBirth,
                  gender: medicalCard.gender as 'male' | 'female' | '',
                  phone: userData.Phone,
                  email: userData.Email,
                },
                medicalCard: {
                  allergies: medicalCard.allergies,
                  chronicDiseases: medicalCard.chronicDiseases,
                  medications: medicalCard.medications,
                  doctorRecommendations: medicalCard.doctorRecommendations,
                },
                procedures: procedureHistory,
                generatedAt: new Date().toISOString(),
              }}
            />
          </div>
          <div className="medical-card-body">
            <div className="medical-row">
              <div className="medical-field">
                <label className="medical-label">Дата рождения</label>
                <input type="date" name="dateOfBirth" value={medicalCard.dateOfBirth} onChange={handleMedicalCardChange} className="medical-input" />
              </div>
              <div className="medical-field">
                <label className="medical-label">Пол</label>
                <select name="gender" value={medicalCard.gender} onChange={handleMedicalCardChange} className="medical-input medical-select">
                  <option value="">Не указан</option>
                  <option value="female">Женский</option>
                  <option value="male">Мужской</option>
                </select>
              </div>
            </div>
            <div className="medical-row">
              <div className="medical-field">
                <label className="medical-label">Аллергии</label>
                <textarea name="allergies" value={medicalCard.allergies} onChange={handleMedicalCardChange} className="medical-textarea" placeholder="Укажите известные аллергии..." rows={3} />
              </div>
              <div className="medical-field">
                <label className="medical-label">Хронические заболевания</label>
                <textarea name="chronicDiseases" value={medicalCard.chronicDiseases} onChange={handleMedicalCardChange} className="medical-textarea" placeholder="Укажите хронические заболевания..." rows={3} />
              </div>
            </div>
            <div className="medical-row">
              <div className="medical-field">
                <label className="medical-label">Принимаемые препараты</label>
                <textarea name="medications" value={medicalCard.medications} onChange={handleMedicalCardChange} className="medical-textarea" placeholder="Укажите препараты, которые вы принимаете..." rows={3} />
              </div>
              <div className="medical-field">
                <label className="medical-label">
                  Рекомендации врача
                  <span className="readonly-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="#a0884c" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#a0884c" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Только для чтения
                  </span>
                </label>
                <textarea name="doctorRecommendations" value={medicalCard.doctorRecommendations} className="medical-textarea medical-textarea--readonly" rows={3} readOnly disabled />
              </div>
            </div>
            <div className="medical-save-section">
              <button className="save-button" onClick={handleMedicalCardSave}>Сохранить медицинскую карту</button>
            </div>
          </div>
        </div>
      </section>

      <section className="prescriptions-section">
        <div className="prescriptions-container">
          <h2 className="prescriptions-title">Назначенные препараты</h2>
          {prescriptions.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Назначенных препаратов пока нет</p>
          ) : (
            <div className="prescriptions-grid">
              {prescriptions.map(p => (
                <div key={p.id} className="prescription-card">
                  <div className="prescription-header">
                    <h3>{p.drugName}</h3>
                    <div className="prescription-meta">
                      <span className="prescription-specialist">Назначил: {p.specialistName}</span>
                      <span className="prescription-date">{p.prescribedAt}</span>
                    </div>
                  </div>
                  <div className="prescription-details">
                    <div className="prescription-row">
                      <div className="prescription-field">
                        <span className="prescription-field-label">Частота приема</span>
                        <span className="prescription-field-value">{p.frequency || '—'}</span>
                      </div>
                      <div className="prescription-field">
                        <span className="prescription-field-label">Длительность курса</span>
                        <span className="prescription-field-value">{p.duration || '—'}</span>
                      </div>
                    </div>
                    {p.instructions && (
                      <div className="prescription-instructions">
                        <span className="prescription-instructions-label">Инструкции</span>
                        <div className="prescription-instructions-text">{p.instructions}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="appointments-section">
        <div className="appointments-container">
          <h2 className="appointments-title">Записи</h2>
          {userAppointments.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Записей пока нет</p>
          ) : (
            <div className="appointments-grid">
              <div className="appointments-column">
                {column1Appointments.map(a => <AppointmentCard key={a.id} appointment={a} onCancel={handleCancelAppointment} />)}
              </div>
              <div className="appointments-column">
                {column2Appointments.map(a => <AppointmentCard key={a.id} appointment={a} onCancel={handleCancelAppointment} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-left">
            <div className="footer-logo">SKIN CODE<br />COSMETIC</div>
            <div className="footer-copyright">© 2025 Все права защищены. Косметологический центр</div>
          </div>
          <div className="footer-center">
            <h3 className="form-title3">Контакты</h3>
            <form className="contact-form">
              <input type="text" name="phone" placeholder="Номер телефона" className="form-input" required />
              <input type="tel" name="text" placeholder="Коротко вопрос" className="form-input" required />
              <button type="submit" className="submit-button">Отправить</button>
            </form>
          </div>
          <div className="footer-right">
            <div className="contact-info">
              <div className="contact-item"><strong>Почта:</strong> dearYouthLab@gmail.com</div>
              <div className="contact-item"><strong>Телефон:</strong> 375(33)-444-44-44</div>
              <div className="contact-item"><strong>Адрес:</strong> ул. Руссиянова 13/1</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfilePage;
