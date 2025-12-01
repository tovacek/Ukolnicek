import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Task, TaskStatus, UserRole, PayoutRecord, Goal, RecurringFrequency, AllowanceSettings, AppNotification, CalendarEvent, AppTheme } from '../types';
import { supabase } from '../services/supabaseClient';

interface AllowanceProgress {
  totalAmount: number;
  projectedAmount: number;
  earnedPoints: number;
  pointThreshold: number;
  daysLeft: number;
  nextDate: string;
}

interface AppContextType {
  familyId: string | null;
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  payoutHistory: PayoutRecord[];
  goals: Goal[];
  notifications: AppNotification[];
  calendarEvents: CalendarEvent[];
  currentTheme: AppTheme;
  
  // Auth Methods
  loginFamily: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  registerFamily: (email: string, password: string, familyName: string) => Promise<{success: boolean, error?: string}>;
  selectProfile: (userId: string) => void;
  logout: () => void;
  logoutFamily: () => void;

  // Data Methods
  refreshData: () => Promise<void>;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, proofImageUrl?: string, feedback?: string, rewards?: { points: number, money: number }) => void;
  editTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  getChildren: () => User[];
  getTasksForChild: (childId: string, date?: string) => Task[];
  addPointsToChild: (childId: string, points: number, money: number) => void;
  addChild: (name: string, birthYear?: number) => void;
  updateChild: (id: string, name: string, avatarUrl?: string, pin?: string, birthYear?: number) => void;
  deleteChild: (id: string) => void;
  processPayout: (childId: string, note?: string) => void;
  createWithdrawal: (childId: string, amount: number, note?: string) => Promise<boolean>;
  convertPointsToMoney: (childId: string, pointsToConvert: number) => void;
  updateFamilyProfile: (familyName: string, email: string, password?: string) => Promise<{success: boolean, error?: string}>;
  updateUserPin: (userId: string, pin: string) => Promise<{success: boolean, error?: string}>;
  setChildAllowance: (childId: string, settings?: AllowanceSettings) => void;
  getAllowanceProgress: (childId: string) => AllowanceProgress | null;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => Promise<void>;
  checkAndClaimDailyReward: (userId: string) => Promise<boolean>;
  markNotificationRead: (id: string) => void;
  
  // Theme
  setTheme: (theme: AppTheme) => void;

  // Calendar Methods
  addCalendarEvent: (event: CalendarEvent) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- THEME DEFINITIONS ---
// Values are RGB triplets (e.g. "255 0 0")
const THEMES: Record<AppTheme, { yellow: string; blue: string; green: string; red: string; dark: string }> = {
  DEFAULT: {
    yellow: '255 209 102', // #FFD166
    blue: '17 138 178',    // #118AB2
    green: '6 214 160',    // #06D6A0
    red: '239 71 111',     // #EF476F
    dark: '7 59 76',       // #073B4C
  },
  SPACE: {
    yellow: '255 215 0',   // Gold
    blue: '123 44 191',    // Deep Purple
    green: '76 201 240',   // Cyan (Neon)
    red: '247 37 133',     // Neon Pink
    dark: '16 0 43',       // Very Dark Purple
  },
  CANDY: {
    yellow: '255 183 178', // Pastel Peach/Pink
    blue: '162 225 219',   // Pastel Teal
    green: '226 240 203',  // Pastel Lime
    red: '255 154 162',    // Pastel Rose
    dark: '111 88 128',    // Muted Purple
  },
  FOREST: {
    yellow: '233 196 106', // Sand/Gold
    blue: '42 157 143',    // Teal Green
    green: '116 198 157',  // Soft Green
    red: '231 111 81',     // Burnt Orange
    dark: '38 70 83',      // Dark Slate
  }
};

