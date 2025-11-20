
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Task, TaskStatus, UserRole, PayoutRecord, Goal, RecurringFrequency, AllowanceSettings } from '../types';
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
  allowanceSettings: u.allowance_settings
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
  allowance_settings: u.allowanceSettings
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
  recurringFrequency: t.recurring_frequency
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
  recurring_frequency: t.recurringFrequency
});

const mapPayoutFromDb = (p: any): PayoutRecord => ({
  id: p.id,
  familyId: p.family_id,
  childId: p.child_id,
  amount: p.amount,
  date: p.date
});

const mapGoalFromDb = (g: any): Goal => ({
  id: g.id,
  familyId: g.family_id,
  childId: g.child_id,
  title: g.title,
  targetAmount: g.target_amount,
  imageUrl: g.image_url
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
        const { data: usersData } = await supabase.from('users').select('*').eq('family_id', familyId);
        if (usersData) setUsers(usersData.map(mapUserFromDb));

        const { data: tasksData } = await supabase.from('tasks').select('*').eq('family_id', familyId);
        if (tasksData) setTasks(tasksData.map(mapTaskFromDb));

        const { data: payoutsData } = await supabase.from('payout_history').select('*').eq('family_id', familyId).order('date', { ascending: false });
        if (payoutsData) setPayoutHistory(payoutsData.map(mapPayoutFromDb));

        const { data: goalsData } = await supabase.from('goals').select('*').eq('family_id', familyId);
        if (goalsData) setGoals(goalsData.map(mapGoalFromDb));

      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [familyId]);

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
        // Check if email exists
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        if (existing) return { success: false, error: 'Email již existuje.' };

        const familyId = Math.random().toString(36).substr(2, 9);
        const parentId = Math.random().toString(36).substr(2, 9);

        const newParent: User = {
            id: parentId,
            familyId,
            email,
            name: familyName || 'Rodič',
            role: UserRole.PARENT,
            password,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${parentId}`
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
    if (user) setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const logoutFamily = () => {
      setCurrentUser(null);
      setFamilyId(null);
  };

  // --- DATA METHODS ---

  const addTask = async (task: Task) => {
    const taskWithFamily = { ...task, familyId: familyId! };
    setTasks(prev => [...prev, taskWithFamily]);
    await supabase.from('tasks').insert(mapTaskToDb(taskWithFamily));
  };

  const editTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    
    // Map partial updates is tricky, assume we map manual keys or full object re-map
    // Simplified:
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.rewardPoints !== undefined) dbUpdates.reward_points = updates.rewardPoints;
    if (updates.rewardMoney !== undefined) dbUpdates.reward_money = updates.rewardMoney;
    if (updates.assignedToId !== undefined) dbUpdates.assigned_to_id = updates.assignedToId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
    if (updates.recurringFrequency !== undefined) dbUpdates.recurring_frequency = updates.recurringFrequency;

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

    await supabase.from('users').update(updates).eq('id', childId);
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
    await supabase.from('users').insert(mapUserToDb(newChild));
  };

  const updateChild = async (id: string, name: string, avatarUrl?: string, password?: string) => {
    const updates: any = { 
        name, 
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        ...(password !== undefined && { password }) 
    };

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    
    const dbUpdates: any = { name, avatar_url: updates.avatarUrl };
    if (password !== undefined) dbUpdates.password = password;

    await supabase.from('users').update(dbUpdates).eq('id', id);
  };

  const deleteChild = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    await supabase.from('users').delete().eq('id', id);
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

    await supabase.from('payout_history').insert(mapPayoutFromDb({
        id: record.id,
        family_id: record.familyId,
        child_id: record.childId,
        amount: record.amount,
        date: record.date
    }));

    await supabase.from('users').update({ balance: 0 }).eq('id', childId);
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

    await supabase.from('users').update(updates).eq('id', childId);
  };

  const setUserPassword = async (userId: string, password: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password } : u));
    await supabase.from('users').update({ password }).eq('id', userId);
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
    setGoals(prev => prev.filter(g => g.id !== id));
    await supabase.from('goals').delete().eq('id', id);
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
