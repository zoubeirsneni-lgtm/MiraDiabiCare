export type DiabetesType = 'type1' | 'type2' | 'gestational';

export interface Medication {
  id: string;
  userId: string;
  name: string;
  type: 'insulin-fast' | 'insulin-slow' | 'pill' | 'other';
  dosage: string;
  stock: number;
  minStock: number;
  createdAt?: any;
}

export interface UserProfile {
  name: string;
  diabetesType: DiabetesType;
  age?: number;
  weight?: number;
  targetMin: number;
  targetMax: number;
  insulinToCarbRatio?: number;
  insulinSensitivityFactor?: number;
  isAdmin?: boolean;
  dailyCarbGoal?: number;
  dailyStepGoal?: number;
}

export type LogType = 'glucose' | 'medication' | 'activity' | 'food' | 'weight';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
export type MealTiming = 'before' | 'after' | 'none';

export interface HealthLog {
  id: string;
  userId: string;
  type: LogType;
  value: number;
  timestamp: any; // Firestore Timestamp
  notes?: string;
  mealType?: MealType;
  timing?: MealTiming;
  medicationName?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