// --- DB MAPPERS ---
const mapUserFromDb = (u: any): User => ({
  id: u.id,
  familyId: u.family_id,
  email: u.email,
  name: u.name,
  role: u.role as UserRole,
  avatarUrl: u.avatar_url,
  points: u.points,
  balance: u.balance,
  password: u.password,
  pin: u.pin || '', 
  familyName: u.family_name,
  allowanceSettings: u.allowance_settings,
  lastLoginRewardDate: u.last_login_reward_date,
  lastAllowanceDate: u.last_allowance_date,
  createdAt: u.created_at,
  birthYear: u.birth_year
});

const mapUserToDb = (u: User) => ({
  id: u.id,
  family_id: u.familyId,
  email: u.email,
  name: u.name,
  role: u.role,
  avatar_url: u.avatarUrl,
  points: u.points,
  balance: u.balance,
  password: u.password,
  pin: u.pin,
  family_name: u.familyName,
  allowance_settings: u.allowanceSettings,
  last_login_reward_date: u.lastLoginRewardDate,
  last_allowance_date: u.lastAllowanceDate,
  birth_year: u.birthYear
});

const mapTaskFromDb = (t: any): Task => ({
  id: t.id,
  familyId: t.family_id,
  title: t.title,
  description: t.description,
  rewardPoints: t.reward_points,
  rewardMoney: t.reward_money,
  assignedToId: t.assigned_to_id,
  date: t.date,
  status: t.status as TaskStatus,
  proofImageUrl: t.proof_image_url,
  feedback: t.feedback,
  createdBy: t.created_by as UserRole,
  isRecurring: t.is_recurring,
  recurringFrequency: t.recurring_frequency,
  penalty: t.penalty !== undefined ? t.penalty : 5
});

const mapTaskToDb = (t: Task) => ({
  id: t.id,
  family_id: t.familyId,
  title: t.title,
  description: t.description,
  reward_points: t.rewardPoints,
  reward_money: t.rewardMoney,
  assigned_to_id: t.assignedToId,
  date: t.date,
  status: t.status,
  proof_image_url: t.proofImageUrl,
  feedback: t.feedback,
  created_by: t.createdBy,
  is_recurring: t.isRecurring,
  recurring_frequency: t.recurringFrequency,
  penalty: t.penalty
});

const mapPayoutFromDb = (p: any): PayoutRecord => ({
  id: p.id,
  familyId: p.family_id,
  childId: p.child_id,
  amount: p.amount,
  date: p.date,
  note: p.note,
  type: p.type || 'PARENT' // Default to parent for old records
});

const mapPayoutToDb = (p: PayoutRecord) => ({
  id: p.id,
  family_id: p.familyId,
  child_id: p.childId,
  amount: p.amount,
  date: p.date,
  note: p.note,
  type: p.type
});

const mapGoalFromDb = (g: any): Goal => ({
  id: g.id,
  familyId: g.family_id,
  childId: g.child_id,
  title: g.title,
  targetAmount: g.target_amount,
  imageUrl: g.image_url
});

const mapCalendarEventFromDb = (e: any): CalendarEvent => ({
    id: e.id,
    familyId: e.family_id,
    childId: e.child_id,
    title: e.title,
    dayIndex: e.day_index,
    time: e.time,
    color: e.color,
    isRecurring: e.is_recurring !== false, // Default true for backward compatibility
    specificDate: e.specific_date
});

