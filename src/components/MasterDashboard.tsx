import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../CSS/MasterDashboard.css';
import '../CSS/Header.css';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ===== ТИПЫ =====
interface Client { UserID: number; FirstName: string; LastName: string; Phone: string; Email: string; hasPhoto?: boolean; }
interface Profile { BirthDate?: string; Gender?: string; Allergies?: string; ChronicDiseases?: string; Medications?: string; }
interface Recommendation { RecID: number; Recommendations: string; SpecialistID: number; SpecialistName: string; }
interface Procedure { ReservID: number; ServiceName: string; DurationMinutes: number; ReservDate: string; ReservTime: string; StatusName: string; }
interface Prescription { PrescID: number; MedicationName: string; IntakeFrequency: string; CourseDuration: string; PrescribedDate: string; Instructions: string; IsActive: number; SpecialistName?: string; }
interface DrugRef { id: number; name: string; Description?: string; }
interface ScheduleEntry { ReservID: number; UserID: number; ClientName: string; ClientPhone: string; ServiceName: string; ReservDate: string; ReservTime: string; Status: string; }

function formatDate(s: string) {
  if (!s) return '—';
  // Парсим дату в формате YYYY-MM-DD, чтобы избежать проблем с часовыми поясами
  const parts = s.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  // Если формат другой, пробуем стандартный парсинг
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ===== КОМПОНЕНТ: МЕДКАРТА =====
const MedCardView: React.FC<{ profile: Profile | null }> = ({ profile }) => (
  <div className="md-card-section">
    <h3 className="md-section-title">Медицинская карта</h3>
    {!profile ? <p className="md-empty-text">Медкарта не заполнена</p> : (
      <div className="md-medical-fields">
        <div className="md-info-grid">
          <div className="md-info-item"><span className="md-info-label">Дата рождения</span><span className="md-info-value">{formatDate(profile.BirthDate || '')}</span></div>
          <div className="md-info-item"><span className="md-info-label">Пол</span><span className="md-info-value">{profile.Gender === 'female' ? 'Женский' : profile.Gender === 'male' ? 'Мужской' : '—'}</span></div>
        </div>
        <div className="md-medical-field"><span className="md-info-label">Аллергии</span><span className={`md-info-value ${profile.Allergies ? 'md-value--warning' : ''}`}>{profile.Allergies || '—'}</span></div>
        <div className="md-medical-field"><span className="md-info-label">Хронические заболевания</span><span className="md-info-value">{profile.ChronicDiseases || '—'}</span></div>
        <div className="md-medical-field"><span className="md-info-label">Принимаемые препараты</span><span className="md-info-value">{profile.Medications || '—'}</span></div>
      </div>
    )}
  </div>
);

// ===== КОМПОНЕНТ: ИСТОРИЯ ПРОЦЕДУР =====
const ProcedureHistory: React.FC<{ procedures: Procedure[] }> = ({ procedures }) => (
  <div className="md-card-section">
    <h3 className="md-section-title">История процедур</h3>
    {procedures.length === 0 ? <p className="md-empty-text">Процедур пока нет</p> : (
      <div className="md-procedures-list">
        {procedures.map(p => (
          <div key={p.ReservID} className="md-procedure-item">
            <div className="md-procedure-header">
              <span className="md-procedure-name">{p.ServiceName}</span>
              <span className="md-status-badge">{p.StatusName}</span>
            </div>
            <div className="md-procedure-meta">
              <span>{formatDate(p.ReservDate)} в {p.ReservTime?.substring(0,5)}</span>
              <span>{p.DurationMinutes} мин</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ===== КОМПОНЕНТ: РЕКОМЕНДАЦИИ =====
const RecommendationsView: React.FC<{
  recs: Recommendation[]; clientId: number; specialistUserId: number;
  onRefresh: () => void;
}> = ({ recs, clientId, specialistUserId, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (editId !== null) {
      await apiPut(`/api/master/recommendations/${editId}`, { text });
    } else {
      await apiPost('/api/master/recommendations', { clientId, specialistId: specialistUserId, text });
    }
    setText(''); setShowForm(false); setEditId(null);
    onRefresh();
  };

  const handleEdit = (r: Recommendation) => { setText(r.Recommendations); setEditId(r.RecID); setShowForm(true); };

  const handleDelete = async (id: number) => {
    await apiDelete(`/api/master/recommendations/${id}`);
    onRefresh();
  };

  return (
    <div className="md-card-section">
      <div className="md-section-header">
        <h3 className="md-section-title">Рекомендации</h3>
        <button className="md-add-btn" onClick={() => { setText(''); setEditId(null); setShowForm(true); }}>+ Добавить</button>
      </div>
      {showForm && (
        <div className="md-rec-form">
          <textarea className="md-form-textarea" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="Текст рекомендации..." />
          <div className="md-form-actions">
            <button className="md-btn md-btn--secondary" onClick={() => { setShowForm(false); setEditId(null); setText(''); }}>Отмена</button>
            <button className="md-btn md-btn--primary" onClick={handleSubmit} disabled={!text.trim()}>{editId ? 'Сохранить' : 'Добавить'}</button>
          </div>
        </div>
      )}
      {recs.length === 0 && !showForm && <p className="md-empty-text">Рекомендаций пока нет</p>}
      <div className="md-rec-list">
        {recs.map(r => (
          <div key={r.RecID} className="md-rec-item">
            <div className="md-rec-header">
              <span className="md-rec-specialist">{r.SpecialistName}</span>
              <div className="md-rec-actions">
                <button className="md-icon-btn" onClick={() => handleEdit(r)}>✎</button>
                <button className="md-icon-btn md-icon-btn--danger" onClick={() => handleDelete(r.RecID)}>✕</button>
              </div>
            </div>
            <p className="md-rec-text">{r.Recommendations}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== КОМПОНЕНТ: ПРЕПАРАТЫ =====
const PrescriptionsView: React.FC<{
  prescriptions: Prescription[]; drugRefs: DrugRef[]; clientId: number; specialistId: number; onRefresh: () => void;
}> = ({ prescriptions, drugRefs, clientId, specialistId, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ drugName: '', frequency: '', duration: '', instructions: '' });

  const handleSubmit = async () => {
    if (!form.drugName.trim()) return;
    if (!clientId) { alert('Клиент не выбран'); return; }
    if (!specialistId) { alert('Специалист не определён, попробуйте перезагрузить страницу'); return; }
    try {
      if (editingId) {
        await apiPut(`/api/master/prescriptions/${editingId}`, form);
      } else {
        await apiPost('/api/master/prescriptions', { ...form, clientId, specialistId });
      }
      setForm({ drugName: '', frequency: '', duration: '', instructions: '' });
      setShowForm(false);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      alert('Ошибка при сохранении препарата');
      console.error('[PrescriptionsView] handleSubmit error', err);
    }
  };

  const handleEdit = (prescription: Prescription) => {
    setForm({
      drugName: prescription.MedicationName,
      frequency: prescription.IntakeFrequency || '',
      duration: prescription.CourseDuration || '',
      instructions: prescription.Instructions || ''
    });
    setEditingId(prescription.PrescID);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/master/prescriptions/${id}`);
      onRefresh();
    } catch (err) {
      alert('Ошибка при удалении препарата');
      console.error('[PrescriptionsView] handleDelete error', err);
    }
  };

  return (
    <div className="md-card-section">
      <div className="md-section-header">
        <h3 className="md-section-title">Назначенные препараты</h3>
        <button className="md-add-btn" onClick={() => { setShowForm(true); setEditingId(null); setForm({ drugName:'', frequency:'', duration:'', instructions:'' }); }}>+ Назначить</button>
      </div>
      {showForm && (
        <div className="md-rec-form">
          <h4 style={{ marginBottom: '16px', color: '#333' }}>{editingId ? 'Редактировать препарат' : 'Назначить новый препарат'}</h4>
          <div className="md-form-field">
            <label className="md-form-label">Название препарата</label>
            <input
              type="text"
              className="md-form-input"
              placeholder="Введите название препарата..."
              value={form.drugName}
              onChange={e => setForm(p => ({ ...p, drugName: e.target.value }))}
            />
          </div>
          <div className="md-form-row">
            <div className="md-form-field">
              <label className="md-form-label">Частота</label>
              <input type="text" className="md-form-input" placeholder="1 раз в день" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} />
            </div>
            <div className="md-form-field">
              <label className="md-form-label">Длительность</label>
              <input type="text" className="md-form-input" placeholder="10 дней" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
            </div>
          </div>
          <div className="md-form-field">
            <label className="md-form-label">Инструкции</label>
            <textarea className="md-form-textarea" rows={2} value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} />
          </div>
          <div className="md-form-actions">
            <button className="md-btn md-btn--secondary" onClick={() => { setShowForm(false); setEditingId(null); setForm({ drugName:'', frequency:'', duration:'', instructions:'' }); }}>Отмена</button>
            <button className="md-btn md-btn--primary" onClick={handleSubmit} disabled={!form.drugName.trim()}>{editingId ? 'Сохранить' : 'Назначить'}</button>
          </div>
        </div>
      )}
      {prescriptions.length === 0 && !showForm && <p className="md-empty-text">Назначений пока нет</p>}
      {prescriptions.length > 0 && (
        <div className="md-drugs-table-wrap">
          <table className="md-drugs-table">
            <thead><tr><th>Препарат</th><th>Частота</th><th>Курс</th><th>Дата</th><th>Назначил</th><th>Инструкции</th><th>Действия</th></tr></thead>
            <tbody>
              {prescriptions.map(d => (
                <tr key={d.PrescID}>
                  <td className="md-drug-name">{d.MedicationName}</td>
                  <td>{d.IntakeFrequency || '—'}</td>
                  <td>{d.CourseDuration || '—'}</td>
                  <td>{formatDate(d.PrescribedDate)}</td>
                  <td>{d.SpecialistName || '—'}</td>
                  <td>{d.Instructions || '—'}</td>
                  <td>
                    <div className="md-rec-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="md-icon-btn" onClick={() => handleEdit(d)} title="Редактировать">✎</button>
                      <button className="md-icon-btn md-icon-btn--danger" onClick={() => handleDelete(d.PrescID)} title="Удалить">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ===== КОМПОНЕНТ: РАСПИСАНИЕ =====
const ScheduleView: React.FC<{ specialistId: number }> = ({ specialistId }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [entryClientData, setEntryClientData] = useState<{ profile: Profile | null; recommendations: Recommendation[] } | null>(null);

  const weekStart = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(today);
    mon.setDate(today.getDate() + diff + weekOffset * 7);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }, [weekOffset]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  }), [weekStart]);

  useEffect(() => {
    const from = weekDays[0].toISOString().split('T')[0];
    const to   = weekDays[6].toISOString().split('T')[0];
    apiGet<ScheduleEntry[]>(`/api/master/${specialistId}/schedule?from=${from}&to=${to}`)
      .then(d => setSchedule(d || []))
      .catch(() => {});
  }, [specialistId, weekStart]);

  const handleEntryClick = async (entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    setEntryClientData(null);
    try {
      const d = await apiGet<any>(`/api/master/client/${entry.UserID}?specialistId=${specialistId}`);
      setEntryClientData({ profile: d.profile, recommendations: d.recommendations || [] });
    } catch {}
  };

  const toDateStr = (d: Date) => {
    // Используем локальную дату, а не UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = toDateStr(new Date());
  const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const weekEnd = weekDays[6];
  const weekLabel = `${weekDays[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="md-schedule">
      <div className="md-schedule-nav">
        <button className="md-week-nav-btn" onClick={() => setWeekOffset(o => o - 1)}>←</button>
        <span className="md-week-label">{weekLabel}</span>
        <button className="md-week-nav-btn" onClick={() => setWeekOffset(o => o + 1)}>→</button>
        {weekOffset !== 0 && <button className="md-today-btn" onClick={() => setWeekOffset(0)}>Сегодня</button>}
      </div>
      <div className="md-schedule-grid">
        {weekDays.map((day, i) => {
          const dateStr = toDateStr(day);
          const dayEntries = schedule.filter(e => e.ReservDate === dateStr).sort((a, b) => a.ReservTime.localeCompare(b.ReservTime));
          const isToday = dateStr === todayStr;
          return (
            <div key={i} className={`md-schedule-day ${isToday ? 'md-schedule-day--today' : ''}`}>
              <div className="md-schedule-day-header">
                <span className="md-schedule-day-name">{DAY_NAMES[i]}</span>
                <span className={`md-schedule-day-date ${isToday ? 'md-schedule-day-date--today' : ''}`}>
                  {day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                {dayEntries.length > 0 && <span className="md-schedule-day-count">{dayEntries.length}</span>}
              </div>
              <div className="md-schedule-entries">
                {dayEntries.length === 0
                  ? <div className="md-schedule-empty">Нет записей</div>
                  : dayEntries.map(entry => (
                    <button
                      key={entry.ReservID}
                      className="md-schedule-entry md-schedule-entry--clickable"
                      onClick={() => handleEntryClick(entry)}
                      aria-label={`Подробнее: ${entry.ClientName}, ${entry.ReservTime}`}
                    >
                      <div className="md-entry-time">{entry.ReservTime?.substring(0,5)}</div>
                      <div className="md-entry-body">
                        <div className="md-entry-client">{entry.ClientName}</div>
                        <div className="md-entry-service">{entry.ServiceName}</div>
                        <div className="md-entry-hint">Нажмите для подробностей →</div>
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Модальное окно с деталями записи */}
      {selectedEntry && (
        <div className="md-modal-overlay" onClick={() => setSelectedEntry(null)} role="dialog" aria-modal="true">
          <div className="md-entry-modal" onClick={e => e.stopPropagation()}>
            <button className="md-modal-close-btn" onClick={() => setSelectedEntry(null)} aria-label="Закрыть">✕</button>

            <div className="md-entry-modal-header">
              <div className="md-entry-modal-time">
                <span className="md-entry-modal-date">
                  {(() => {
                    // Парсим дату в формате YYYY-MM-DD, чтобы избежать проблем с часовыми поясами
                    const parts = selectedEntry.ReservDate.split('-');
                    if (parts.length === 3) {
                      const [year, month, day] = parts.map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                    }
                    return new Date(selectedEntry.ReservDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                  })()}
                </span>
                <span className="md-entry-modal-clock">{selectedEntry.ReservTime?.substring(0,5)}</span>
              </div>
              <h2 className="md-entry-modal-service">{selectedEntry.ServiceName}</h2>
              <span className="md-status-badge">{selectedEntry.Status}</span>
            </div>

            <div className="md-entry-modal-section">
              <h3 className="md-entry-modal-section-title">Клиент</h3>
              <div className="md-entry-modal-client">
                <div className="md-client-avatar md-client-avatar--md">
                  {selectedEntry.ClientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="md-entry-modal-client-name">{selectedEntry.ClientName}</div>
                  <div className="md-entry-modal-client-phone">{selectedEntry.ClientPhone}</div>
                </div>
              </div>
            </div>

            {entryClientData === null ? (
              <p style={{ color: '#888', padding: '12px 0' }}>Загрузка медкарты...</p>
            ) : (
              <>
                <div className="md-entry-modal-section">
                  <h3 className="md-entry-modal-section-title">Медицинская карта</h3>
                  {!entryClientData.profile ? (
                    <p style={{ color: '#888' }}>Медкарта не заполнена</p>
                  ) : (
                    <div className="md-entry-modal-medcard">
                      {entryClientData.profile.Allergies && (
                        <div className="md-entry-modal-field md-entry-modal-field--warning">
                          <span className="md-entry-modal-field-label">⚠ Аллергии</span>
                          <span className="md-entry-modal-field-value">{entryClientData.profile.Allergies}</span>
                        </div>
                      )}
                      <div className="md-entry-modal-field">
                        <span className="md-entry-modal-field-label">Хронические заболевания</span>
                        <span className="md-entry-modal-field-value">{entryClientData.profile.ChronicDiseases || '—'}</span>
                      </div>
                      <div className="md-entry-modal-field">
                        <span className="md-entry-modal-field-label">Принимаемые препараты</span>
                        <span className="md-entry-modal-field-value">{entryClientData.profile.Medications || '—'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {entryClientData.recommendations.length > 0 && (
                  <div className="md-entry-modal-section">
                    <h3 className="md-entry-modal-section-title">Рекомендации специалистов</h3>
                    {entryClientData.recommendations.map(r => (
                      <div key={r.RecID} className="md-rec-item" style={{ marginBottom: '8px' }}>
                        <span className="md-rec-specialist">{r.SpecialistName}</span>
                        <p className="md-rec-text">{r.Recommendations}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== ОСНОВНАЯ СТРАНИЦА =====
type TabKey = 'medical' | 'procedures' | 'recommendations' | 'prescriptions';
type PageMode = 'clients' | 'schedule';

const MasterDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Получаем данные специалиста из sessionStorage
  const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const masterName = `${sessionUser.LastName || ''} ${sessionUser.FirstName || ''}`.trim();

  const [specialistId, setSpecialistId] = useState<number | null>(null);
  const [specialistUserId] = useState<number>(sessionUser.UserID || 0);

  const [pageMode, setPageMode] = useState<PageMode>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('medical');
  const [search, setSearch] = useState('');

  // Данные выбранного клиента
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [drugRefs, setDrugRefs] = useState<DrugRef[]>([]);
  const [clientLoading, setClientLoading] = useState(false);

  // Получаем SpecialistID по UserID
  useEffect(() => {
    if (!sessionUser.UserID) { navigate('/login'); return; }
    apiGet<{ success: boolean; specialists: any[] }>('/api/admin/specialists')
      .then(d => {
        const sp = (d.specialists || []).find((s: any) => s.UserID === sessionUser.UserID);
        console.log('[MasterDashboard] sessionUser.UserID=', sessionUser.UserID, 'found specialist=', sp);
        if (sp) setSpecialistId(sp.SpecialistID);
        else console.warn('[MasterDashboard] Specialist not found for UserID=', sessionUser.UserID);
      })
      .catch(e => console.error('[MasterDashboard] error loading specialists', e));
    apiGet<DrugRef[]>('/api/master/drug-references')
      .then(d => setDrugRefs(d || []))
      .catch(() => {});
  }, []);

  // Загрузка клиентов
  useEffect(() => {
    if (!specialistId) return;
    console.log('[MasterDashboard] loading clients for specialistId=', specialistId);
    apiGet<Client[]>(`/api/master/${specialistId}/clients`)
      .then(d => {
        console.log('[MasterDashboard] clients loaded:', d?.length, d);
        setClients(d || []); if (d && d.length > 0) setSelectedClient(d[0]);
      })
      .catch(e => console.error('[MasterDashboard] error loading clients', e));
  }, [specialistId]);

  // Загрузка данных выбранного клиента
  const loadClientData = (client: Client) => {
    if (!specialistId) return;
    setClientLoading(true);
    apiGet<any>(`/api/master/client/${client.UserID}?specialistId=${specialistId}`)
      .then(d => {
        setProfile(d.profile);
        setRecommendations(d.recommendations || []);
        setProcedures(d.procedures || []);
        setPrescriptions(d.prescriptions || []);
      })
      .catch(() => {})
      .finally(() => setClientLoading(false));
  };

  useEffect(() => {
    if (selectedClient) loadClientData(selectedClient);
  }, [selectedClient, specialistId]);

  const filteredClients = clients.filter(c =>
    `${c.LastName} ${c.FirstName}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.Phone || '').includes(search)
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'medical', label: 'Медкарта' },
    { key: 'procedures', label: 'Процедуры' },
    { key: 'recommendations', label: 'Рекомендации' },
    { key: 'prescriptions', label: 'Препараты' },
  ];

  return (
    <div className="md-page">
      <nav className="navbar">
        <div className="nav-container" style={{ justifyContent: 'center' }}>
          <img src="/images/лого.png" alt="SKIN CODE" className="nav-logo" />
        </div>
      </nav>

      <div className="md-layout">
        <aside className="md-sidebar">
          <div className="md-sidebar-header">
            <h1 className="md-page-title">Кабинет мастера</h1>
            <p className="md-page-subtitle">{masterName}</p>
            <div className="md-mode-switch">
              <button className={`md-mode-btn ${pageMode==='clients'?'md-mode-btn--active':''}`} onClick={() => setPageMode('clients')}>Клиенты</button>
              <button className={`md-mode-btn ${pageMode==='schedule'?'md-mode-btn--active':''}`} onClick={() => setPageMode('schedule')}>Расписание</button>
            </div>
          </div>
          {pageMode === 'clients' && (
            <div className="md-client-list">
              <div className="md-search-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#7A8C84" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="#7A8C84" strokeWidth="2" strokeLinecap="round"/></svg>
                <input type="text" className="md-search" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="md-client-count">{filteredClients.length} клиент{filteredClients.length !== 1 ? 'ов' : ''}</div>
              <ul className="md-clients">
                {filteredClients.map(c => (
                  <li key={c.UserID}
                    className={`md-client-item ${selectedClient?.UserID === c.UserID ? 'md-client-item--active' : ''}`}
                    onClick={() => { setSelectedClient(c); setActiveTab('medical'); }}
                    tabIndex={0} onKeyDown={e => e.key === 'Enter' && setSelectedClient(c)}
                  >
                    <div className="md-client-avatar">
                      {c.hasPhoto
                        ? <img src={`${BASE_URL}/api/user/${c.UserID}/photo`} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
                        : `${(c.FirstName||'')[0]}${(c.LastName||'')[0]}`
                      }
                    </div>
                    <div className="md-client-info">
                      <span className="md-client-name">{c.LastName} {c.FirstName}</span>
                      <span className="md-client-phone">{c.Phone}</span>
                    </div>
                  </li>
                ))}
                {filteredClients.length === 0 && <li className="md-empty">Клиенты не найдены</li>}
              </ul>
            </div>
          )}
        </aside>

        <main className="md-content">
          {pageMode === 'schedule' ? (
            specialistId ? <ScheduleView specialistId={specialistId} /> : <p style={{padding:'40px',color:'#888'}}>Загрузка...</p>
          ) : selectedClient ? (
            <>
              <div className="md-client-header">
                <div className="md-client-avatar md-client-avatar--lg">
                  {(selectedClient.FirstName||'')[0]}{(selectedClient.LastName||'')[0]}
                </div>
                <div>
                  <h2 className="md-client-fullname">{selectedClient.LastName} {selectedClient.FirstName}</h2>
                  <div className="md-client-contacts">
                    <span>{selectedClient.Phone}</span>
                    <span>{selectedClient.Email}</span>
                  </div>
                </div>
              </div>

              <div className="md-tabs" role="tablist">
                {TABS.map(tab => (
                  <button key={tab.key} className={`md-tab ${activeTab===tab.key?'md-tab--active':''}`}
                    onClick={() => setActiveTab(tab.key)} role="tab" aria-selected={activeTab===tab.key}>
                    {tab.label}
                    {tab.key === 'recommendations' && recommendations.length > 0 && <span className="md-tab-count">{recommendations.length}</span>}
                    {tab.key === 'prescriptions' && prescriptions.filter(p=>p.IsActive).length > 0 && <span className="md-tab-count">{prescriptions.filter(p=>p.IsActive).length}</span>}
                  </button>
                ))}
              </div>

              <div className="md-tab-content" role="tabpanel">
                {clientLoading ? <p style={{padding:'40px',color:'#888'}}>Загрузка...</p> : (
                  <>
                    {activeTab === 'medical' && <MedCardView profile={profile} />}
                    {activeTab === 'procedures' && <ProcedureHistory procedures={procedures} />}
                    {activeTab === 'recommendations' && (
                      <RecommendationsView
                        recs={recommendations}
                        clientId={selectedClient.UserID}
                        specialistUserId={specialistUserId}
                        onRefresh={() => loadClientData(selectedClient)}
                      />
                    )}
                    {activeTab === 'prescriptions' && (
                      <PrescriptionsView
                        prescriptions={prescriptions}
                        drugRefs={drugRefs}
                        clientId={selectedClient.UserID}
                        specialistId={specialistId || 0}
                        onRefresh={() => loadClientData(selectedClient)}
                      />
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <p style={{padding:'40px',color:'#888',textAlign:'center'}}>Выберите клиента из списка</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default MasterDashboard;
