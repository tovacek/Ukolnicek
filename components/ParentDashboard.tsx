import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatus, Task, User, UserRole, RecurringFrequency, AllowanceSettings, AppTheme } from '../types';
import { generateSmartTasks } from '../services/geminiService';
import { 
  Users, 
  CalendarDays, 
  CheckSquare, 
  LogOut, 
  Sparkles, 
  Check, 
  X, 
  TrendingUp,
  Wallet,
  Pencil,
  Trash2,
  Save,
  XCircle,
  Plus,
  History,
  AlertCircle,
  Star,
  Coins,
  Settings,
  Lock,
  UserCircle,
  Repeat,
  PiggyBank,
  Calendar,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Home,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Baby,
  Palette
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AvatarDisplay from './AvatarDisplay';
import ImageUploader from './ImageUploader';
import ScheduleModal from './ScheduleModal';

const ALL_CHILDREN_ID = 'ALL';

const ParentDashboard: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    getChildren, 
    users, 
    tasks, 
    addTask, 
    editTask,
    deleteTask,
    updateTaskStatus, 
    addPointsToChild,
    addChild,
    updateChild,
    deleteChild,
    processPayout,
    payoutHistory,
    updateFamilyProfile,
    updateUserPin,
    setChildAllowance,
    refreshData,
    currentTheme,
    setTheme
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'approve' | 'settings'>('overview');
  const [selectedChildId, setSelectedChildId] = useState<string>(getChildren()[0]?.id || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Smart Task Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [interests, setInterests] = useState('');
  
  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(10);
  const [newTaskMoney, setNewTaskMoney] = useState(0);
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('DAILY');

  // Child Management State
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthYear, setNewChildBirthYear] = useState<string>('');
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editChildPin, setEditChildPin] = useState('');
  const [editChildBirthYear, setEditChildBirthYear] = useState<string>('');

  // Settings State - Family
  const [familyName, setFamilyName] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [familyPassword, setFamilyPassword] = useState('');
  const [showFamilyPassword, setShowFamilyPassword] = useState(false);

  // Settings State - Profile
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profilePin, setProfilePin] = useState('');
  const [showProfilePin, setShowProfilePin] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  // Payout Confirmation Modal State
  const [payoutConfirmation, setPayoutConfirmation] = useState<{childId: string, name: string, amount: number} | null>(null);
  const [payoutNote, setPayoutNote] = useState('');

  // Task Rating Modal State (for custom tasks)
  const [ratingTask, setRatingTask] = useState<Task | null>(null);
  const [ratingPoints, setRatingPoints] = useState(20);
  const [ratingMoney, setRatingMoney] = useState(0);

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskPoints, setEditTaskPoints] = useState(0);
  const [editTaskMoney, setEditTaskMoney] = useState(0);
  const [editTaskAssignedTo, setEditTaskAssignedTo] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');
  const [editTaskIsRecurring, setEditTaskIsRecurring] = useState(false);
  const [editTaskRecurringFreq, setEditTaskRecurringFreq] = useState<RecurringFrequency>('DAILY');
  const [editTaskPenalty, setEditTaskPenalty] = useState(5);

  // Allowance Settings Modal State
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [allowanceChildId, setAllowanceChildId] = useState<string | null>(null);
  const [allowanceAmount, setAllowanceAmount] = useState(100);
  const [allowanceFreq, setAllowanceFreq] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [allowanceDay, setAllowanceDay] = useState(1);
  const [allowanceThreshold, setAllowanceThreshold] = useState(100);
  const [allowanceEnabled, setAllowanceEnabled] = useState(true);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleChildId, setScheduleChildId] = useState<string | null>(null);

  // Delete Confirmation States
  const [deleteTaskConfirmation, setDeleteTaskConfirmation] = useState<{isOpen: boolean, taskId: string | null}>({ isOpen: false, taskId: null });
  const [deleteChildConfirmation, setDeleteChildConfirmation] = useState<{isOpen: boolean, childId: string | null}>({ isOpen: false, childId: null });

  const children = getChildren();
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING_APPROVAL);

  useEffect(() => {
      if (currentUser && activeTab === 'settings') {
          setFamilyName(currentUser.familyName || '');
          setFamilyEmail(currentUser.email || '');
          setProfileName(currentUser.name || '');
          setProfileAvatar(currentUser.avatarUrl || '');
          setProfilePin(currentUser.pin || '');
          if (currentUser.password) setFamilyPassword(currentUser.password);
      }
  }, [currentUser, activeTab]);

  // Stats Calculation
  const getWeeklyStats = () => {
    const data = children.map(child => ({
      name: child.name,
      points: child.points || 0,
      money: child.balance || 0
    }));
    return data;
  };

  const getTotalPayout = () => {
    return payoutHistory.reduce((acc, curr) => acc + curr.amount, 0);
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await refreshData();
      setTimeout(() => setIsRefreshing(false), 500);
  };

  const initiateApproval = (task: Task) => {
      if (task.createdBy === UserRole.CHILD) {
          setRatingTask(task);
          setRatingPoints(20);
          setRatingMoney(0);
      } else {
          handleApprove(task);
      }
  };

  const handleApprove = (task: Task, customRewards?: {points: number, money: number}) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = task.date < todayStr;
    const penalty = task.penalty || 5;

    let points = task.rewardPoints;
    let money = task.rewardMoney;

    if (customRewards) {
        points = customRewards.points;
        money = customRewards.money;
    } else if (isOverdue) {
        points = -penalty;
        money = 0; 
    }

    updateTaskStatus(
        task.id, 
        TaskStatus.APPROVED, 
        undefined, 
        undefined, 
        { points, money }
    );
    addPointsToChild(task.assignedToId, points, money);
    setRatingTask(null);
  };

  const confirmRating = () => {
      if (ratingTask) {
          handleApprove(ratingTask, { points: ratingPoints, money: ratingMoney });
      }
  };

  const handleReject = (taskId: string) => {
    updateTaskStatus(taskId, TaskStatus.REJECTED, undefined, "Zkus to prosím znovu a lépe.");
  };

  const handleGenerateIdeas = async () => {
    if (!selectedChildId || selectedChildId === ALL_CHILDREN_ID) return;
    setIsGenerating(true);
    const ideas = await generateSmartTasks(8, interests || 'všechno');
    setGeneratedIdeas(ideas);
    setIsGenerating(false);
  };

  const applyIdea = (idea: any) => {
    setNewTaskTitle(idea.title);
    setNewTaskDesc(idea.description);
    setNewTaskPoints(idea.suggestedPoints);
    setNewTaskMoney(idea.suggestedMoney);
    setGeneratedIdeas([]);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const createSingleTask = (childId: string) => ({
      id: Math.random().toString(36).substr(2, 9),
      familyId: currentUser.familyId,
      title: newTaskTitle,
      description: newTaskDesc,
      rewardPoints: Number(newTaskPoints),
      rewardMoney: Number(newTaskMoney),
      assignedToId: childId,
      date: newTaskDate,
      status: TaskStatus.TODO,
      createdBy: UserRole.PARENT,
      isRecurring: isRecurring,
      recurringFrequency: isRecurring ? recurringFreq : undefined,
      penalty: 5 
    });

    if (selectedChildId === ALL_CHILDREN_ID) {
      children.forEach(child => {
        addTask(createSingleTask(child.id));
      });
      alert(`Úkol přidělen všem dětem (${children.length})!`);
    } else {
      addTask(createSingleTask(selectedChildId));
      alert('Úkol přidělen!');
    }

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsRecurring(false);
  };

  const openEditTaskModal = (task: Task) => {
      setEditingTask(task);
      setEditTaskTitle(task.title);
      setEditTaskDesc(task.description);
      setEditTaskPoints(task.rewardPoints);
      setEditTaskMoney(task.rewardMoney);
      setEditTaskAssignedTo(task.assignedToId);
      setEditTaskDate(task.date);
      setEditTaskIsRecurring(!!task.isRecurring);
      setEditTaskRecurringFreq(task.recurringFrequency || 'DAILY');
      setEditTaskPenalty(task.penalty !== undefined ? task.penalty : 5);
  };

  const handleSaveTaskChanges = () => {
      if (editingTask) {
          editTask(editingTask.id, {
              title: editTaskTitle,
              description: editTaskDesc,
              rewardPoints: editTaskPoints,
              rewardMoney: editTaskMoney,
              assignedToId: editTaskAssignedTo,
              date: editTaskDate,
              isRecurring: editTaskIsRecurring,
              recurringFrequency: editTaskIsRecurring ? editTaskRecurringFreq : undefined,
              penalty: editTaskPenalty
          });
          setEditingTask(null);
      }
  };

  const requestDeleteTask = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      setDeleteTaskConfirmation({ isOpen: true, taskId });
  };

  const confirmDeleteTask = () => {
      if (deleteTaskConfirmation.taskId) {
          deleteTask(deleteTaskConfirmation.taskId);
          if (editingTask && editingTask.id === deleteTaskConfirmation.taskId) {
              setEditingTask(null);
          }
          setDeleteTaskConfirmation({ isOpen: false, taskId: null });
      }
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChildName.trim()) {
      addChild(newChildName, newChildBirthYear ? parseInt(newChildBirthYear) : undefined);
      setNewChildName('');
      setNewChildBirthYear('');
      setIsAddingChild(false);
    }
  };

  const startEdit = (child: User) => {
    setEditingChildId(child.id);
    setEditName(child.name);
    setEditAvatarUrl(child.avatarUrl || '');
    setEditChildPin(child.pin || '');
    setEditChildBirthYear(child.birthYear ? child.birthYear.toString() : '');
  };

  const saveEdit = () => {
    if (editingChildId && editName.trim()) {
      updateChild(editingChildId, editName, editAvatarUrl, editChildPin || undefined, editChildBirthYear ? parseInt(editChildBirthYear) : undefined);
      setEditingChildId(null);
    }
  };

  const requestDeleteChild = (childId: string) => {
      setDeleteChildConfirmation({ isOpen: true, childId });
  };

  const confirmDeleteChild = () => {
      if (deleteChildConfirmation.childId) {
          deleteChild(deleteChildConfirmation.childId);
          setDeleteChildConfirmation({ isOpen: false, childId: null });
      }
  };

  const openPayoutModal = (child: User) => {
    setPayoutConfirmation({
      childId: child.id,
      name: child.name,
      amount: child.balance || 0
    });
    setPayoutNote('');
  };

  const handleConfirmPayout = () => {
    if (payoutConfirmation) {
      processPayout(payoutConfirmation.childId, payoutNote);
      setPayoutConfirmation(null);
      setPayoutNote('');
    }
  };

  const handleFamilySettingsSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await updateFamilyProfile(familyName, familyEmail, familyPassword);
      setSettingsMessage(result.success ? 'Rodinné nastavení uloženo.' : `Chyba: ${result.error}`);
      setTimeout(() => setSettingsMessage(''), 3000);
  };

  const handleProfileSettingsSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      updateChild(currentUser.id, profileName, profileAvatar);
      const result = await updateUserPin(currentUser.id, profilePin);
      if (result.success) {
          setSettingsMessage('Profil a PIN úspěšně uloženy.');
      } else {
          setSettingsMessage(`Chyba při ukládání PINu: ${result.error}`);
      }
      setTimeout(() => setSettingsMessage(''), 3000);
  };

  const openAllowanceSettings = (child: User) => {
      setAllowanceChildId(child.id);
      if (child.allowanceSettings) {
          setAllowanceAmount(child.allowanceSettings.amount);
          setAllowanceFreq(child.allowanceSettings.frequency);
          setAllowanceDay(child.allowanceSettings.day);
          setAllowanceThreshold(child.allowanceSettings.pointThreshold);
          setAllowanceEnabled(true);
      } else {
          setAllowanceAmount(100);
          setAllowanceFreq('MONTHLY');
          setAllowanceDay(1);
          setAllowanceThreshold(100);
          setAllowanceEnabled(false);
      }
      setShowAllowanceModal(true);
  };

  const saveAllowanceSettings = () => {
      if (allowanceChildId) {
          if (allowanceEnabled) {
              setChildAllowance(allowanceChildId, {
                  amount: Number(allowanceAmount),
                  frequency: allowanceFreq,
                  day: Number(allowanceDay),
                  pointThreshold: Number(allowanceThreshold)
              });
          } else {
              setChildAllowance(allowanceChildId, undefined);
          }
          setShowAllowanceModal(false);
      }
  };

  const openScheduleModal = (child: User) => {
      setScheduleChildId(child.id);
      setShowScheduleModal(true);
  };

  if (!currentUser) return null;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wide text-white">Úkolníček<span className="text-indigo-400">.admin</span></h1>
            <p className="text-slate-400 text-sm mt-1">Rodičovská zóna</p>
          </div>
          <button onClick={handleRefresh} className={`p-2 bg-slate-800 rounded-full hover:bg-slate-700 ${isRefreshing ? 'animate-spin' : ''}`} title="Aktualizovat data">
              <RefreshCw size={16}/>
          </button>
        </div>
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}><Users size={20} /> <span className="hidden md:inline">Přehled dětí</span></button>
          <button onClick={() => setActiveTab('tasks')} className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeTab === 'tasks' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}><CalendarDays size={20} /> <span className="hidden md:inline">Správa úkolů</span></button>
          <button onClick={() => setActiveTab('approve')} className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors relative ${activeTab === 'approve' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}>
            <CheckSquare size={20} /> <span className="hidden md:inline">Ke schválení</span>
            {pendingTasks.length > 0 && <span className="absolute top-3 right-3 md:top-auto md:right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{pendingTasks.length}</span>}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}><Settings size={20} /> <span className="hidden md:inline">Nastavení</span></button>
        </nav>
        <div className="p-4 mt-auto border-t border-slate-800">
            <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-white"><LogOut size={16}/> Odhlásit</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Přehled dětí a financí</h2></div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18}/> Celkové skóre</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getWeeklyStats()}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="points" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                                {getWeeklyStats().map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#818CF8'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {children.map(child => (
                    <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4 w-full">
                                  <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 flex-shrink-0 overflow-hidden">
                                      {editingChildId === child.id && editAvatarUrl ? (
                                          <img src={editAvatarUrl} alt={child.name} className="w-full h-full object-cover"/>
                                      ) : (
                                          <AvatarDisplay user={child} />
                                      )}
                                  </div>
                                  <div className="w-full">
                                      {editingChildId === child.id ? (
                                          <div className="flex flex-col gap-2 w-full">
                                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Jméno" className="border border-indigo-300 rounded px-2 py-1 text-slate-800 font-bold w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                              <input type="number" value={editChildBirthYear} onChange={(e) => setEditChildBirthYear(e.target.value)} placeholder="Rok narození" className="border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 w-full focus:outline-none"/>
                                              <div className="text-xs"><ImageUploader onImageSelected={setEditAvatarUrl} initialImage={editAvatarUrl} label="Změnit foto"/></div>
                                               <input type="text" value={editChildPin} onChange={(e) => setEditChildPin(e.target.value)} placeholder="PIN (volitelné)" className="border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 w-full focus:outline-none mt-2"/>
                                              <div className="flex gap-2 mt-1"><button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded flex items-center gap-1 text-xs font-bold"><Save size={16}/> Uložit</button><button onClick={() => setEditingChildId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded flex items-center gap-1 text-xs font-bold"><XCircle size={16}/> Zrušit</button></div>
                                          </div>
                                      ) : (
                                          <div>
                                            <h4 className="text-xl font-bold text-slate-800">{child.name}</h4>
                                            <p className="text-xs text-slate-400 mb-1">{child.birthYear ? `Narozen: ${child.birthYear}` : 'Věk nenastaven'}</p>
                                            <div className="flex gap-2 mt-1 text-xs text-slate-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => startEdit(child)} className="hover:text-indigo-600 flex items-center gap-1"><Pencil size={12}/> Upravit</button>
                                              <button onClick={() => requestDeleteChild(child.id)} className="hover:text-red-600 flex items-center gap-1"><Trash2 size={12}/> Smazat</button>
                                            </div>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                                  <span className="text-brand-yellow font-bold text-2xl block">{child.points}</span>
                                  <span className="text-xs text-yellow-600 uppercase font-bold">Body</span>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg text-center cursor-pointer hover:bg-green-100 transition-colors" onClick={() => openPayoutModal(child)}>
                                  <span className="text-brand-green font-bold text-2xl block">{child.balance} Kč</span>
                                  <span className="text-xs text-green-600 uppercase font-bold">Kasička</span>
                              </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-slate-100">
                             <button onClick={() => openAllowanceSettings(child)} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 text-sm font-bold transition-colors">
                                 <PiggyBank size={16}/> Kapesné
                             </button>
                             <button onClick={() => openScheduleModal(child)} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 text-sm font-bold transition-colors">
                                 <Calendar size={16}/> Rozvrh
                             </button>
                        </div>
                    </div>
                ))}

                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer min-h-[300px]" onClick={() => setIsAddingChild(true)}>
                    {isAddingChild ? (
                        <form onSubmit={handleAddChild} className="w-full flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                            <h4 className="font-bold text-slate-700 text-center mb-2">Přidat dítě</h4>
                            <input autoFocus type="text" placeholder="Jméno" className="w-full p-2 border rounded-lg" value={newChildName} onChange={e => setNewChildName(e.target.value)}/>
                            <input type="number" placeholder="Rok narození (volitelné)" className="w-full p-2 border rounded-lg" value={newChildBirthYear} onChange={e => setNewChildBirthYear(e.target.value)}/>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold">Přidat</button>
                                <button type="button" onClick={() => setIsAddingChild(false)} className="bg-gray-200 text-gray-600 px-3 rounded-lg"><X size={20}/></button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <Plus size={48} className="mb-4 opacity-50"/>
                            <span className="font-bold">Přidat člena rodiny</span>
                        </>
                    )}
                </div>
            </div>

            {/* Payout History Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={20}/> Historie výplat</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-sm border-b border-slate-100">
                                <th className="font-bold py-3 pl-2">Datum</th>
                                <th className="font-bold py-3">Dítě</th>
                                <th className="font-bold py-3">Typ</th>
                                <th className="font-bold py-3">Poznámka</th>
                                <th className="font-bold py-3 text-right pr-2">Částka</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payoutHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-slate-400 py-8">Zatím žádné výplaty.</td>
                                </tr>
                            ) : (
                                payoutHistory.map(record => {
                                    const child = users.find(u => u.id === record.childId);
                                    const isChildWithdrawal = record.type === 'CHILD';
                                    
                                    return (
                                        <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 pl-2 text-slate-600 font-medium">{new Date(record.date).toLocaleDateString('cs-CZ')}</td>
                                            <td className="py-3 text-slate-800 font-bold flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden">
                                                    <AvatarDisplay user={child} />
                                                </div>
                                                {child?.name || 'Neznámé'}
                                            </td>
                                            <td className="py-3">
                                                {isChildWithdrawal ? (
                                                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-bold">
                                                        <Baby size={12}/> Výběr
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                                                        <ShieldCheck size={12}/> Výplata
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-slate-500 italic text-sm">{record.note || '-'}</td>
                                            <td className="py-3 pr-2 text-right font-bold text-brand-green">-{record.amount} Kč</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Správa úkolů</h2></div>

                {/* Add Task Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-brand-yellow"/> Nový úkol</h3>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-500 mb-1">Název úkolu</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="např. Vynést odpadky" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-500 mb-1">Popis (volitelné)</label>
                                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} placeholder="Detailní popis co je třeba udělat..." value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)}/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Odměna (Body)</label>
                                <input type="number" min="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newTaskPoints} onChange={e => setNewTaskPoints(Number(e.target.value))}/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Odměna (Kč)</label>
                                <input type="number" min="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newTaskMoney} onChange={e => setNewTaskMoney(Number(e.target.value))}/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Pro koho</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}>
                                    <option value={ALL_CHILDREN_ID}>Všechny děti</option>
                                    {children.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Termín</label>
                                <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)}/>
                            </div>
                            
                            <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="recurring" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"/>
                                    <label htmlFor="recurring" className="font-bold text-slate-700">Opakovat úkol</label>
                                </div>
                                {isRecurring && (
                                    <select value={recurringFreq} onChange={e => setRecurringFreq(e.target.value as RecurringFrequency)} className="p-2 bg-white border border-slate-200 rounded-lg text-sm">
                                        <option value="DAILY">Denně</option>
                                        <option value="WEEKLY">Týdně</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95">Vytvořit úkol</button>
                    </form>

                    {/* Smart AI Generator */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h4 className="font-bold text-sm text-slate-500 uppercase mb-3 flex items-center gap-2"><Sparkles size={16}/> AI Pomocník</h4>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="Zájmy dítěte (např. vesmír, dinosauři, vaření)..." className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={interests} onChange={e => setInterests(e.target.value)}/>
                            <button onClick={handleGenerateIdeas} disabled={isGenerating} className="px-6 py-3 bg-brand-yellow text-brand-dark font-bold rounded-xl hover:bg-yellow-400 disabled:opacity-70">
                                {isGenerating ? 'Generuji...' : 'Navrhnout úkoly'}
                            </button>
                        </div>
                        {generatedIdeas.length > 0 && (
                            <div className="grid grid-cols-1 gap-3">
                                {generatedIdeas.map((idea, idx) => (
                                    <div key={idx} className="p-4 border border-indigo-100 bg-indigo-50 rounded-xl flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => applyIdea(idea)}>
                                        <div>
                                            <h5 className="font-bold text-indigo-900">{idea.title}</h5>
                                            <p className="text-xs text-indigo-700">{idea.description}</p>
                                            <div className="flex gap-2 mt-1 text-xs font-bold text-indigo-500"><span>{idea.suggestedPoints} bodů</span><span>{idea.suggestedMoney} Kč</span></div>
                                        </div>
                                        <Plus className="text-indigo-500"/>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Seznam aktivních úkolů</h3>
                    <div className="space-y-3">
                        {tasks.filter(t => t.status === TaskStatus.TODO).length === 0 ? (
                            <p className="text-slate-400 text-center py-4">Žádné aktivní úkoly.</p>
                        ) : (
                            tasks.filter(t => t.status === TaskStatus.TODO).sort((a,b) => a.date.localeCompare(b.date)).map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${task.date < todayStr ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{task.title}</h4>
                                            <div className="text-xs text-slate-500 flex gap-2">
                                                <span>Pro: {users.find(u => u.id === task.assignedToId)?.name}</span>
                                                <span>Termín: {new Date(task.date).toLocaleDateString('cs-CZ')}</span>
                                                {task.isRecurring && <span className="flex items-center gap-1 text-indigo-500"><Repeat size={10}/> {task.recurringFrequency === 'DAILY' ? 'Denně' : 'Týdně'}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditTaskModal(task)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil size={18}/></button>
                                        <button onClick={(e) => requestDeleteTask(e, task.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* APPROVE TAB */}
        {activeTab === 'approve' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">Ke schválení ({pendingTasks.length})</h2></div>
                
                {pendingTasks.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl text-center text-slate-400 border border-slate-200">
                        <CheckSquare size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="text-lg">Vše zkontrolováno! Žádné úkoly nečekají na schválení.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingTasks.map(task => {
                            const child = users.find(u => u.id === task.assignedToId);
                            return (
                                <div key={task.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                                    {task.proofImageUrl && (
                                        <div className="w-full md:w-1/3 h-48 bg-slate-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => window.open(task.proofImageUrl, '_blank')}>
                                            <img src={task.proofImageUrl} className="w-full h-full object-cover hover:scale-105 transition-transform" alt="Důkaz"/>
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Čeká na schválení</span>
                                                <span className="text-slate-400 text-sm">{new Date(task.date).toLocaleDateString('cs-CZ')}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">{task.title}</h3>
                                            <p className="text-slate-500 text-sm mb-4">{task.description}</p>
                                            
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                                    <AvatarDisplay user={child} />
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm">{child?.name}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-auto">
                                            <button onClick={() => initiateApproval(task)} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 shadow-md shadow-green-200 flex items-center justify-center gap-2">
                                                <Check size={20}/> Schválit
                                            </button>
                                            <button onClick={() => handleReject(task.id)} className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 flex items-center justify-center gap-2">
                                                <X size={20}/> Zamítnout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Nastavení</h2></div>
                
                {/* Theme Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Palette size={20}/> Vzhled aplikace</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {[
                            { id: 'DEFAULT', name: 'Výchozí', colors: ['#FFD166', '#118AB2', '#06D6A0'] },
                            { id: 'SPACE', name: 'Vesmír', colors: ['#10002B', '#7B2CBF', '#F72585'] },
                            { id: 'CANDY', name: 'Cukroví', colors: ['#FFB7B2', '#A2E1DB', '#E2F0CB'] },
                            { id: 'FOREST', name: 'Les', colors: ['#2A9D8F', '#E9C46A', '#E76F51'] },
                         ].map(theme => (
                             <button 
                                key={theme.id} 
                                onClick={() => setTheme(theme.id as AppTheme)}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col gap-2 ${currentTheme === theme.id ? 'border-brand-blue bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                             >
                                 <div className="flex -space-x-2 justify-center">
                                     {theme.colors.map((c, i) => (
                                         <div key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }}></div>
                                     ))}
                                 </div>
                                 <span className="text-sm font-bold text-gray-700 text-center">{theme.name}</span>
                             </button>
                         ))}
                    </div>
                </div>

                {/* Family Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Home size={20}/> Rodinný účet</h3>
                    <form onSubmit={handleFamilySettingsSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Název rodiny</label>
                            <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={familyName} onChange={e => setFamilyName(e.target.value)}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Email (Login)</label>
                            <input type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={familyEmail} onChange={e => setFamilyEmail(e.target.value)}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Heslo</label>
                            <div className="relative">
                                <input type={showFamilyPassword ? "text" : "password"} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={familyPassword} onChange={e => setFamilyPassword(e.target.value)}/>
                                <button type="button" onClick={() => setShowFamilyPassword(!showFamilyPassword)} className="absolute right-3 top-3 text-slate-400">
                                    {showFamilyPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Uložit změny</button>
                    </form>
                </div>

                {/* Parent Profile */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><UserCircle size={20}/> Můj profil (Rodič)</h3>
                    <form onSubmit={handleProfileSettingsSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Jméno</label>
                            <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={profileName} onChange={e => setProfileName(e.target.value)}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">PIN (pro přepínání profilů)</label>
                            <div className="relative">
                                <input type={showProfilePin ? "text" : "password"} maxLength={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={profilePin} onChange={e => setProfilePin(e.target.value)} placeholder="****"/>
                                <button type="button" onClick={() => setShowProfilePin(!showProfilePin)} className="absolute right-3 top-3 text-slate-400">
                                    {showProfilePin ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-2">Avatar</label>
                            <ImageUploader onImageSelected={setProfileAvatar} initialImage={profileAvatar} label=""/>
                        </div>
                        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Uložit profil</button>
                    </form>
                </div>

                {settingsMessage && <div className="p-4 bg-green-100 text-green-700 rounded-xl text-center font-bold">{settingsMessage}</div>}
            </div>
        )}

      </main>

      {/* MODALS */}
      
      {/* Payout Confirmation */}
      {payoutConfirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Potvrdit výplatu</h3>
                  <p className="text-slate-500 mb-4">Opravdu chceš vyplatit <span className="font-bold text-green-600">{payoutConfirmation.amount} Kč</span> pro {payoutConfirmation.name}?</p>
                  
                  <div className="mb-6">
                      <label className="block text-sm font-bold text-slate-500 mb-1">Poznámka (volitelné)</label>
                      <input 
                        type="text" 
                        placeholder="např. Kapesné na výlet" 
                        value={payoutNote} 
                        onChange={(e) => setPayoutNote(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                      />
                  </div>

                  <p className="text-xs text-slate-400 mb-6 bg-slate-50 p-3 rounded-lg">Tímto se vynuluje stav "Kasičky" v aplikaci. Peníze musíte předat fyzicky.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setPayoutConfirmation(null)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200">Zrušit</button>
                      <button onClick={handleConfirmPayout} className="flex-1 py-3 bg-green-500 font-bold text-white rounded-xl hover:bg-green-600 shadow-lg shadow-green-200">Vyplatit</button>
                  </div>
              </div>
          </div>
      )}

      {/* Rating Modal for Custom Tasks */}
      {ratingTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Ohodnotit úkol</h3>
                  <p className="text-sm text-slate-500 mb-4">Dítě splnilo vlastní úkol: <strong>{ratingTask.title}</strong>. Kolik bodů si zaslouží?</p>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-sm font-bold text-slate-500 mb-1">Body</label>
                          <input type="number" className="w-full p-3 border rounded-xl" value={ratingPoints} onChange={e => setRatingPoints(Number(e.target.value))}/>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-500 mb-1">Peníze (Kč)</label>
                          <input type="number" className="w-full p-3 border rounded-xl" value={ratingMoney} onChange={e => setRatingMoney(Number(e.target.value))}/>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setRatingTask(null)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200">Zrušit</button>
                      <button onClick={confirmRating} className="flex-1 py-3 bg-green-500 font-bold text-white rounded-xl hover:bg-green-600 shadow-lg shadow-green-200">Schválit</button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Upravit úkol</h3>
                  <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-500 mb-1">Název</label>
                          <input type="text" className="w-full p-3 border rounded-xl" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)}/>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-500 mb-1">Popis</label>
                          <textarea className="w-full p-3 border rounded-xl" value={editTaskDesc} onChange={e => setEditTaskDesc(e.target.value)}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">Body</label>
                              <input type="number" className="w-full p-3 border rounded-xl" value={editTaskPoints} onChange={e => setEditTaskPoints(Number(e.target.value))}/>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">Peníze</label>
                              <input type="number" className="w-full p-3 border rounded-xl" value={editTaskMoney} onChange={e => setEditTaskMoney(Number(e.target.value))}/>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">Penále (po termínu)</label>
                              <input type="number" className="w-full p-3 border rounded-xl" value={editTaskPenalty} onChange={e => setEditTaskPenalty(Number(e.target.value))}/>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">Termín</label>
                              <input type="date" className="w-full p-3 border rounded-xl" value={editTaskDate} onChange={e => setEditTaskDate(e.target.value)}/>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                              <input type="checkbox" id="editRecurring" checked={editTaskIsRecurring} onChange={e => setEditTaskIsRecurring(e.target.checked)} className="w-5 h-5 rounded text-indigo-600"/>
                              <label htmlFor="editRecurring" className="font-bold text-slate-700">Opakovat</label>
                          </div>
                          {editTaskIsRecurring && (
                              <select value={editTaskRecurringFreq} onChange={e => setEditTaskRecurringFreq(e.target.value as RecurringFrequency)} className="p-2 bg-white border border-slate-200 rounded-lg text-sm">
                                  <option value="DAILY">Denně</option>
                                  <option value="WEEKLY">Týdně</option>
                              </select>
                          )}
                      </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setEditingTask(null)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200">Zrušit</button>
                      <button onClick={handleSaveTaskChanges} className="flex-1 py-3 bg-indigo-600 font-bold text-white rounded-xl hover:bg-indigo-700 shadow-lg">Uložit</button>
                  </div>
              </div>
            </div>
      )}

      {/* Allowance Modal */}
      {showAllowanceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><PiggyBank className="text-pink-500"/> Nastavení kapesného</h3>
                  
                  <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${allowanceEnabled ? 'bg-green-500' : 'bg-slate-300'}`} onClick={() => setAllowanceEnabled(!allowanceEnabled)}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${allowanceEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <span className="font-bold text-slate-700">{allowanceEnabled ? 'Zapnuto' : 'Vypnuto'}</span>
                  </div>

                  {allowanceEnabled && (
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">Částka (Kč)</label>
                              <input type="number" className="w-full p-3 border rounded-xl" value={allowanceAmount} onChange={e => setAllowanceAmount(Number(e.target.value))}/>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-500 mb-1">Frekvence</label>
                                  <select className="w-full p-3 border rounded-xl" value={allowanceFreq} onChange={e => setAllowanceFreq(e.target.value as any)}>
                                      <option value="WEEKLY">Týdně</option>
                                      <option value="MONTHLY">Měsíčně</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-500 mb-1">{allowanceFreq === 'WEEKLY' ? 'Den v týdnu' : 'Den v měsíci'}</label>
                                  {allowanceFreq === 'WEEKLY' ? (
                                      <select className="w-full p-3 border rounded-xl" value={allowanceDay} onChange={e => setAllowanceDay(Number(e.target.value))}>
                                          <option value={1}>Pondělí</option>
                                          <option value={5}>Pátek</option>
                                          <option value={7}>Neděle</option>
                                      </select>
                                  ) : (
                                      <input type="number" min={1} max={28} className="w-full p-3 border rounded-xl" value={allowanceDay} onChange={e => setAllowanceDay(Number(e.target.value))}/>
                                  )}
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">Hranice bodů pro 100%</label>
                              <div className="flex gap-2">
                                  <input type="number" className="w-full p-3 border rounded-xl" value={allowanceThreshold} onChange={e => setAllowanceThreshold(Number(e.target.value))}/>
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center"><Star size={16} className="text-yellow-500"/></div>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">Pokud dítě získá méně bodů, dostane poměrnou část.</p>
                          </div>
                      </div>
                  )}

                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowAllowanceModal(false)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200">Zrušit</button>
                      <button onClick={saveAllowanceSettings} className="flex-1 py-3 bg-indigo-600 font-bold text-white rounded-xl hover:bg-indigo-700 shadow-lg">Uložit</button>
                  </div>
              </div>
          </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && scheduleChildId && (
          <ScheduleModal childId={scheduleChildId} onClose={() => setShowScheduleModal(false)} />
      )}

      {/* Delete Child Confirmation */}
      {deleteChildConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in border border-red-100">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Smazat dítě?</h3>
                      <p className="text-gray-500 mt-2 text-sm">Opravdu chcete smazat tento profil a všechna data? Tato akce je nevratná.</p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setDeleteChildConfirmation({ isOpen: false, childId: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Zrušit</button>
                      <button onClick={confirmDeleteChild} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600">Smazat</button>
                  </div>
              </div>
          </div>
      )}

       {/* Delete Task Confirmation */}
       {deleteTaskConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in border border-red-100">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                          <Trash2 size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Smazat úkol?</h3>
                      <p className="text-gray-500 mt-2 text-sm">Opravdu chcete odstranit tento úkol?</p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setDeleteTaskConfirmation({ isOpen: false, taskId: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Zrušit</button>
                      <button onClick={confirmDeleteTask} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600">Smazat</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ParentDashboard;