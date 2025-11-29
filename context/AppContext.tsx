
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Task, TaskStatus, UserRole, PayoutRecord, Goal, RecurringFrequency, AllowanceSettings, AppNotification, GameResult, Pet, PetType, PetStage, CalendarEvent } from '../types';
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
  gameResults: GameResult[];
  pets: Pet[];
  calendarEvents: CalendarEvent[];
  
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
  processPayout: (childId: string) => void;
  convertPointsToMoney: (childId: string, pointsToConvert: number) => void;
  updateFamilyProfile: (familyName: string, email: string, password?: string) => Promise<{success: boolean, error?: string}>;
  updateUserPin: (userId: string, pin: string) => Promise<{success: boolean, error?: string}>;
  setChildAllowance: (childId: string, settings?: AllowanceSettings) => void;
  getAllowanceProgress: (childId: string) => AllowanceProgress | null;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => Promise<void>;
  checkAndClaimDailyReward: (userId: string) => Promise<boolean>;
  saveGameResult: (score: number, correct: number, incorrect: number, category: 'MATH' | 'ENGLISH') => Promise<{ isNewRecord: boolean, reward: number, pointsEarned: number }>;
  markNotificationRead: (id: string) => void;
  
  // Pet Methods
  adoptPet: (type: PetType, name: string) => Promise<void>;
  feedPet: (petId: string) => Promise<{success: boolean, message: string}>;
  playWithPet: (petId: string) => Promise<{success: boolean, message: string}>;

  // Calendar Methods
  addCalendarEvent: (event: CalendarEvent) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
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
  petPoints: u.pet_points || 0,
  balance: u.balance,
  password: u.password,
  pin: u.pin || '', 
  familyName: u.family_name,
  allowanceSettings: u.allowance_settings,
  lastLoginRewardDate: u.last_login_reward_date,
  createdAt: u.created_at,
  towerHighScoreMath: u.tower_high_score_math || 0,
  towerHighScoreEnglish: u.tower_high_score_english || 0,
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
  pet_points: u.petPoints,
  balance: u.balance,
  password: u.password,
  pin: u.pin,
  family_name: u.familyName,
  allowance_settings: u.allowanceSettings,
  last_login_reward_date: u.lastLoginRewardDate,
  tower_high_score_math: u.towerHighScoreMath,
  tower_high_score_english: u.towerHighScoreEnglish,
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

const mapGameResultFromDb = (r: any): GameResult => ({
  id: r.id,
  familyId: r.family_id,
  childId: r.child_id,
  category: r.category,
  score: r.score,
  correctCount: r.correct_count,
  incorrectCount: r.incorrect_count,
  rewardAmount: r.reward_amount,
  date: r.created_at
});

const mapPetFromDb = (p: any): Pet => ({
  id: p.id,
  familyId: p.family_id,
  childId: p.child_id,
  name: p.name,
  type: p.type as PetType,
  stage: p.stage,
  health: p.health,
  happiness: p.happiness,
  experience: p.experience,
  lastInteraction: p.last_interaction
});

