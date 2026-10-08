// ===== ИНТЕРФЕЙСЫ =====

export interface Master {
  id: number;
  name: string;
  specialty: string;
  avatar?: string;
}

export interface WorkingHours {
  dayOfWeek: number;   // 0=Пн, 1=Вт, ... 6=Вс
  startTime: string;   // "09:00"
  endTime: string;     // "18:00"
  isWorkingDay: boolean;
  breakSlots?: string[]; // ["13:00-14:00"]
}

export interface TimeSlot {
  id: string;
  masterId: number;
  date: string;        // "2026-04-14"
  time: string;        // "10:00"
  status: 'available' | 'booked' | 'blocked';
  clientId?: number;
}

export interface ScheduleSettings {
  masterId: number;
  weekStart: string;   // "2026-04-14"
  workingHours: WorkingHours[];
  timeSlotDuration: number; // 30 или 60
}

// ===== MOCK-ДАННЫЕ =====

// TODO: заменить на реальные данные из нового API
export const MOCK_MASTERS: Master[] = [
  { id: 1, name: 'Малахова Александра', specialty: 'Врач-дерматолог', avatar: '/images/косметолог1.jpg' },
  { id: 2, name: 'Петрова Ирина',       specialty: 'Косметолог-эстетист', avatar: '/images/косметолог2.jpg' },
  { id: 3, name: 'Сидорова Наталья',    specialty: 'Мастер педикюра', avatar: '/images/косметолог3.jpg' },
  { id: 4, name: 'Козлова Светлана',    specialty: 'Массажист', avatar: '/images/косметолог4.jpg' },
  { id: 5, name: 'Морозова Юлия',       specialty: 'Специалист по эпиляции', avatar: '/images/косметолог5.jpg' },
];

const DEFAULT_WORKING_HOURS: WorkingHours[] = [
  { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isWorkingDay: true,  breakSlots: ['13:00-14:00'] },
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkingDay: true,  breakSlots: ['13:00-14:00'] },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkingDay: true,  breakSlots: ['13:00-14:00'] },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkingDay: true,  breakSlots: ['13:00-14:00'] },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkingDay: true,  breakSlots: ['13:00-14:00'] },
  { dayOfWeek: 5, startTime: '10:00', endTime: '15:00', isWorkingDay: true,  breakSlots: [] },
  { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isWorkingDay: false, breakSlots: [] },
];

// TODO: заменить на реальные данные из нового API
export const MOCK_SCHEDULE_SETTINGS: Record<number, ScheduleSettings> = {
  1: { masterId: 1, weekStart: '', workingHours: DEFAULT_WORKING_HOURS, timeSlotDuration: 60 },
  2: { masterId: 2, weekStart: '', workingHours: [...DEFAULT_WORKING_HOURS.map(d => d.dayOfWeek === 5 ? { ...d, isWorkingDay: false } : d)], timeSlotDuration: 30 },
  3: { masterId: 3, weekStart: '', workingHours: DEFAULT_WORKING_HOURS, timeSlotDuration: 60 },
  4: { masterId: 4, weekStart: '', workingHours: DEFAULT_WORKING_HOURS, timeSlotDuration: 60 },
  5: { masterId: 5, weekStart: '', workingHours: DEFAULT_WORKING_HOURS, timeSlotDuration: 30 },
};

// ===== УТИЛИТЫ =====

/** Возвращает дату начала недели (Пн) для переданной даты */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // JS: 0=Вс, 1=Пн ... переводим в Пн=0
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Возвращает массив из 7 дат недели начиная с Пн */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Форматирует дату в "14 апр" */
export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** Форматирует диапазон недели "14–20 апр 2026" */
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const startStr = weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

/** Форматирует Date в "YYYY-MM-DD" */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Парсит "HH:MM" в минуты от полуночи */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Минуты → "HH:MM" */
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
}

/**
 * Генерирует временные слоты для одного дня.
 * Исключает перерывы и помечает часть слотов как booked (mock).
 */
export function generateSlotsForDay(
  masterId: number,
  date: Date,
  wh: WorkingHours,
  duration: number,
  existingSlots: TimeSlot[] = []
): TimeSlot[] {
  if (!wh.isWorkingDay) return [];

  const dateStr = toISODate(date);
  const start = timeToMinutes(wh.startTime);
  const end   = timeToMinutes(wh.endTime);

  // Собираем заблокированные диапазоны из перерывов
  const blockedRanges = (wh.breakSlots ?? []).map(b => {
    const [s, e] = b.split('-');
    return { start: timeToMinutes(s), end: timeToMinutes(e) };
  });

  const slots: TimeSlot[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    const timeStr = minutesToTime(t);
    const isBlocked = blockedRanges.some(r => t >= r.start && t < r.end);

    // Проверяем, есть ли уже слот в existingSlots
    const existing = existingSlots.find(s => s.date === dateStr && s.time === timeStr);
    if (existing) { slots.push(existing); continue; }

    slots.push({
      id: `${masterId}-${dateStr}-${timeStr}`,
      masterId,
      date: dateStr,
      time: timeStr,
      // TODO: статус будет приходить с сервера
      status: isBlocked ? 'blocked' : 'available',
    });
  }
  return slots;
}

/** Подсчитывает количество доступных слотов */
export function countAvailable(slots: TimeSlot[]): number {
  return slots.filter(s => s.status === 'available').length;
}

// TODO: заменить на реальные вызовы нового API
export const scheduleService = {
  getMasters: async (): Promise<Master[]> => {
    return Promise.resolve(MOCK_MASTERS);
  },
  getSettings: async (masterId: number): Promise<ScheduleSettings> => {
    return Promise.resolve(MOCK_SCHEDULE_SETTINGS[masterId] ?? { masterId, weekStart: '', workingHours: DEFAULT_WORKING_HOURS, timeSlotDuration: 60 });
  },
  saveSettings: async (settings: ScheduleSettings): Promise<void> => {
    // TODO: PUT /api/schedule/settings
    return Promise.resolve();
  },
  getSlots: async (masterId: number, weekStart: string): Promise<TimeSlot[]> => {
    // TODO: GET /api/schedule/slots?masterId=&weekStart=
    return Promise.resolve([]);
  },
  updateSlot: async (slot: TimeSlot): Promise<void> => {
    // TODO: PUT /api/schedule/slots/:id
    return Promise.resolve();
  },
};
