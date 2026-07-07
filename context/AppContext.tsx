import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Task, TaskStatus, UserRole, PayoutRecord, Goal, RecurringFrequency, AllowanceSettings, AppNotification, CalendarEvent, AppTheme } from '../types';

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
      const storedFamilyId = localStorage.getItem('ukolnicek_family_id');
      if (storedFamilyId) {
          setFamilyId(storedFamilyId);
      }
  }, []);

  // Restore Current User once Users are loaded
  useEffect(() => {
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
              
              let isDue = false;
              let periodStart = new Date();

              if (frequency === 'MONTHLY') {
                  if (now.getDate() >= day) {
                      const lastPaid = user.lastAllowanceDate ? new Date(user.lastAllowanceDate) : new Date(0);
                      if (lastPaid.getMonth() !== now.getMonth() || lastPaid.getFullYear() !== now.getFullYear()) {
                          isDue = true;
                          periodStart = new Date(now.getFullYear(), now.getMonth() - 1, day);
                      }
                  }
              } else if (frequency === 'WEEKLY') {
                  const currentDayIndex = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
                  
                  if (currentDayIndex >= day) {
                      const lastPaid = user.lastAllowanceDate ? new Date(user.lastAllowanceDate) : new Date(0);
                      
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
                      const newBalance = (user.balance || 0) + payAmount;
                      
                      user.balance = newBalance;
                      user.lastAllowanceDate = todayStr;
                      hasChanges = true;

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

                      // Sync with Backend (combines balance, date, and notification)
                      try {
                          await fetch(`/api/users/${user.id}/allowance-pay`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                  balance: newBalance,
                                  lastAllowanceDate: todayStr,
                                  notification: {
                                      id: notifId,
                                      familyId: user.familyId,
                                      recipientId: user.id,
                                      message: notification.message,
                                      type: notification.type,
                                      isRead: false
                                  }
                              })
                          });
                      } catch (err) {
                          console.error('Failed to sync automatic allowance payment:', err);
                      }
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

  // --- FETCH DATA FROM BACKEND ---
  const fetchData = useCallback(async () => {
    if (!familyId) {
        setUsers([]);
        setTasks([]);
        setPayoutHistory([]);
        setGoals([]);
        setCalendarEvents([]);
        setNotifications([]);
        return;
    }

    try {
      const res = await fetch(`/api/data?familyId=${familyId}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      
      setUsers(data.users || []);
      if (currentUser) {
          const updatedCurrent = (data.users || []).find((u: any) => u.id === currentUser.id);
          if (updatedCurrent) setCurrentUser(updatedCurrent);
      }
      setTasks(data.tasks || []);
      setPayoutHistory(data.payoutHistory || []);
      setGoals(data.goals || []);
      setCalendarEvents(data.calendarEvents || []);
      setNotifications(data.notifications || []);

      // Check for automatic allowances
      if (data.users && data.users.length > 0) {
          await processAutomaticAllowances(data.users, data.tasks || []);
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
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (data.success && data.familyId) {
              setFamilyId(data.familyId);
              localStorage.setItem('ukolnicek_family_id', data.familyId);
              return { success: true };
          } else {
              return { success: false, error: data.error || 'Nesprávný email nebo heslo.' };
          }
      } catch (e) {
          return { success: false, error: 'Chyba připojení' };
      }
  };

  const registerFamily = async (email: string, password: string, familyName: string) => {
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, familyName })
        });
        const data = await res.json();
        return data;
    } catch (e) {
        return { success: false, error: 'Chyba připojení' };
    }
  };

  const selectProfile = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
        setCurrentUser(user);
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

  // --- DATA MUTATION METHODS ---

  const addTask = async (task: Task) => {
    const taskWithFamily = { ...task, familyId: familyId! };
    setTasks(prev => [...prev, taskWithFamily]);
    try {
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskWithFamily)
        });
        fetchData();
    } catch (e) {
        console.error('Error adding task:', e);
    }
  };

  const editTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    try {
        await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    } catch (e) {
        console.error('Error editing task:', e);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
        await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error('Error deleting task:', e);
    }
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

    try {
        await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

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
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nextTask)
            });
            fetchData();
        }
    } catch (e) {
        console.error('Error updating task status:', e);
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

    try {
        await fetch(`/api/users/${childId}/points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, money })
        });
    } catch (e) {
        console.error('Error adding points to child:', e);
    }
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
    try {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newChild)
        });
        fetchData();
    } catch (e) {
        console.error('Error adding child:', e);
    }
  };

  const updateChild = async (id: string, name: string, avatarUrl?: string, pin?: string, birthYear?: number) => {
    const updates: any = { 
        name, 
        avatarUrl: avatarUrl || '',
        ...(pin !== undefined && { pin }),
        ...(birthYear !== undefined && { birthYear })
    };

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    
    if (currentUser?.id === id) {
        setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }

    try {
        await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                avatarUrl: updates.avatarUrl,
                pin,
                birthYear
            })
        });
    } catch (e) {
        console.error("Update Child Error:", e);
    }
  };

  const deleteChild = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    try {
        await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error('Error deleting child:', e);
    }
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

    try {
        await fetch(`/api/users/${childId}/payout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record })
        });
        fetchData();
    } catch (e) {
        console.error('Payout failed:', e);
    }
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

      setPayoutHistory(prev => [record, ...prev]);
      const updatedUser = { ...child, balance: newBalance };
      setUsers(prev => prev.map(u => u.id === childId ? updatedUser : u));
      if (currentUser?.id === childId) setCurrentUser(updatedUser);

      try {
          const res = await fetch(`/api/users/${childId}/withdrawal`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ record, amount })
          });
          return res.ok;
      } catch (e) {
          console.error('Withdrawal failed:', e);
          return false;
      }
  };

  const convertPointsToMoney = async (childId: string, pointsToConvert: number) => {
    if (pointsToConvert <= 0) return;
    const user = users.find(u => u.id === childId);
    if (!user || (user.points || 0) < pointsToConvert) return;

    const moneyToAdd = Math.floor(pointsToConvert / 10);
    const newPoints = (user.points || 0) - pointsToConvert;
    const newBalance = (user.balance || 0) + moneyToAdd;
    
    const updates = { points: newPoints, balance: newBalance };

    setUsers(prev => prev.map(u => u.id === childId ? { ...u, ...updates } : u));
    if (currentUser?.id === childId) setCurrentUser({ ...currentUser, ...updates });

    const exchangeTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        familyId: familyId!,
        title: 'Směna bodů',
        description: `Výměna ${pointsToConvert} bodů za ${moneyToAdd} Kč`,
        rewardPoints: -pointsToConvert,
        rewardMoney: moneyToAdd,
        assignedToId: childId,
        date: new Date().toISOString().split('T')[0],
        status: TaskStatus.APPROVED,
        createdBy: UserRole.CHILD
    };

    setTasks(prev => [...prev, exchangeTask]);

    try {
        await fetch(`/api/users/${childId}/convert-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pointsToConvert,
                moneyToAdd,
                exchangeTask
            })
        });
    } catch (e) {
        console.error('Points conversion failed:', e);
    }
  };

  const updateUserPin = async (userId: string, pin: string) => {
    try {
        const res = await fetch(`/api/users/${userId}/pin`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            return { success: false, error: data.error || 'Chyba databáze' };
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
          
          const res = await fetch(`/api/users/${currentUser.id}/profile`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ familyName, email, password })
          });
          const data = await res.json();

          if (!res.ok || !data.success) {
              return { success: false, error: data.error || 'Chyba při ukládání.' };
          }

          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, familyName, email, ...(password && {password}) } : { ...u, familyName }));
          await fetchData();

          return { success: true };
      } catch (e) {
          return { success: false, error: 'Chyba při ukládání.' };
      }
  };

  const setChildAllowance = async (childId: string, settings?: AllowanceSettings) => {
    setUsers(prev => prev.map(u => u.id === childId ? { ...u, allowanceSettings: settings } : u));
    try {
        await fetch(`/api/users/${childId}/allowance`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowanceSettings: settings })
        });
    } catch (e) {
        console.error('Error setting child allowance:', e);
    }
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
    
    try {
        await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: goalWithFamily.id,
                familyId: goalWithFamily.familyId,
                childId: goalWithFamily.childId,
                title: goalWithFamily.title,
                targetAmount: goalWithFamily.targetAmount,
                imageUrl: goalWithFamily.imageUrl
            })
        });
        fetchData();
    } catch (e) {
        console.error('Error adding goal:', e);
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    
    try {
        await fetch(`/api/goals/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    } catch (e) {
        console.error('Error updating goal:', e);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
        const res = await fetch(`/api/goals/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            console.error("Error deleting goal from DB:", data.error);
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

    try {
        await fetch(`/api/users/${userId}/daily-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: rewardPoints, dateStr: todayStr })
        });
        return true;
    } catch (e) {
        console.error('Daily reward failed:', e);
        return false;
    }
  };
  
  const markNotificationRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      try {
          await fetch(`/api/notifications/${id}/read`, {
              method: 'PUT'
          });
      } catch (e) {
          console.error('Error marking notification read:', e);
      }
  };
  
  // --- CALENDAR LOGIC ---

  const addCalendarEvent = async (event: CalendarEvent) => {
      if (!familyId) return;
      setCalendarEvents(prev => [...prev, event]);
      
      try {
          await fetch('/api/calendar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  id: event.id,
                  familyId,
                  childId: event.childId,
                  title: event.title,
                  dayIndex: event.dayIndex,
                  time: event.time,
                  color: event.color,
                  isRecurring: event.isRecurring,
                  specificDate: event.specificDate
              })
          });
      } catch (e) {
          console.error('Error adding calendar event:', e);
      }
  };

  const deleteCalendarEvent = async (eventId: string) => {
      setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
      try {
          await fetch(`/api/calendar/${eventId}`, {
              method: 'DELETE'
          });
      } catch (e) {
          console.error('Error deleting calendar event:', e);
      }
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
