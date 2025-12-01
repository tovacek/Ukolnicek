
export enum UserRole {
  PARENT = 'PARENT',
  CHILD = 'CHILD'
}

export type AppTheme = 'DEFAULT' | 'SPACE' | 'CANDY' | 'FOREST';

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
  avatarUrl?: string; // Stores URL or Base64 string of photo
  points?: number; // Only for children (Stars/Chores)
  balance?: number; // Only for children (CZK)
  password?: string; // Main Login Password (for Parents)
  pin?: string;      // Profile Lock PIN (for switching profiles)
  familyName?: string; // Name of the family group
  allowanceSettings?: AllowanceSettings;
  lastLoginRewardDate?: string; // YYYY-MM-DD of last daily login reward
  lastAllowanceDate?: string; // YYYY-MM-DD of last automatic allowance payment
  createdAt?: string; // ISO Date string of account creation
  birthYear?: number;
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
  penalty?: number; // Points to subtract if completed after due date (default 5)
}

export interface RewardHistory {
  id: string;
  taskId: string;
  childId: string;
  points: number;
  money: number;
  date: string;
}

export type PayoutType = 'PARENT' | 'CHILD';

export interface PayoutRecord {
  id: string;
  familyId: string;
  childId: string;
  amount: number;
  date: string; // ISO Date string
  note?: string; // Reason for withdrawal
  type?: PayoutType; // Who initiated the transaction
}

export interface Goal {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  targetAmount: number;
  imageUrl?: string;
}

export interface CalendarEvent {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  dayIndex: number; // 1=Monday ... 7=Sunday
  time: string; // "14:30"
  color?: string;
  isRecurring?: boolean; // New: True if weekly, False if one-time
  specificDate?: string; // New: YYYY-MM-DD for one-time events
}

export interface AppNotification {
  id: string;
  familyId: string;
  recipientId: string;
  message: string;
  type: 'NEW_TASK' | 'APPROVAL_NEEDED' | 'MONEY_EARNED' | 'ALLOWANCE_PAID';
  isRead: boolean;
  createdAt: string;
}