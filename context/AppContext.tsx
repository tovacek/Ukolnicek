
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Task, TaskStatus, UserRole, PayoutRecord, Goal, RecurringFrequency, AllowanceSettings } from '../types';

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
  
  // Auth Methods
  loginFamily: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  registerFamily: (email: string, password: string, familyName: string) => Promise<{success: boolean, error?: string}>;
  selectProfile: (userId: string) => void;
  logout: () => void;
  logoutFamily: () => void;

  // Data Methods
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, proofImageUrl?: string, feedback?: string, rewards?: { points: number, money: number }) => void;
  editTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  getChildren: () => User[];
  getTasksForChild: (childId: string, date?: string) => Task[];
  addPointsToChild: (childId: string, points: number, money: number) => void;
  addChild: (name: string) => void;
  updateChild: (id: string, name: string, avatarUrl?: string, password?: string) => void;
  deleteChild: (id: string) => void;
  processPayout: (childId: string) => void;
  convertPointsToMoney: (childId: string, pointsToConvert: number) => void;
  setUserPassword: (userId: string, password: string) => void;
  setChildAllowance: (childId: string, settings?: AllowanceSettings) => void;
  getAllowanceProgress: (childId: string) => AllowanceProgress | null;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth State
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Fetch data ONLY when a family is logged in
  useEffect(() => {
    if (!familyId) {
        setUsers([]);
        setTasks([]);
        setPayoutHistory([]);
        setGoals([]);
        return;
    }

    const fetchData = async () => {
      try {
        // We pass familyId via headers or query params if needed, 
        // but ideally the backend session/token handles it. 
        // For this basic auth, we assume the endpoints return data scoped to the logged-in user/family.
        const headers = { 'x-family-id': familyId };

        const [usersRes, tasksRes, payoutsRes, goalsRes] = await Promise.all([
          fetch(`/api/users?familyId=${familyId}`, { headers }),
          fetch(`/api/tasks?familyId=${familyId}`, { headers }),
          fetch(`/api/payouts?familyId=${familyId}`, { headers }),
          fetch(`/api/goals?familyId=${familyId}`, { headers })
        ]);
        
        if (usersRes.ok) setUsers(await usersRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (payoutsRes.ok) setPayoutHistory(await payoutsRes.json());
        if (goalsRes.ok) setGoals(await goalsRes.json());
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [familyId]);

  // --- AUTH METHODS ---

  const loginFamily = async (email: string, password: string) => {
      try {
          const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          
          if (res.ok && data.familyId) {
              setFamilyId(data.familyId);
              // The login endpoint might return users immediately, or we rely on useEffect
              return { success: true };
          } else {
              return { success: false, error: data.error || 'Přihlášení se nezdařilo' };
          }
      } catch (e) {
          return { success: false, error: 'Chyba připojení' };
      }
  };

  const registerFamily = async (email: string, password: string, familyName: string) => {
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, familyName })
        });
        const data = await res.json();
        
        if (res.ok) {
            return { success: true };
        } else {
            return { success: false, error: data.error || 'Registrace se nezdařila' };
        }
    } catch (e) {
        return { success: false, error: 'Chyba připojení' };
    }
  };

  const selectProfile = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    // Keep familyId (return to profile selection)
  };

  const logoutFamily = () => {
      setCurrentUser(null);
      setFamilyId(null);
  };

  // --- DATA METHODS (with familyId injection) ---

  const addTask = async (task: Task) => {
    const taskWithFamily = { ...task, familyId: familyId! };
    setTasks(prev => [...prev, taskWithFamily]);
    
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskWithFamily)
    });
  };

  const editTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
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
        await addTask(nextTask);
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

    await fetch(`/api/users/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
  };

  const addChild = async (name: string) => {
    const newChild: User = {
      id: Math.random().toString(36).substr(2, 9),
      familyId: familyId!,
      name,
      role: UserRole.CHILD,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      points: 0,
      balance: 0
    };
    setUsers(prev => [...prev, newChild]);
    await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChild)
    });
  };

  const updateChild = async (id: string, name: string, avatarUrl?: string, password?: string) => {
    const updates: any = { 
        name, 
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        ...(password !== undefined && { password }) 
    };

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
  };

  const deleteChild = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  };

  const processPayout = async (childId: string) => {
    const child = users.find(u => u.id === childId);
    if (!child || !child.balance || child.balance <= 0) return;

    const record: PayoutRecord = {
      id: Math.random().toString(36).substr(2, 9),
      familyId: familyId!,
      childId,
      amount: child.balance,
      date: new Date().toISOString()
    };

    setPayoutHistory(prev => [record, ...prev]);
    const updatedUser = { ...child, balance: 0 };
    setUsers(prev => prev.map(u => u.id === childId ? updatedUser : u));
    if (currentUser?.id === childId) setCurrentUser(updatedUser);

    await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
    });

    await fetch(`/api/users/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: 0 })
    });
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

    await fetch(`/api/users/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
  };

  const setUserPassword = async (userId: string, password: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password } : u));
    await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
  };

  const setChildAllowance = async (childId: string, settings?: AllowanceSettings) => {
    setUsers(prev => prev.map(u => u.id === childId ? { ...u, allowanceSettings: settings } : u));
    await fetch(`/api/users/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowanceSettings: settings })
    });
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
    await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalWithFamily)
    });
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
  };

  return (
    <AppContext.Provider value={{
      familyId,
      currentUser,
      users,
      tasks,
      payoutHistory,
      goals,
      loginFamily,
      registerFamily,
      selectProfile,
      logout,
      logoutFamily,
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
      convertPointsToMoney,
      setUserPassword,
      setChildAllowance,
      getAllowanceProgress,
      addGoal,
      updateGoal,
      deleteGoal
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
