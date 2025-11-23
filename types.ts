
export enum UserRole {
  PARENT = 'PARENT',
  CHILD = 'CHILD'
}

export interface AllowanceSettings {
  amount: number;
  frequency: 'WEEKLY' | 'MONTHLY';
  day: number; // 1-7 for weekly (1=Monday), 1-31 for monthly
  pointThreshold: number; // Points needed to get full allowance
}

export interface User {
  id: string;
  familyId: string; // Links user to a specific family group
  email?: string;   // Only for Parent/Admin account login
  name: string;
  role: UserRole;
  avatarUrl?: string;
  points?: number; // Only for children
  balance?: number; // Only for children (CZK)
  password?: string; // Main Login Password (for Parents)
  pin?: string;      // Profile Lock PIN (for switching profiles)
  familyName?: string; // Name of the family group
  allowanceSettings?: AllowanceSettings;
}

export enum TaskStatus {
  TODO = 'TODO',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY';

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description: string;
  rewardPoints: number;
  rewardMoney: number;
  assignedToId: string; // Child ID
  date: string; // ISO Date string YYYY-MM-DD
  status: TaskStatus;
  proofImageUrl?: string;
  feedback?: string;
  createdBy?: UserRole; // To distinguish between Parent assigned and Child initiated
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
}

export interface RewardHistory {
  id: string;
  taskId: string;
  childId: string;
  points: number;
  money: number;
  date: string;
}

export interface PayoutRecord {
  id: string;
  familyId: string;
  childId: string;
  amount: number;
  date: string; // ISO Date string
}

export interface Goal {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  targetAmount: number;
  imageUrl?: string;
}
