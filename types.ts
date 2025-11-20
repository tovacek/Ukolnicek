
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
  name: string;
  role: UserRole;
  avatarUrl?: string;
  points?: number; // Only for children
  balance?: number; // Only for children (CZK)
  password?: string; // Optional password for login protection
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
  childId: string;
  amount: number;
  date: string; // ISO Date string
}

export interface Goal {
  id: string;
  childId: string;
  title: string;
  targetAmount: number;
  imageUrl?: string;
}