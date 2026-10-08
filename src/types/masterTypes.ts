// ===== ТИПЫ ДЛЯ СТРАНИЦЫ МАСТЕРА =====

export type UserRole = 'client' | 'master' | 'admin';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: UserRole;
}

export interface MedicalCard {
  clientId: number;
  dateOfBirth: string;
  gender: 'male' | 'female';
  allergies: string;
  chronicDiseases: string;
  medications: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecommendationCategory = 'before' | 'after' | 'general' | 'contraindication';
export type RecommendationPriority = 'high' | 'normal' | 'low';

export interface MasterRecommendation {
  id: number;
  clientId: number;
  masterId: number;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  text: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescribedDrug {
  id: number;
  clientId: number;
  masterId: number;
  drugId: number;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'cancelled';
  prescribedAt: string;
  completedAt?: string;
}

export interface Procedure {
  id: number;
  clientId: number;
  masterId: number;
  procedureName: string;
  date: string;
  duration: number;
  drugsUsed: string[];
  status: 'completed' | 'cancelled' | 'scheduled';
  notes?: string;
}

export interface ClientFullData {
  user: User;
  medicalCard: MedicalCard;
  recommendations: MasterRecommendation[];
  prescribedDrugs: PrescribedDrug[];
  procedures: Procedure[];
}

// ===== СПРАВОЧНИК ПРЕПАРАТОВ =====
export interface DrugReference {
  id: number;
  name: string;
  category: string;
}

// ===== МЕТКИ =====
export const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  before: 'До процедуры',
  after: 'После процедуры',
  general: 'Общие рекомендации',
  contraindication: 'Противопоказания',
};

export const PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  high: 'Важно',
  normal: 'Обычное',
  low: 'Информация',
};
