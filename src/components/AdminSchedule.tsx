import React, { useState, useEffect, useCallback } from 'react';
import '../CSS/AdminSchedule.css';
import '../CSS/Users_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPut } from '../utils/api';

// ===== ТИПЫ =====

interface Specialist { id: number; name: string; }
interface WorkingHour { dayOfWeek: number; startTime: string; endTime: string; isWorkingDay: boolean; }
interface BreakSlot { dayOfWeek: number; breakStart: string; breakEnd: string; }
interface Toast { id: number; message: string; type: 'success' | 'error'; }

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const DEFAULT_HOURS: WorkingHour[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i, startTime: '09:00', endTime: '18:00', isWorkingDay: i < 5,
}));

// ===== МОДАЛКА НАСТРОЙКИ ДНЯ =====

interface DayModalProps {
  dayIndex: number;
  wh: WorkingHour;
  breaks: BreakSlot[];
  onSave: (wh: WorkingHour, breaks: BreakSlot[]) => void;
  onClose: () => void;
}

const DayModal: React.FC<DayModalProps> = ({ dayIndex, wh, breaks, onSave, onClose }) => {
  const [localWH, setLocalWH] = useState<WorkingHour>({ ...wh });
  const [localBreaks, setLocalBreaks] = useState<BreakSlot[]>(breaks.filter(b => b.dayOfWeek === dayIndex));
  const [bStart, setBStart] = useState('');
  const [bEnd, setBEnd] = useState('');
  const [error, setError] = useState('');

  const addBreak = () => {
    if (!bStart || !bEnd) { setError('Укажите начало и конец перерыва'); return; }
    const [sh, sm] = bStart.split(':').map(Number);
    const [eh, em] = bEnd.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) { setError('Начало перерыва должно быть раньше конца'); return; }
    setLocalBreaks(prev => [...prev, { dayOfWeek: dayIndex, breakStart: bStart, breakEnd: bEnd }]);
    setBStart(''); setBEnd(''); setError('');
  };

  const handleSave = () => {
    if (localWH.isWorkingDay) {
      const [sh, sm] = localWH.startTime.split(':').map(Number);
      const [eh, em] = localWH.endTime.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) { setError('Время начала должно быть раньше окончания'); return; }
    }
    onSave(localWH, localBreaks);
  };

  return (
    <div className="as-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="as-modal" onClick={e => e.stopPropagation()}>
        <button className="as-modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        <h2 className="as-modal-title">{DAY_NAMES[dayIndex]}</h2>

        <div className="as-toggle-row">
          <span className="as-toggle-label">Рабочий день</span>
          <button
            className={`as-toggle ${localWH.isWorkingDay ? 'as-toggle--on' : 'as-toggle--off'}`}
            onClick={() => setLocalWH(p => ({ ...p, isWorkingDay: !p.isWorkingDay }))}
            role="switch" aria-checked={localWH.isWorkingDay}
          >
            <span className="as-toggle-thumb" />
          </button>
        </div>

        {localWH.isWorkingDay && (
          <>
            <div className="as-time-row">
              <div className="as-time-field">
                <label className="as-field-label">Начало</label>
                <input type="time" className="as-time-input" value={localWH.startTime}
                  onChange={e => setLocalWH(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <span className="as-time-dash">—</span>
              <div className="as-time-field">
                <label className="as-field-label">Конец</label>
                <input type="time" className="as-time-input" value={localWH.endTime}
                  onChange={e => setLocalWH(p => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>

            <div className="as-field-row">
              <label className="as-field-label">Перерывы</label>
              <div className="as-breaks-list">
                {localBreaks.length === 0
                  ? <span className="as-breaks-empty">Перерывы не добавлены</span>
                  : localBreaks.map((b, i) => (
                    <span key={i} className="as-break-tag">
                      {b.breakStart} — {b.breakEnd}
                      <button onClick={() => setLocalBreaks(prev => prev.filter((_, j) => j !== i))} aria-label="Удалить">✕</button>
                    </span>
                  ))
                }
              </div>
              <div className="as-break-add">
                <input type="time" className="as-time-input" value={bStart} onChange={e => setBStart(e.target.value)} aria-label="Начало перерыва" />
                <span className="as-time-dash">—</span>
                <input type="time" className="as-time-input" value={bEnd} onChange={e => setBEnd(e.target.value)} aria-label="Конец перерыва" />
                <button className="as-add-break-btn" onClick={addBreak}>+ Добавить</button>
              </div>
            </div>
          </>
        )}

        {error && <p className="as-error" role="alert">{error}</p>}

        <div className="as-modal-footer">
          <button className="as-btn as-btn--secondary" onClick={onClose}>Отмена</button>
          <button className="as-btn as-btn--primary" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

// ===== ОСНОВНАЯ СТРАНИЦА =====

const AdminSchedule: React.FC = () => {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(DEFAULT_HOURS);
  const [breakSlots, setBreakSlots] = useState<BreakSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalDay, setModalDay] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Загрузка списка специалистов
  useEffect(() => {
    apiGet<{ success: boolean; specialists: any[] }>('/api/admin/specialists')
      .then(d => {
        const list = (d.specialists || []).map(s => ({ id: s.SpecialistID, name: `${s.LastName} ${s.FirstName}` }));
        setSpecialists(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, []);

  // Загрузка расписания при смене специалиста
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    apiGet<{ workingHours: any[]; breakSlots: any[] }>(`/api/schedule/working-hours/${selectedId}`)
      .then(d => {
        const toTimeStr = (val: any): string => {
          if (!val) return '';
          const s = typeof val === 'string' ? val : String(val);
          // ISO формат: "1970-01-01T09:00:00.000Z" → берём часть после T
          if (s.includes('T')) {
            return s.split('T')[1].substring(0, 5);
          }
          // Уже HH:MM или HH:MM:SS
          return s.substring(0, 5);
        };

        if (d.workingHours && d.workingHours.length > 0) {
          const wh: WorkingHour[] = DEFAULT_HOURS.map(def => {
            const found = d.workingHours.find((w: any) => w.DayOfWeek === def.dayOfWeek);
            if (!found) return def;
            return {
              dayOfWeek: found.DayOfWeek,
              startTime: found.StartTime ? toTimeStr(found.StartTime) : '09:00',
              endTime: found.EndTime ? toTimeStr(found.EndTime) : '18:00',
              isWorkingDay: !!found.IsWorkingDay,
            };
          });
          setWorkingHours(wh);
        } else {
          setWorkingHours(DEFAULT_HOURS);
        }
        const bs: BreakSlot[] = (d.breakSlots || []).map((b: any) => ({
          dayOfWeek: b.DayOfWeek,
          breakStart: b.BreakStart ? toTimeStr(b.BreakStart) : '',
          breakEnd: b.BreakEnd ? toTimeStr(b.BreakEnd) : '',
        }));
        setBreakSlots(bs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedId]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const handleSaveAll = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const result = await apiPut<{ success: boolean; conflicts: any[] }>('/api/schedule/working-hours', {
        specialistId: selectedId,
        workingHours: workingHours.map(w => ({
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
          isWorkingDay: w.isWorkingDay,
        })),
        breakSlots: breakSlots.map(b => ({
          dayOfWeek: b.dayOfWeek,
          breakStart: b.breakStart,
          breakEnd: b.breakEnd,
        })),
      });

      if (result.conflicts && result.conflicts.length > 0) {
        const list = result.conflicts.map(c =>
          `• ${c.ClientName} — ${c.ServiceName}, ${c.ReservDate} в ${c.ReservTime.substring(0,5)}`
        ).join('\n');
        showToast(`Расписание сохранено. Конфликты с записями (${result.conflicts.length}):`, 'error');

      } else {
        showToast('Расписание сохранено в базе данных');
      }
    } catch {
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDaySave = (wh: WorkingHour, breaks: BreakSlot[]) => {
    setWorkingHours(prev => prev.map(w => w.dayOfWeek === wh.dayOfWeek ? wh : w));
    setBreakSlots(prev => [...prev.filter(b => b.dayOfWeek !== wh.dayOfWeek), ...breaks]);
    setModalDay(null);
  };

  const filteredSpecialists = specialists.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSpec = specialists.find(s => s.id === selectedId);

  return (
    <div className="admin-container">
      <AdminSidebar active="schedule" />

      <main className="admin-content as-main">
        <header className="content-header">
          <h1>Управление расписанием</h1>
          <button className="save-all-btn" onClick={handleSaveAll} disabled={saving || !selectedId}>
            {saving ? 'Сохранение...' : 'Сохранить расписание'}
          </button>
        </header>

        <div className="as-layout">
          {/* Список специалистов */}
          <div className="as-master-selector">
            <div className="as-master-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="8" stroke="#7A8C84" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="#7A8C84" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Поиск мастера..." value={search}
                onChange={e => setSearch(e.target.value)} className="as-search-input" />
            </div>
            <div className="as-master-list">
              {filteredSpecialists.map(s => (
                <button
                  key={s.id}
                  className={`as-master-card ${selectedId === s.id ? 'as-master-card--active' : ''}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <img src="/images/IconUser.png" alt={s.name} className="as-master-avatar"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/IconUser.png'; }} />
                  <div className="as-master-info">
                    <span className="as-master-name">{s.name}</span>
                  </div>
                  {selectedId === s.id && <span className="as-master-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Расписание */}
          <div className="as-schedule-panel">
            {!selectedId ? (
              <p style={{ color: '#7A8C84', padding: '40px', textAlign: 'center' }}>Выберите специалиста</p>
            ) : loading ? (
              <p style={{ color: '#c8a84b', padding: '40px', textAlign: 'center' }}>Загрузка...</p>
            ) : (
              <>
                <h2 className="as-section-title">
                  Расписание: {selectedSpec?.name}
                </h2>
                <div className="as-week-grid">
                  {workingHours.map(wh => {
                    const dayBreaks = breakSlots.filter(b => b.dayOfWeek === wh.dayOfWeek);
                    return (
                      <div
                        key={wh.dayOfWeek}
                        className={`as-day-col ${wh.isWorkingDay ? 'as-day-col--working' : 'as-day-col--off'}`}
                      >
                        <div className="as-day-header">
                          <span className="as-day-name">{DAY_SHORT[wh.dayOfWeek]}</span>
                          <span className="as-day-date">{DAY_NAMES[wh.dayOfWeek]}</span>
                        </div>

                        {wh.isWorkingDay ? (
                          <>
                            <div className="as-day-hours">{wh.startTime} — {wh.endTime}</div>
                            {dayBreaks.length > 0 && (
                              <div className="as-day-breaks">
                                {dayBreaks.map((b, i) => (
                                  <span key={i} className="as-break-tag" style={{ fontSize: '11px' }}>
                                    {b.breakStart}–{b.breakEnd}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="as-day-off-label">Выходной</div>
                        )}

                        <button className="as-day-settings-btn" onClick={() => setModalDay(wh.dayOfWeek)}>
                          Настроить
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Модалка */}
      {modalDay !== null && (
        <DayModal
          dayIndex={modalDay}
          wh={workingHours.find(w => w.dayOfWeek === modalDay) ?? DEFAULT_HOURS[modalDay]}
          breaks={breakSlots}
          onSave={handleDaySave}
          onClose={() => setModalDay(null)}
        />
      )}

      {/* Тосты */}
      <div className="as-toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`as-toast as-toast--${t.type}`}>
            {t.type === 'success' ? '✓' : '⚠'} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSchedule;