const mapCalendarEventFromDb = (e: any): CalendarEvent => ({
    id: e.id,
    familyId: e.family_id,
    childId: e.child_id,
    title: e.title,
    dayIndex: e.day_index,
    time: e.time,
    color: e.color
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
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

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

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!familyId) {
        setUsers([]);
        setTasks([]);
        setPayoutHistory([]);
        setGoals([]);
        setGameResults([]);
        setPets([]);
        setCalendarEvents([]);
        return;
    }

    try {
      const { data: usersData } = await supabase.from('users').select('*').eq('family_id', familyId);
      if (usersData) {
          const mappedUsers = usersData.map(mapUserFromDb);
          setUsers(mappedUsers);
          if (currentUser) {
              const updatedCurrent = mappedUsers.find(u => u.id === currentUser.id);
              if (updatedCurrent) setCurrentUser(updatedCurrent);
          }
      }

      const { data: tasksData } = await supabase.from('tasks').select('*').eq('family_id', familyId);
      if (tasksData) setTasks(tasksData.map(mapTaskFromDb));

      const { data: payoutsData } = await supabase.from('payout_history').select('*').eq('family_id', familyId).order('date', { ascending: false });
      if (payoutsData) setPayoutHistory(payoutsData.map(mapPayoutFromDb));

      const { data: goalsData } = await supabase.from('goals').select('*').eq('family_id', familyId);
      if (goalsData) setGoals(goalsData.map(mapGoalFromDb));

      const { data: gamesData } = await supabase.from('game_results').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
      if (gamesData) setGameResults(gamesData.map(mapGameResultFromDb));

      const { data: eventsData } = await supabase.from('calendar_events').select('*').eq('family_id', familyId);
      if (eventsData) setCalendarEvents(eventsData.map(mapCalendarEventFromDb));

      const { data: petsData } = await supabase.from('pets').select('*').eq('family_id', familyId);
      if (petsData) {
          const mappedPets = petsData.map(mapPetFromDb);
          
          // Check for stats decay
          const updatedPets = await Promise.all(mappedPets.map(async (pet) => {
              const now = new Date();
              const lastInteraction = new Date(pet.lastInteraction);
              const diffHours = (now.getTime() - lastInteraction.getTime()) / (1000 * 3600);
              
              // Decrease stats if more than 1 hour passed
              if (diffHours >= 1) {
                  const decay = Math.floor(diffHours) * 5; // -5 stats per hour
                  const newHealth = Math.max(0, pet.health - decay);
                  const newHappiness = Math.max(0, pet.happiness - decay);
                  
                  if (newHealth !== pet.health || newHappiness !== pet.happiness) {
                      await supabase.from('pets').update({
                          health: newHealth,
                          happiness: newHappiness
                      }).eq('id', pet.id);
                      return { ...pet, health: newHealth, happiness: newHappiness };
                  }
              }
              return pet;
          }));
          
          setPets(updatedPets);
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
    fetchData();
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
  
  const saveGameResult = async (score: number, correct: number, incorrect: number, category: 'MATH' | 'ENGLISH'): Promise<{ isNewRecord: boolean, reward: number, pointsEarned: number }> => {
      if (!currentUser || !familyId) return { isNewRecord: false, reward: 0, pointsEarned: 0 };
      
      const currentHigh = category === 'MATH' ? (currentUser.towerHighScoreMath || 0) : (currentUser.towerHighScoreEnglish || 0);
      let isNewRecord = false;
      let rewardMoney = 0;
      
      const pointsEarned = correct; // 1 point per correct answer

      if (score > currentHigh) {
          isNewRecord = true;
      }

      if (isNewRecord && incorrect === 0 && score > 0) {
          rewardMoney = 10;
      }

      const userUpdates: Partial<User> = {};
      const dbUpdates: any = {};

      if (isNewRecord) {
          if (category === 'MATH') {
             userUpdates.towerHighScoreMath = score;
             dbUpdates.tower_high_score_math = score;
          } else {
             userUpdates.towerHighScoreEnglish = score;
             dbUpdates.tower_high_score_english = score;
          }
      }
      
      if (rewardMoney > 0) {
          const newBalance = (currentUser.balance || 0) + rewardMoney;
          userUpdates.balance = newBalance;
          dbUpdates.balance = newBalance;
      }
      
      if (pointsEarned > 0) {
          // CHANGE: Points from games go to Pet Points (Energy)
          const newPetPoints = (currentUser.petPoints || 0) + pointsEarned;
          userUpdates.petPoints = newPetPoints;
          dbUpdates.pet_points = newPetPoints;
      }

      const result: GameResult = {
          id: Math.random().toString(36).substr(2, 9),
          familyId,
          childId: currentUser.id,
          category,
          score,
          correctCount: correct,
          incorrectCount: incorrect,
          rewardAmount: rewardMoney,
          date: new Date().toISOString()
      };
      setGameResults(prev => [result, ...prev]);
      
      await supabase.from('game_results').insert({
          id: result.id,
          family_id: result.familyId,
          child_id: result.childId,
          category: result.category,
          score: result.score,
          correct_count: result.correctCount,
          incorrect_count: result.incorrectCount,
          reward_amount: result.rewardAmount
      });

      if (Object.keys(userUpdates).length > 0) {
          const updatedUser = { ...currentUser, ...userUpdates };
          setCurrentUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...userUpdates } : u));
          
          await supabase.from('users').update(dbUpdates).eq('id', currentUser.id);
      }

      return { isNewRecord, reward: rewardMoney, pointsEarned };
  };

  const markNotificationRead = (id: string) => {
      // Placeholder
  };
  
  // --- PET LOGIC ---

  const adoptPet = async (type: PetType, name: string) => {
      if (!currentUser || !familyId) return;
      
      const newPet: Pet = {
          id: Math.random().toString(36).substr(2, 9),
          familyId,
          childId: currentUser.id,
          name,
          type,
          stage: PetStage.EGG,
          health: 100,
          happiness: 100,
          experience: 0,
          lastInteraction: new Date().toISOString()
      };
      
      setPets(prev => [...prev, newPet]);
      await supabase.from('pets').insert({
          id: newPet.id,
          family_id: newPet.familyId,
          child_id: newPet.childId,
          name: newPet.name,
          type: newPet.type,
          stage: newPet.stage,
          health: newPet.health,
          happiness: newPet.happiness,
          experience: newPet.experience,
          last_interaction: newPet.lastInteraction
      });
  };

  const feedPet = async (petId: string): Promise<{success: boolean, message: string}> => {
      if (!currentUser) return { success: false, message: 'Not logged in' };
      const pet = pets.find(p => p.id === petId);
      if (!pet) return { success: false, message: 'Pet not found' };

      const cost = 10;
      // CHECK: Pet Points
      if ((currentUser.petPoints || 0) < cost) {
          return { success: false, message: 'Nedostatek energie (Cena: 10)' };
      }

      const newHealth = Math.min(100, pet.health + 20);
      const now = new Date().toISOString();

      // Deduct Pet Points (Energy)
      const newPetPoints = (currentUser.petPoints || 0) - cost;
      setCurrentUser(prev => prev ? { ...prev, petPoints: newPetPoints } : null);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, petPoints: newPetPoints } : u));
      await supabase.from('users').update({ pet_points: newPetPoints }).eq('id', currentUser.id);

      // Check for level up
      const newXP = pet.experience + 5;
      let nextStage = pet.stage;
      
      if (newXP >= 100) {
          nextStage = pet.stage + 1;
          await evolvePet(petId, nextStage);
          await updatePetStats(petId, { health: newHealth, lastInteraction: now }); // Stats updated in evolve too, but ensure health
          return { success: true, message: `Mňam! Vyrostl jsem na úroveň ${nextStage}!` };
      } else {
          await updatePetStats(petId, { health: newHealth, experience: newXP, lastInteraction: now });
          return { success: true, message: 'Mňam! To bylo dobré.' };
      }
  };

  const playWithPet = async (petId: string): Promise<{success: boolean, message: string}> => {
      if (!currentUser) return { success: false, message: 'Not logged in' };
      const pet = pets.find(p => p.id === petId);
      if (!pet) return { success: false, message: 'Pet not found' };

      const cost = 5;
       // CHECK: Pet Points
       if ((currentUser.petPoints || 0) < cost) {
          return { success: false, message: 'Nedostatek energie (Cena: 5)' };
      }

      const newHappiness = Math.min(100, pet.happiness + 20);
      const now = new Date().toISOString();

      // Deduct Pet Points (Energy)
      const newPetPoints = (currentUser.petPoints || 0) - cost;
      setCurrentUser(prev => prev ? { ...prev, petPoints: newPetPoints } : null);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, petPoints: newPetPoints } : u));
      await supabase.from('users').update({ pet_points: newPetPoints }).eq('id', currentUser.id);

      // Check for level up
      const newXP = pet.experience + 10;
      let nextStage = pet.stage;

      if (newXP >= 100) {
          nextStage = pet.stage + 1;
          await evolvePet(petId, nextStage);
          await updatePetStats(petId, { happiness: newHappiness, lastInteraction: now });
          return { success: true, message: `Jupí! Vyrostl jsem na úroveň ${nextStage}!` };
      } else {
          await updatePetStats(petId, { happiness: newHappiness, experience: newXP, lastInteraction: now });
          return { success: true, message: 'To byla zábava!' };
      }
  };

  const updatePetStats = async (petId: string, updates: Partial<Pet>) => {
      setPets(prev => prev.map(p => p.id === petId ? { ...p, ...updates } : p));
      
      const dbUpdates: any = {};
      if (updates.health !== undefined) dbUpdates.health = updates.health;
      if (updates.happiness !== undefined) dbUpdates.happiness = updates.happiness;
      if (updates.experience !== undefined) dbUpdates.experience = updates.experience;
      if (updates.lastInteraction !== undefined) dbUpdates.last_interaction = updates.lastInteraction;
      if (updates.stage !== undefined) dbUpdates.stage = updates.stage;

      await supabase.from('pets').update(dbUpdates).eq('id', petId);
  };

  const evolvePet = async (petId: string, newStage: number) => {
      // Reset XP to 0 on level up
      await updatePetStats(petId, { stage: newStage, experience: 0 });
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
          color: event.color
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
      gameResults,
      pets,
      calendarEvents,
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
      convertPointsToMoney,
      updateFamilyProfile,
      updateUserPin,
      setChildAllowance,
      getAllowanceProgress,
      addGoal,
      updateGoal,
      deleteGoal,
      checkAndClaimDailyReward,
      saveGameResult,
      markNotificationRead,
      adoptPet,
      feedPet,
      playWithPet,
      addCalendarEvent,
      deleteCalendarEvent
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