const mapNotificationFromDb = (n: any): AppNotification => ({
    id: n.id,
    familyId: n.family_id,
    recipientId: n.recipient_id,
    message: n.message,
    type: n.type,
    isRead: n.is_read,
    createdAt: n.created_at
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth State
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Theme State
  const [currentTheme, setCurrentThemeState] = useState<AppTheme>('DEFAULT');

  // --- THEME LOGIC ---
  const applyTheme = (theme: AppTheme) => {
      const colors = THEMES[theme];
      const root = document.documentElement;
      
      root.style.setProperty('--brand-yellow', colors.yellow);
      root.style.setProperty('--brand-blue', colors.blue);
      root.style.setProperty('--brand-green', colors.green);
      root.style.setProperty('--brand-red', colors.red);
      root.style.setProperty('--brand-dark', colors.dark);
  };

  const setTheme = (theme: AppTheme) => {
      setCurrentThemeState(theme);
      applyTheme(theme);
      localStorage.setItem('ukolnicek_theme', theme);
  };

  useEffect(() => {
      // Load theme from storage
      const storedTheme = localStorage.getItem('ukolnicek_theme') as AppTheme;
      if (storedTheme && THEMES[storedTheme]) {
          setTheme(storedTheme);
      } else {
          applyTheme('DEFAULT');
      }
  }, []);

  // --- PERSISTENCE: Restore Session on Mount ---
  useEffect(() => {
      // Family ID persists forever (until logout) -> localStorage
      const storedFamilyId = localStorage.getItem('ukolnicek_family_id');
      if (storedFamilyId) {
          setFamilyId(storedFamilyId);
      }
  }, []);

  // Restore Current User once Users are loaded
  useEffect(() => {
      // User ID persists only for the SESSION (until tab close) -> sessionStorage
      const storedUserId = sessionStorage.getItem('ukolnicek_user_id');
      if (storedUserId && users.length > 0 && !currentUser) {
          const user = users.find(u => u.id === storedUserId);
          if (user) setCurrentUser(user);
      }
  }, [users]);

  // --- AUTOMATIC ALLOWANCE LOGIC ---
  const processAutomaticAllowances = async (usersData: User[], tasksData: Task[]) => {
      let updatedUsers = [...usersData];
      let hasChanges = false;

      for (const user of updatedUsers) {
          if (user.role === UserRole.CHILD && user.allowanceSettings) {
              const { amount, frequency, day, pointThreshold } = user.allowanceSettings;
              const now = new Date();
              const todayStr = now.toISOString().split('T')[0];
              
              // Determine if payment is due today or past due
              let isDue = false;
              let periodStart = new Date();

              if (frequency === 'MONTHLY') {
                  // If today is the set day or later in current month
                  if (now.getDate() >= day) {
                      // Check if already paid this month
                      const lastPaid = user.lastAllowanceDate ? new Date(user.lastAllowanceDate) : new Date(0);
                      // If last payment was in a previous month (or never)
                      if (lastPaid.getMonth() !== now.getMonth() || lastPaid.getFullYear() !== now.getFullYear()) {
                          isDue = true;
                          periodStart = new Date(now.getFullYear(), now.getMonth() - 1, day);
                      }
                  }
              } else if (frequency === 'WEEKLY') {
                  // Convert 1-7 (Mon-Sun) to JS 0-6 (Sun-Sat) logic or just check day index
                  const currentDayIndex = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
                  
                  if (currentDayIndex >= day) {
                      // Check if paid this week (Monday based week)
                      const lastPaid = user.lastAllowanceDate ? new Date(user.lastAllowanceDate) : new Date(0);
                      
                      // Calculate start of current week
                      const startOfWeek = new Date(now);
                      startOfWeek.setDate(now.getDate() - currentDayIndex + 1);
                      startOfWeek.setHours(0,0,0,0);

                      if (lastPaid < startOfWeek) {
                          isDue = true;
                          periodStart = new Date(now);
                          periodStart.setDate(periodStart.getDate() - 7);
                      }
                  }
              }

              if (isDue) {
                  // Calculate Amount
                  const periodStartStr = periodStart.toISOString().split('T')[0];
                  const earnedPoints = tasksData
                      .filter(t => 
                          t.assignedToId === user.id && 
                          t.status === TaskStatus.APPROVED && 
                          t.date >= periodStartStr
                      )
                      .reduce((sum, t) => sum + t.rewardPoints, 0);

                  const percentage = pointThreshold > 0 ? Math.min(1, earnedPoints / pointThreshold) : 1;
                  const payAmount = Math.floor(amount * percentage);

                  if (payAmount > 0) {
                      // UPDATE USER
                      const newBalance = (user.balance || 0) + payAmount;
                      
                      // Update Local State
                      user.balance = newBalance;
                      user.lastAllowanceDate = todayStr;
                      hasChanges = true;

                      // DB Updates
                      await supabase.from('users').update({ 
                          balance: newBalance,
                          last_allowance_date: todayStr 
                      }).eq('id', user.id);

                      // Create Notification
                      const notifId = Math.random().toString(36).substr(2, 9);
                      const notification: AppNotification = {
                          id: notifId,
                          familyId: user.familyId,
                          recipientId: user.id,
                          message: `Cink! Přišlo kapesné ${payAmount} Kč! 💰`,
                          type: 'ALLOWANCE_PAID',
                          isRead: false,
                          createdAt: new Date().toISOString()
                      };
                      setNotifications(prev => [notification, ...prev]);
                      await supabase.from('notifications').insert({
                          id: notifId,
                          family_id: user.familyId,
                          recipient_id: user.id,
                          message: notification.message,
                          type: notification.type,
                          is_read: false
                      });
                  }
              }
          }
      }

      if (hasChanges) {
          setUsers(updatedUsers);
          if (currentUser) {
              const updatedCurrent = updatedUsers.find(u => u.id === currentUser.id);
              if (updatedCurrent) setCurrentUser(updatedCurrent);
          }
      }
  };

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!familyId) {
        setUsers([]);
        setTasks([]);
        setPayoutHistory([]);
        setGoals([]);
        setCalendarEvents([]);
        return;
    }

    try {
      const { data: usersData } = await supabase.from('users').select('*').eq('family_id', familyId);
      let mappedUsers: User[] = [];
      if (usersData) {
          mappedUsers = usersData.map(mapUserFromDb);
          setUsers(mappedUsers);
          if (currentUser) {
              const updatedCurrent = mappedUsers.find(u => u.id === currentUser.id);
              if (updatedCurrent) setCurrentUser(updatedCurrent);
          }
      }

      const { data: tasksData } = await supabase.from('tasks').select('*').eq('family_id', familyId);
      const mappedTasks = tasksData ? tasksData.map(mapTaskFromDb) : [];
      setTasks(mappedTasks);

      const { data: payoutsData } = await supabase.from('payout_history').select('*').eq('family_id', familyId).order('date', { ascending: false });
      if (payoutsData) setPayoutHistory(payoutsData.map(mapPayoutFromDb));

      const { data: goalsData } = await supabase.from('goals').select('*').eq('family_id', familyId);
      if (goalsData) setGoals(goalsData.map(mapGoalFromDb));

      const { data: eventsData } = await supabase.from('calendar_events').select('*').eq('family_id', familyId);
      if (eventsData) setCalendarEvents(eventsData.map(mapCalendarEventFromDb));
      
      const { data: notifData } = await supabase.from('notifications').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
      if (notifData) setNotifications(notifData.map(mapNotificationFromDb));

      // Check for Allowances after loading data
      if (mappedUsers.length > 0) {
          await processAutomaticAllowances(mappedUsers, mappedTasks);
      }

    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }, [familyId, currentUser?.id]);

  // Fetch on mount/login
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- AUTH METHODS ---

  const loginFamily = async (email: string, password: string) => {
      try {
          const { data, error } = await supabase
            .from('users')
            .select('family_id')
            .eq('email', email)
            .eq('password', password)
            .eq('role', UserRole.PARENT)
            .maybeSingle();

          if (data && !error) {
              setFamilyId(data.family_id);
              localStorage.setItem('ukolnicek_family_id', data.family_id);
              return { success: true };
          } else {
              return { success: false, error: 'Nesprávný email nebo heslo.' };
          }
      } catch (e) {
          return { success: false, error: 'Chyba připojení' };
      }
  };

  const registerFamily = async (email: string, password: string, familyName: string) => {
    try {
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        if (existing) return { success: false, error: 'Email již existuje.' };

        const familyId = Math.random().toString(36).substr(2, 9);
        const parentId = Math.random().toString(36).substr(2, 9);

        const newParent: User = {
            id: parentId,
            familyId,
            email,
            name: 'Rodič', 
            role: UserRole.PARENT,
            password, 
            pin: '',
            familyName,
            avatarUrl: ''
        };

        const { error } = await supabase.from('users').insert(mapUserToDb(newParent));
        
        if (!error) {
            return { success: true };
        } else {
            return { success: false, error: error.message || 'Registrace se nezdařila' };
        }
    } catch (e) {
        return { success: false, error: 'Chyba připojení' };
    }
  };

  const selectProfile = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
        setCurrentUser(user);
        // Use sessionStorage so it clears when window/tab is closed
        sessionStorage.setItem('ukolnicek_user_id', userId);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('ukolnicek_user_id');
  };

  const logoutFamily = () => {
      setCurrentUser(null);
      setFamilyId(null);
      localStorage.removeItem('ukolnicek_family_id');
      sessionStorage.removeItem('ukolnicek_user_id');
  };

  const refreshData = async () => {
      await fetchData();
  };

  const addTask = async (task: Task) => {
    const taskWithFamily = { ...task, familyId: familyId! };
    setTasks(prev => [...prev, taskWithFamily]);
    await supabase.from('tasks').insert(mapTaskToDb(taskWithFamily));
    fetchData(); 
  };

  const editTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.rewardPoints !== undefined) dbUpdates.reward_points = updates.rewardPoints;
    if (updates.rewardMoney !== undefined) dbUpdates.reward_money = updates.rewardMoney;
    if (updates.assignedToId !== undefined) dbUpdates.assigned_to_id = updates.assignedToId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
    if (updates.recurringFrequency !== undefined) dbUpdates.recurring_frequency = updates.recurringFrequency;
    if (updates.penalty !== undefined) dbUpdates.penalty = updates.penalty;

    await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const calculateNextDate = (currentDate: string, frequency?: RecurringFrequency): string => {
      const date = new Date(currentDate);
      if (frequency === 'WEEKLY') {
          date.setDate(date.getDate() + 7);
      } else {
          date.setDate(date.getDate() + 1);
      }
      return date.toISOString().split('T')[0];
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus, proofImageUrl?: string, feedback?: string, rewards?: { points: number, money: number }) => {
    const localTask = tasks.find(t => t.id === taskId);
    
    const updates: Partial<Task> = {
        status,
        ...(proofImageUrl && { proofImageUrl }),
        ...(feedback && { feedback }),
        ...(rewards && { rewardPoints: rewards.points, rewardMoney: rewards.money })
    };

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));

    const dbUpdates: any = { status };
    if (proofImageUrl) dbUpdates.proof_image_url = proofImageUrl;
    if (feedback) dbUpdates.feedback = feedback;
    if (rewards) {
        dbUpdates.reward_points = rewards.points;
        dbUpdates.reward_money = rewards.money;
    }

    await supabase.from('tasks').update(dbUpdates).eq('id', taskId);

    // Recurring logic
    if (status === TaskStatus.APPROVED && localTask && localTask.isRecurring) {
        const nextDate = calculateNextDate(localTask.date, localTask.recurringFrequency);
        const nextTask: Task = {
            ...localTask,
            id: Math.random().toString(36).substr(2, 9),
            familyId: familyId!,
            date: nextDate,
            status: TaskStatus.TODO,
            proofImageUrl: undefined,
            feedback: undefined,
        };
        setTasks(prev => [...prev, nextTask]);
        await supabase.from('tasks').insert(mapTaskToDb(nextTask));
        fetchData();
    }
  };

  const getChildren = () => {
    return users.filter(u => u.role === UserRole.CHILD);
  };

  const getTasksForChild = (childId: string, date?: string) => {
    return tasks.filter(t => {
        const belongsToChild = t.assignedToId === childId;
        const matchesDate = date ? t.date === date : true;
        return belongsToChild && matchesDate;
    });
  };

  const addPointsToChild = async (childId: string, points: number, money: number) => {
    const user = users.find(u => u.id === childId);
    if (!user) return;
    
    const newPoints = (user.points || 0) + points;
    const newBalance = (user.balance || 0) + money;
    const updates = { points: newPoints, balance: newBalance };
    
    setUsers(prev => prev.map(u => u.id === childId ? { ...u, ...updates } : u));
    if (currentUser?.id === childId) setCurrentUser({ ...currentUser, ...updates });

    await supabase.from('users').update(updates).eq('id', childId);
  };

  const addChild = async (name: string, birthYear?: number) => {
    const newChild: User = {
      id: Math.random().toString(36).substr(2, 9),
      familyId: familyId!,
      name,
      role: UserRole.CHILD,
      avatarUrl: '',
      points: 0,
      balance: 0,
      pin: '',
      birthYear
    };
    setUsers(prev => [...prev, newChild]);
    await supabase.from('users').insert(mapUserToDb(newChild));
    fetchData();
  };

  const updateChild = async (id: string, name: string, avatarUrl?: string, pin?: string, birthYear?: number) => {
    const updates: any = { 
        name, 
        avatarUrl: avatarUrl || '',
        ...(pin !== undefined && { pin }),
        ...(birthYear !== undefined && { birthYear })
    };

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    
    const dbUpdates: any = { name, avatar_url: updates.avatarUrl };
    if (pin !== undefined) dbUpdates.pin = pin;
    if (birthYear !== undefined) dbUpdates.birth_year = birthYear;

    const { error } = await supabase.from('users').update(dbUpdates).eq('id', id);
    if (error) console.error("Update Child Error:", error);

    if (currentUser?.id === id) {
        setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteChild = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    await supabase.from('users').delete().eq('id', id);
  };

  const processPayout = async (childId: string, note?: string) => {
    const child = users.find(u => u.id === childId);
    if (!child || !child.balance || child.balance <= 0) return;

    const record: PayoutRecord = {
      id: Math.random().toString(36).substr(2, 9),
      familyId: familyId!,
      childId,
      amount: child.balance,
      date: new Date().toISOString(),
      note,
      type: 'PARENT'
    };

    setPayoutHistory(prev => [record, ...prev]);
    const updatedUser = { ...child, balance: 0 };
    setUsers(prev => prev.map(u => u.id === childId ? updatedUser : u));
    if (currentUser?.id === childId) setCurrentUser(updatedUser);

    await supabase.from('payout_history').insert(mapPayoutToDb(record));

    await supabase.from('users').update({ balance: 0 }).eq('id', childId);
    fetchData();
  };

  const createWithdrawal = async (childId: string, amount: number, note?: string): Promise<boolean> => {
      const child = users.find(u => u.id === childId);
      if (!child || !child.balance || child.balance < amount || amount <= 0) return false;

      const newBalance = child.balance - amount;
      
      const record: PayoutRecord = {
          id: Math.random().toString(36).substr(2, 9),
          familyId: familyId!,
          childId,
          amount: amount,
          date: new Date().toISOString(),
          note: note,
          type: 'CHILD'
      };

      // Update State
      setPayoutHistory(prev => [record, ...prev]);
      const updatedUser = { ...child, balance: newBalance };
      setUsers(prev => prev.map(u => u.id === childId ? updatedUser : u));
      if (currentUser?.id === childId) setCurrentUser(updatedUser);

      // Update DB
      await supabase.from('payout_history').insert(mapPayoutToDb(record));

      await supabase.from('users').update({ balance: newBalance }).eq('id', childId);
      return true;
  };

  const convertPointsToMoney = async (childId: string, pointsToConvert: number) => {
    if (pointsToConvert <= 0) return;
    const user = users.find(u => u.id === childId);
    if (!user || (user.points || 0) < pointsToConvert) return;

    const moneyToAdd = Math.floor(pointsToConvert / 10);
    const newPoints = (user.points || 0) - pointsToConvert;
    const newBalance = (user.balance || 0) + moneyToAdd;
    
    // 1. Update User State & DB
    const updates = { points: newPoints, balance: newBalance };

    setUsers(prev => prev.map(u => u.id === childId ? { ...u, ...updates } : u));
    if (currentUser?.id === childId) setCurrentUser({ ...currentUser, ...updates });

    await supabase.from('users').update(updates).eq('id', childId);

    // 2. Create History Record (as a Task)
    const exchangeTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        familyId: familyId!,
        title: 'Směna bodů',
        description: `Výměna ${pointsToConvert} bodů za ${moneyToAdd} Kč`,
        rewardPoints: -pointsToConvert, // Negative to show cost in history
        rewardMoney: moneyToAdd,
        assignedToId: childId,
        date: new Date().toISOString().split('T')[0],
        status: TaskStatus.APPROVED, // Automatically approved
        createdBy: UserRole.CHILD
    };

    setTasks(prev => [...prev, exchangeTask]);
    await supabase.from('tasks').insert(mapTaskToDb(exchangeTask));
  };

  const updateUserPin = async (userId: string, pin: string) => {
    try {
        const { error } = await supabase.from('users').update({ pin }).eq('id', userId);
        
        if (error) {
            console.error("Supabase error updating PIN:", error);
            return { success: false, error: error.message || 'Chyba databáze' };
        }

        setUsers(prev => prev.map(u => u.id === userId ? { ...u, pin } : u));
        if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, pin } : null);
        }
        
        return { success: true };
    } catch (e) {
        console.error("Exception updating PIN:", e);
        return { success: false, error: 'Neočekávaná chyba' };
    }
  };

  const updateFamilyProfile = async (familyName: string, email: string, password?: string) => {
      try {
          if (!currentUser) return { success: false, error: 'Nejste přihlášen' };
          
          const dbUpdates: any = { family_name: familyName };
          if (currentUser.role === UserRole.PARENT) {
              dbUpdates.email = email;
              if (password) dbUpdates.password = password;
          }
          
          const { error } = await supabase.from('users').update(dbUpdates).eq('id', currentUser.id);

          if (error) {
              console.error("Supabase error updating family profile:", error);
              return { success: false, error: error.message };
          }

          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, name: currentUser.name, familyName, email, ...(password && {password}) } : { ...u, familyName }));
          await fetchData();

          return { success: true };
      } catch (e) {
          return { success: false, error: 'Chyba při ukládání.' };
      }
  };

  const setChildAllowance = async (childId: string, settings?: AllowanceSettings) => {
    setUsers(prev => prev.map(u => u.id === childId ? { ...u, allowanceSettings: settings } : u));
    await supabase.from('users').update({ allowance_settings: settings }).eq('id', childId);
  };

  const getAllowanceProgress = (childId: string): AllowanceProgress | null => {
    const user = users.find(u => u.id === childId);
    if (!user || !user.allowanceSettings) return null;

    const { amount, frequency, day, pointThreshold } = user.allowanceSettings;
    
    const now = new Date();
    let nextPaymentDate = new Date();
    let periodStartDate = new Date();

    if (frequency === 'MONTHLY') {
        nextPaymentDate.setDate(day);
        if (nextPaymentDate <= now) {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }
        periodStartDate = new Date(nextPaymentDate);
        periodStartDate.setMonth(periodStartDate.getMonth() - 1);
    } else {
        const currentDay = now.getDay() || 7; 
        let daysUntil = day - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        
        nextPaymentDate.setDate(now.getDate() + daysUntil);
        periodStartDate = new Date(nextPaymentDate);
        periodStartDate.setDate(periodStartDate.getDate() - 7);
    }

    const periodStartStr = periodStartDate.toISOString().split('T')[0];
    
    const earnedPoints = tasks
        .filter(t => 
            t.assignedToId === childId && 
            t.status === TaskStatus.APPROVED && 
            t.date >= periodStartStr
        )
        .reduce((sum, t) => sum + t.rewardPoints, 0);

    const percentage = pointThreshold > 0 ? Math.min(1, earnedPoints / pointThreshold) : 1;
    const projectedAmount = Math.floor(amount * percentage);
    const daysLeft = Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    return {
        totalAmount: amount,
        projectedAmount,
        earnedPoints,
        pointThreshold,
        daysLeft,
        nextDate: nextPaymentDate.toLocaleDateString('cs-CZ')
    };
  };

  const addGoal = async (goal: Goal) => {
    const goalWithFamily = { ...goal, familyId: familyId! };
    setGoals(prev => [...prev, goalWithFamily]);
    
    await supabase.from('goals').insert({
        id: goalWithFamily.id,
        family_id: goalWithFamily.familyId,
        child_id: goalWithFamily.childId,
        title: goalWithFamily.title,
        target_amount: goalWithFamily.targetAmount,
        image_url: goalWithFamily.imageUrl
    });
    fetchData();
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.targetAmount) dbUpdates.target_amount = updates.targetAmount;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

    await supabase.from('goals').update(dbUpdates).eq('id', id);
  };

  const deleteGoal = async (id: string) => {
    try {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) {
            console.error("Error deleting goal from DB:", error);
            alert("Chyba při mazání: " + error.message);
            return;
        }
        setGoals(prev => prev.filter(g => g.id !== id));
    } catch (e) {
        console.error("Exception deleting goal:", e);
    }
  };

  const checkAndClaimDailyReward = async (userId: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    if (user.lastLoginRewardDate === todayStr) {
        return false;
    }

    const rewardPoints = 10;
    const newPoints = (user.points || 0) + rewardPoints;
    const updates = { points: newPoints, lastLoginRewardDate: todayStr };

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }

    await supabase.from('users').update({ 
        points: newPoints, 
        last_login_reward_date: todayStr 
    }).eq('id', userId);

    return true;
  };
  
  const markNotificationRead = (id: string) => {
      // Placeholder
  };
  
  // --- CALENDAR LOGIC ---

  const addCalendarEvent = async (event: CalendarEvent) => {
      if (!familyId) return;
      setCalendarEvents(prev => [...prev, event]);
      
      await supabase.from('calendar_events').insert({
          id: event.id,
          family_id: familyId,
          child_id: event.childId,
          title: event.title,
          day_index: event.dayIndex,
          time: event.time,
          color: event.color,
          is_recurring: event.isRecurring,
          specific_date: event.specificDate
      });
  };

  const deleteCalendarEvent = async (eventId: string) => {
      setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
      await supabase.from('calendar_events').delete().eq('id', eventId);
  };

  return (
    <AppContext.Provider value={{
      familyId,
      currentUser,
      users,
      tasks,
      payoutHistory,
      goals,
      notifications,
      calendarEvents,
      currentTheme,
      loginFamily,
      registerFamily,
      selectProfile,
      logout,
      logoutFamily,
      refreshData,
      addTask,
      updateTaskStatus,
      editTask,
      deleteTask,
      getChildren,
      getTasksForChild,
      addPointsToChild,
      addChild,
      updateChild,
      deleteChild,
      processPayout,
      createWithdrawal,
      convertPointsToMoney,
      updateFamilyProfile,
      updateUserPin,
      setChildAllowance,
      getAllowanceProgress,
      addGoal,
      updateGoal,
      deleteGoal,
      checkAndClaimDailyReward,
      markNotificationRead,
      addCalendarEvent,
      deleteCalendarEvent,
      setTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};