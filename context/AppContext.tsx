
import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  payoutHistory: PayoutRecord[];
  goals: Goal[];
  login: (userId: string) => void;
  logout: () => void;
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

// Mock Data Initialization
const INITIAL_USERS: User[] = [
  { id: 'p1', name: 'Maminka', role: UserRole.PARENT, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'p2', name: 'Tatínek', role: UserRole.PARENT, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'c1', name: 'Pepíček', role: UserRole.CHILD, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy', points: 150, balance: 200 },
  { id: 'c2', name: 'Anička', role: UserRole.CHILD, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Trouble', points: 320, balance: 450 },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Uklidit hračky',
    description: 'Všechny hračky musí být v krabici.',
    rewardPoints: 20,
    rewardMoney: 5,
    assignedToId: 'c1',
    date: new Date().toISOString().split('T')[0],
    status: TaskStatus.TODO,
    createdBy: UserRole.PARENT,
    isRecurring: true,
    recurringFrequency: 'DAILY'
  },
  {
    id: 't2',
    title: 'Vynést koš',
    description: 'Vynést tříděný odpad.',
    rewardPoints: 30,
    rewardMoney: 10,
    assignedToId: 'c2',
    date: new Date().toISOString().split('T')[0],
    status: TaskStatus.PENDING_APPROVAL,
    proofImageUrl: 'https://images.unsplash.com/photo-1532347922424-00930d2e98e7?w=500&auto=format&fit=crop&q=60',
    createdBy: UserRole.PARENT
  }
];

const INITIAL_PAYOUT_HISTORY: PayoutRecord[] = [
  { id: 'ph1', childId: 'c1', amount: 50, date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'ph2', childId: 'c2', amount: 100, date: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', childId: 'c1', title: 'Nové Lego', targetAmount: 500, imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500&auto=format&fit=crop&q=60' },
  { id: 'g2', childId: 'c2', title: 'Jízdní kolo', targetAmount: 3000, imageUrl: 'https://images.unsplash.com/photo-1485965120184-e224f7a1d784?w=500&auto=format&fit=crop&q=60' }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>(INITIAL_PAYOUT_HISTORY);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const editTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const calculateNextDate = (currentDate: string, frequency?: RecurringFrequency): string => {
      const date = new Date(currentDate);
      if (frequency === 'WEEKLY') {
          date.setDate(date.getDate() + 7);
      } else {
          // Default to DAILY
          date.setDate(date.getDate() + 1);
      }
      return date.toISOString().split('T')[0];
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus, proofImageUrl?: string, feedback?: string, rewards?: { points: number, money: number }) => {
    setTasks(prev => {
        const updatedTasks = prev.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status,
                    ...(proofImageUrl && { proofImageUrl }),
                    ...(feedback && { feedback }),
                    ...(rewards && { rewardPoints: rewards.points, rewardMoney: rewards.money })
                };
            }
            return t;
        });

        // Logic to handle Recurring Tasks
        if (status === TaskStatus.APPROVED) {
            const completedTask = prev.find(t => t.id === taskId);
            if (completedTask && completedTask.isRecurring) {
                // Create next instance of the task
                const nextDate = calculateNextDate(completedTask.date, completedTask.recurringFrequency);
                const nextTask: Task = {
                    ...completedTask,
                    id: Math.random().toString(36).substr(2, 9),
                    date: nextDate,
                    status: TaskStatus.TODO,
                    proofImageUrl: undefined, // Reset proof
                    feedback: undefined, // Reset feedback
                    // Keep recurring settings
                };
                return [...updatedTasks, nextTask];
            }
        }

        return updatedTasks;
    });
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

  const addPointsToChild = (childId: string, points: number, money: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === childId) {
        const updatedUser = {
          ...u,
          points: (u.points || 0) + points,
          balance: (u.balance || 0) + money
        };
        // Also update currentUser if it matches to keep UI in sync
        if (currentUser?.id === childId) {
            setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));
  };

  const addChild = (name: string) => {
    const newChild: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role: UserRole.CHILD,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      points: 0,
      balance: 0
    };
    setUsers(prev => [...prev, newChild]);
  };

  const updateChild = (id: string, name: string, avatarUrl?: string, password?: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id 
        ? { 
            ...u, 
            name, 
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            ...(password !== undefined && { password }) 
          } 
        : u
    ));
  };

  const deleteChild = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const processPayout = (childId: string) => {
    const child = users.find(u => u.id === childId);
    if (!child || !child.balance || child.balance <= 0) return;

    const record: PayoutRecord = {
      id: Math.random().toString(36).substr(2, 9),
      childId,
      amount: child.balance,
      date: new Date().toISOString()
    };

    setPayoutHistory(prev => [record, ...prev]);

    setUsers(prev => prev.map(u => {
      if (u.id === childId) {
        const updatedUser = { ...u, balance: 0 };
        if (currentUser?.id === childId) {
            setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));
  };

  const convertPointsToMoney = (childId: string, pointsToConvert: number) => {
    if (pointsToConvert <= 0) return;
    
    setUsers(prev => prev.map(u => {
      if (u.id === childId && (u.points || 0) >= pointsToConvert) {
        const moneyToAdd = Math.floor(pointsToConvert / 10);
        const updatedUser = {
            ...u,
            points: (u.points || 0) - pointsToConvert,
            balance: (u.balance || 0) + moneyToAdd
        };
        
        if (currentUser?.id === childId) {
            setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));
  };

  const setUserPassword = (userId: string, password: string) => {
    setUsers(prev => prev.map(u => {
        if (u.id === userId) {
            const updatedUser = { ...u, password };
            if (currentUser?.id === userId) {
                setCurrentUser(updatedUser);
            }
            return updatedUser;
        }
        return u;
    }));
  };

  const setChildAllowance = (childId: string, settings?: AllowanceSettings) => {
    setUsers(prev => prev.map(u => {
        if (u.id === childId) {
            const updatedUser = { ...u, allowanceSettings: settings };
            if (currentUser?.id === childId) {
                setCurrentUser(updatedUser);
            }
            return updatedUser;
        }
        return u;
    }));
  };

  const getAllowanceProgress = (childId: string): AllowanceProgress | null => {
    const user = users.find(u => u.id === childId);
    if (!user || !user.allowanceSettings) return null;

    const { amount, frequency, day, pointThreshold } = user.allowanceSettings;
    
    const now = new Date();
    let nextPaymentDate = new Date();
    let periodStartDate = new Date();

    if (frequency === 'MONTHLY') {
        // Monthly logic
        nextPaymentDate.setDate(day);
        // If day is passed in current month, next payment is next month
        if (nextPaymentDate <= now) {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        } else {
            // If today is before the pay day, check if we are still in the previous period or current
            // Assuming just setting to 'day' of current month is the target
        }
        
        periodStartDate = new Date(nextPaymentDate);
        periodStartDate.setMonth(periodStartDate.getMonth() - 1);
    } else {
        // Weekly logic
        // day 1-7 (1=Mon, 7=Sun)
        const currentDay = now.getDay() || 7; 
        let daysUntil = day - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        
        nextPaymentDate.setDate(now.getDate() + daysUntil);
        
        periodStartDate = new Date(nextPaymentDate);
        periodStartDate.setDate(periodStartDate.getDate() - 7);
    }

    const periodStartStr = periodStartDate.toISOString().split('T')[0];
    
    // Sum points earned from tasks approved since period start
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

  const addGoal = (goal: Goal) => {
    setGoals(prev => [...prev, goal]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      tasks,
      payoutHistory,
      goals,
      login,
      logout,
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
