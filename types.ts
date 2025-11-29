
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
  avatarUrl?: string; // Stores URL or Base64 string of photo
  points?: number; // Only for children (Stars/Chores)
  petPoints?: number; // Only for children (Energy/Games)
  balance?: number; // Only for children (CZK)
  password?: string; // Main Login Password (for Parents)
  pin?: string;      // Profile Lock PIN (for switching profiles)
  familyName?: string; // Name of the family group
  allowanceSettings?: AllowanceSettings;
  lastLoginRewardDate?: string; // YYYY-MM-DD of last daily login reward
  createdAt?: string; // ISO Date string of account creation
  towerHighScoreMath?: number;
  towerHighScoreEnglish?: number;
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

export interface CalendarEvent {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  dayIndex: number; // 0=Monday ... 6=Sunday
  time: string; // "14:30"
  color?: string;
}

export interface GameResult {
  id: string;
  familyId: string;
  childId: string;
  category: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  rewardAmount: number;
  date: string;
}

export interface AppNotification {
  id: string;
  familyId: string;
  recipientId: string;
  message: string;
  type: 'NEW_TASK' | 'APPROVAL_NEEDED' | 'MONEY_EARNED' | 'GAME_HIGHSCORE';
  isRead: boolean;
  createdAt: string;
}

// --- PETS ---
export enum PetType {
  DRAGON = 'DRAGON',
  UNICORN = 'UNICORN',
  DINO = 'DINO'
}

export enum PetStage {
  EGG = 1,
  BABY = 2,
  TEEN = 5,
  ADULT = 10,
  MYTHIC = 20,
  LEGEND = 30
}

export interface Pet {
  id: string;
  familyId: string;
  childId: string;
  name: string;
  type: PetType;
  stage: number; // Changed to number to support infinite levels, though we use Enum for milestones
  health: number; // 0-100
  happiness: number; // 0-100
  experience: number; // 0-100 (resets on evolution)
  lastInteraction: string; // ISO timestamp
}
