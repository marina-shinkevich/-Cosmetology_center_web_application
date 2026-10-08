// TODO: заменить на реальные данные из нового API
import { ClientFullData, DrugReference } from '../types/masterTypes';

export const MOCK_MASTER_ID = 1;

export const MOCK_CLIENTS: ClientFullData[] = [
  {
    user: { id: 1, firstName: 'Анна', lastName: 'Иванова', phone: '+375(33)-111-22-33', email: 'anna@example.com', role: 'client' },
    medicalCard: {
      clientId: 1, dateOfBirth: '1992-05-14', gender: 'female',
      allergies: 'Пенициллин, пыльца берёзы',
      chronicDiseases: 'Нет',
      medications: 'Витамин D, Омега-3',
      notes: 'Чувствительная кожа',
      createdAt: '2025-01-10T10:00:00', updatedAt: '2026-03-01T12:00:00',
    },
    recommendations: [
      { id: 1, clientId: 1, masterId: 1, category: 'after', priority: 'high', text: 'Избегать агрессивных пилингов в течение 2 недель после процедуры. Использовать SPF 50+.', createdAt: '2026-03-10T11:00:00', updatedAt: '2026-03-10T11:00:00' },
      { id: 2, clientId: 1, masterId: 1, category: 'contraindication', priority: 'high', text: 'Противопоказаны процедуры с пенициллиносодержащими препаратами.', createdAt: '2026-02-15T09:30:00', updatedAt: '2026-02-15T09:30:00' },
      { id: 3, clientId: 1, masterId: 1, category: 'general', priority: 'normal', text: 'Рекомендован курс увлажняющей мезотерапии 1 раз в 3 месяца.', createdAt: '2026-01-20T14:00:00', updatedAt: '2026-01-20T14:00:00' },
    ],
    prescribedDrugs: [
      { id: 1, clientId: 1, masterId: 1, drugId: 2, drugName: 'NCTF 135 HA', dosage: '2 мл', frequency: '1 раз в месяц', duration: '3 месяца', instructions: 'Вводить внутрикожно в область лица', status: 'active', prescribedAt: '2026-03-10T11:00:00' },
      { id: 2, clientId: 1, masterId: 1, drugId: 5, drugName: 'Juvederm Hydrate', dosage: '1 мл', frequency: '1 раз в 6 месяцев', duration: '6 месяцев', instructions: 'Инъекции в зону носогубных складок', status: 'completed', prescribedAt: '2025-09-01T10:00:00', completedAt: '2026-03-01T10:00:00' },
    ],
    procedures: [
      { id: 1, clientId: 1, masterId: 1, procedureName: 'Мезотерапия', date: '2026-03-10T11:00:00', duration: 45, drugsUsed: ['NCTF 135 HA', 'Juvederm Hydrate'], status: 'completed', notes: 'Прошло хорошо, кожа отреагировала положительно' },
      { id: 2, clientId: 1, masterId: 1, procedureName: 'Ультразвуковая чистка лица', date: '2026-02-15T10:00:00', duration: 60, drugsUsed: ['Энзимный пилинг'], status: 'completed' },
      { id: 3, clientId: 1, masterId: 1, procedureName: 'Биоревитализация', date: '2026-04-20T12:00:00', duration: 40, drugsUsed: [], status: 'scheduled' },
    ],
  },
  {
    user: { id: 2, firstName: 'Мария', lastName: 'Петрова', phone: '+375(29)-222-33-44', email: 'maria@example.com', role: 'client' },
    medicalCard: {
      clientId: 2, dateOfBirth: '1988-11-22', gender: 'female',
      allergies: 'Нет',
      chronicDiseases: 'Гипертония (контролируемая)',
      medications: 'Лозартан 50мг',
      createdAt: '2025-06-01T09:00:00', updatedAt: '2026-02-10T15:00:00',
    },
    recommendations: [
      { id: 4, clientId: 2, masterId: 1, category: 'before', priority: 'high', text: 'Перед процедурой измерить давление. При давлении выше 160/100 — процедуру отложить.', createdAt: '2026-02-10T15:00:00', updatedAt: '2026-02-10T15:00:00' },
    ],
    prescribedDrugs: [
      { id: 3, clientId: 2, masterId: 1, drugId: 3, drugName: 'Ботокс Allergan', dosage: '20 ед.', frequency: '1 раз в 4-6 месяцев', duration: '6 месяцев', instructions: 'Инъекции в область лба и межбровья', status: 'active', prescribedAt: '2026-02-10T15:00:00' },
    ],
    procedures: [
      { id: 4, clientId: 2, masterId: 1, procedureName: 'Ботулинотерапия', date: '2026-02-10T15:00:00', duration: 30, drugsUsed: ['Ботокс Allergan 20 ед.'], status: 'completed' },
      { id: 5, clientId: 2, masterId: 1, procedureName: 'Пилинг Джесснера', date: '2025-11-05T11:00:00', duration: 50, drugsUsed: ['Пилинг Джесснера 15%'], status: 'completed', notes: 'Умеренная реакция' },
    ],
  },
  {
    user: { id: 3, firstName: 'Елена', lastName: 'Козлова', phone: '+375(44)-333-44-55', email: 'elena@example.com', role: 'client' },
    medicalCard: {
      clientId: 3, dateOfBirth: '1995-03-08', gender: 'female',
      allergies: 'Нет',
      chronicDiseases: 'Нет',
      medications: 'Нет',
      createdAt: '2026-01-15T10:00:00', updatedAt: '2026-01-15T10:00:00',
    },
    recommendations: [],
    prescribedDrugs: [],
    procedures: [
      { id: 6, clientId: 3, masterId: 1, procedureName: 'Консультация', date: '2026-01-15T10:00:00', duration: 30, drugsUsed: [], status: 'completed', notes: 'Первичный осмотр. Рекомендована чистка лица.' },
    ],
  },
];

// TODO: заменить на реальные данные из нового API
export const MOCK_DRUG_REFERENCES: DrugReference[] = [
  { id: 1, name: 'Энзимный пилинг', category: 'Пилинги' },
  { id: 2, name: 'NCTF 135 HA', category: 'Мезококтейли' },
  { id: 3, name: 'Ботокс Allergan', category: 'Ботулотоксины' },
  { id: 4, name: 'Dysport', category: 'Ботулотоксины' },
  { id: 5, name: 'Juvederm Hydrate', category: 'Филлеры' },
  { id: 6, name: 'Juvederm Ultra', category: 'Филлеры' },
  { id: 7, name: 'Пилинг Джесснера 15%', category: 'Пилинги' },
  { id: 8, name: 'Meso-Wharton P199', category: 'Мезококтейли' },
  { id: 9, name: 'Увлажняющая сыворотка', category: 'Уход' },
  { id: 10, name: 'SPF 50+ крем', category: 'Уход' },
];
