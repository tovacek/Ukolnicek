
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatus, Task, User, UserRole, RecurringFrequency, AllowanceSettings } from '../types';
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
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
    setUserPassword,
    setChildAllowance,
    refreshData
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('DAILY');

  // Child Management State
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editChildPassword, setEditChildPassword] = useState('');

  // Parent Settings State
  const [newParentPassword, setNewParentPassword] = useState('');
  const [confirmParentPassword, setConfirmParentPassword] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');

  // Payout Confirmation Modal State
  const [payoutConfirmation, setPayoutConfirmation] = useState<{childId: string, name: string, amount: number} | null>(null);

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

  // Allowance Settings Modal State
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [allowanceChildId, setAllowanceChildId] = useState<string | null>(null);
  const [allowanceAmount, setAllowanceAmount] = useState(100);
  const [allowanceFreq, setAllowanceFreq] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [allowanceDay, setAllowanceDay] = useState(1); // 1st of month or Monday (1)
  const [allowanceThreshold, setAllowanceThreshold] = useState(100);
  const [allowanceEnabled, setAllowanceEnabled] = useState(true);

  const children = getChildren();
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING_APPROVAL);

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
      // If child created this task, open rating modal first
      if (task.createdBy === UserRole.CHILD) {
          setRatingTask(task);
          setRatingPoints(20); // Default suggestion
          setRatingMoney(0);
      } else {
          // Standard task, just approve
          handleApprove(task);
      }
  };

  const handleApprove = (task: Task, customRewards?: {points: number, money: number}) => {
    const points = customRewards ? customRewards.points : task.rewardPoints;
    const money = customRewards ? customRewards.money : task.rewardMoney;

    updateTaskStatus(
        task.id, 
        TaskStatus.APPROVED, 
        undefined, 
        undefined, 
        customRewards
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
    // Mock age for now, assuming 6-10 range
    const ideas = await generateSmartTasks(8, interests || 'všechno');
    setGeneratedIdeas(ideas);
    setIsGenerating(false);
  };

  const applyIdea = (idea: any) => {
    setNewTaskTitle(idea.title);
    setNewTaskDesc(idea.description);
    setNewTaskPoints(idea.suggestedPoints);
    setNewTaskMoney(idea.suggestedMoney);
    setGeneratedIdeas([]); // Clear after selection
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Function to create a task object
    const createSingleTask = (childId: string) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      description: newTaskDesc,
      rewardPoints: Number(newTaskPoints),
      rewardMoney: Number(newTaskMoney),
      assignedToId: childId,
      date: new Date().toISOString().split('T')[0],
      status: TaskStatus.TODO,
      createdBy: UserRole.PARENT,
      isRecurring: isRecurring,
      recurringFrequency: isRecurring ? recurringFreq : undefined
    });

    if (selectedChildId === ALL_CHILDREN_ID) {
      // Assign to ALL children
      children.forEach(child => {
        addTask(createSingleTask(child.id));
      });
      alert(`Úkol přidělen všem dětem (${children.length})!`);
    } else {
      // Assign to SINGLE child
      addTask(createSingleTask(selectedChildId));
      alert('Úkol přidělen!');
    }

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsRecurring(false);
  };

  // Active Task Management
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
              recurringFrequency: editTaskIsRecurring ? editTaskRecurringFreq : undefined
          });
          setEditingTask(null);
      }
  };

  const confirmAndDeleteTask = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      // We do not need preventDefault here as these are button types, not links
      if (window.confirm('Opravdu chcete smazat tento úkol?')) {
          deleteTask(taskId);
          return true;
      }
      return false;
  };


  // Child Management Handlers
  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChildName.trim()) {
      addChild(newChildName);
      setNewChildName('');
      setIsAddingChild(false);
    }
  };

  const startEdit = (child: User) => {
    setEditingChildId(child.id);
    setEditName(child.name);
    setEditAvatarUrl(child.avatarUrl || '');
    setEditChildPassword(child.password || '');
  };

  const saveEdit = () => {
    if (editingChildId && editName.trim()) {
      updateChild(editingChildId, editName, editAvatarUrl, editChildPassword || undefined);
      setEditingChildId(null);
    }
  };

  const openPayoutModal = (child: User) => {
    setPayoutConfirmation({
      childId: child.id,
      name: child.name,
      amount: child.balance || 0
    });
  };

  const handleConfirmPayout = () => {
    if (payoutConfirmation) {
      processPayout(payoutConfirmation.childId);
      setPayoutConfirmation(null);
    }
  };

  const handleParentPasswordChange = (e: React.FormEvent) => {
      e.preventDefault();
      if (newParentPassword !== confirmParentPassword) {
          setSettingsMessage('Hesla se neshodují!');
          return;
      }
      if (currentUser) {
          setUserPassword(currentUser.id, newParentPassword);
          setSettingsMessage('Heslo úspěšně změněno.');
          setNewParentPassword('');
          setConfirmParentPassword('');
          setTimeout(() => setSettingsMessage(''), 3000);
      }
  };

  // Allowance Handlers
  const openAllowanceSettings = (child: User) => {
      setAllowanceChildId(child.id);
      if (child.allowanceSettings) {
          setAllowanceAmount(child.allowanceSettings.amount);
          setAllowanceFreq(child.allowanceSettings.frequency);
          setAllowanceDay(child.allowanceSettings.day);
          setAllowanceThreshold(child.allowanceSettings.pointThreshold);
          setAllowanceEnabled(true);
      } else {
          // Defaults
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

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
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
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}
          >
            <Users size={20} /> <span className="hidden md:inline">Přehled dětí</span>
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeTab === 'tasks' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}
          >
            <CalendarDays size={20} /> <span className="hidden md:inline">Správa úkolů</span>
          </button>
          <button 
            onClick={() => setActiveTab('approve')}
            className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors relative ${activeTab === 'approve' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}
          >
            <CheckSquare size={20} /> 
            <span className="hidden md:inline">Ke schválení</span>
            {pendingTasks.length > 0 && (
              <span className="absolute top-3 right-3 md:top-auto md:right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingTasks.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 md:flex-none p-4 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 border-r-4 border-indigo-300' : ''}`}
          >
            <Settings size={20} /> <span className="hidden md:inline">Nastavení</span>
          </button>
        </nav>
        <div className="p-4 mt-auto border-t border-slate-800">
            <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-white">
                <LogOut size={16}/> Odhlásit
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-800">Přehled dětí a financí</h2>
            </div>
            
            {/* Charts */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18}/> Celkové skóre</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getWeeklyStats()}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="points" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                                {getWeeklyStats().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#818CF8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Children Management Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {children.map(child => (
                    <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group flex flex-col justify-between">
                        <div>
                          {/* Header: Avatar + Name/Edit */}
                          <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4 w-full">
                                  <img src={editingChildId === child.id && editAvatarUrl ? editAvatarUrl : child.avatarUrl} className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 flex-shrink-0 object-cover" alt={child.name}/>
                                  <div className="w-full">
                                      {editingChildId === child.id ? (
                                          <div className="flex flex-col gap-2 w-full">
                                              <input 
                                                  autoFocus
                                                  type="text" 
                                                  value={editName} 
                                                  onChange={(e) => setEditName(e.target.value)}
                                                  placeholder="Jméno"
                                                  className="border border-indigo-300 rounded px-2 py-1 text-slate-800 font-bold w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              />
                                              <input 
                                                  type="text" 
                                                  value={editAvatarUrl} 
                                                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                                                  placeholder="URL avatara"
                                                  className="border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 w-full focus:outline-none"
                                              />
                                               <input 
                                                  type="text" 
                                                  value={editChildPassword} 
                                                  onChange={(e) => setEditChildPassword(e.target.value)}
                                                  placeholder="Nové heslo (volitelné)"
                                                  className="border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 w-full focus:outline-none"
                                              />
                                              <div className="flex gap-2 mt-1">
                                                <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded flex items-center gap-1 text-xs font-bold"><Save size={16}/> Uložit</button>
                                                <button onClick={() => setEditingChildId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded flex items-center gap-1 text-xs font-bold"><XCircle size={16}/> Zrušit</button>
                                              </div>
                                          </div>
                                      ) : (
                                          <div>
                                            <h4 className="text-xl font-bold text-slate-800">{child.name}</h4>
                                            <div className="flex gap-2 mt-1 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(child)} className="hover:text-indigo-600 flex items-center gap-1"><Pencil size={12}/> Upravit</button>
                                                <button onClick={() => { if(window.confirm('Opravdu smazat?')) deleteChild(child.id); }} className="hover:text-red-600 flex items-center gap-1"><Trash2 size={12}/> Smazat</button>
                                            </div>
                                          </div>
                                      )}
                                  </div>
                              </div>
                              {/* Allowance Settings Button */}
                              <button onClick={() => openAllowanceSettings(child)} className="text-slate-400 hover:text-pink-500 transition-colors">
                                  <PiggyBank size={20} />
                              </button>
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-indigo-50 p-3 rounded-lg text-center">
                                  <div className="text-xs text-indigo-400 font-semibold uppercase">Body</div>
                                  <div className="text-2xl font-bold text-indigo-700">{child.points}</div>
                              </div>
                              <div className="bg-emerald-50 p-3 rounded-lg text-center">
                                  <div className="text-xs text-emerald-600 font-semibold uppercase">Kasička</div>
                                  <div className="text-2xl font-bold text-emerald-700">{child.balance} Kč</div>
                              </div>
                          </div>
                        </div>

                        {/* Payout Button */}
                        <button 
                          onClick={() => openPayoutModal(child)}
                          disabled={!child.balance || child.balance <= 0}
                          className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        >
                           <Wallet size={16}/> Vyplatit odměnu
                        </button>
                    </div>
                ))}

                {/* Add Child Card */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 min-h-[300px] hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                    {isAddingChild ? (
                         <form onSubmit={handleAddChild} className="w-full flex flex-col items-center gap-4">
                            <h4 className="font-bold text-slate-700">Nové dítě</h4>
                            <input 
                              type="text" 
                              placeholder="Jméno"
                              value={newChildName}
                              onChange={e => setNewChildName(e.target.value)}
                              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                              autoFocus
                            />
                            <div className="flex gap-2 w-full">
                              <button type="button" onClick={() => setIsAddingChild(false)} className="flex-1 py-2 bg-gray-200 rounded-lg text-gray-600 font-medium">Zrušit</button>
                              <button type="submit" className="flex-1 py-2 bg-indigo-600 rounded-lg text-white font-bold">Přidat</button>
                            </div>
                         </form>
                    ) : (
                        <button onClick={() => setIsAddingChild(true)} className="flex flex-col items-center gap-3 text-slate-400 hover:text-indigo-600">
                            <div className="p-4 bg-white rounded-full shadow-sm">
                                <Plus size={32}/>
                            </div>
                            <span className="font-medium">Přidat dítě</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Payout History Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
               <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 gap-2">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18}/> Historie výplat</h3>
                    <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        Celkem vyplaceno: <span className="text-emerald-600 font-bold">{getTotalPayout()} Kč</span>
                    </span>
               </div>
               {payoutHistory.length === 0 ? (
                   <div className="p-8 text-center text-slate-400 text-sm italic">Zatím neproběhly žádné výplaty.</div>
               ) : (
                   <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 font-medium">Datum</th>
                                    <th className="p-4 font-medium">Dítě</th>
                                    <th className="p-4 font-medium text-right">Částka</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payoutHistory.map(record => {
                                    const childName = users.find(u => u.id === record.childId)?.name || 'Neznámé';
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-slate-600 font-mono">{new Date(record.date).toLocaleDateString('cs-CZ')}</td>
                                            <td className="p-4 font-bold text-slate-700 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                    {childName.charAt(0)}
                                                </div>
                                                {childName}
                                            </td>
                                            <td className="p-4 text-right font-bold text-emerald-600">-{record.amount} Kč</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                   </div>
               )}
            </div>
          </div>
        )}

        {/* TASKS MANAGEMENT TAB */}
        {activeTab === 'tasks' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in max-w-6xl mx-auto">
              {/* Left Column: Create Task */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4">Nový úkol</h3>
                      <form onSubmit={handleCreateTask} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Pro koho</label>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                  {/* Select ALL button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedChildId(ALL_CHILDREN_ID)}
                                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${selectedChildId === ALL_CHILDREN_ID ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  >
                                    <Users size={14} /> Všem
                                  </button>

                                  {children.map(child => (
                                      <button
                                          key={child.id}
                                          type="button"
                                          onClick={() => setSelectedChildId(child.id)}
                                          className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedChildId === child.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                      >
                                          {child.name}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Název úkolu</label>
                              <input 
                                type="text" 
                                required
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                                placeholder="např. Vynést koš"
                              />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Popis</label>
                              <textarea 
                                value={newTaskDesc}
                                onChange={e => setNewTaskDesc(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                                rows={2}
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 mb-1">Body</label>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={newTaskPoints}
                                    onChange={e => setNewTaskPoints(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 mb-1">Kč</label>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={newTaskMoney}
                                    onChange={e => setNewTaskMoney(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                  />
                              </div>
                          </div>

                          {/* Recurring Settings */}
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <input 
                                        type="checkbox" 
                                        id="isRecurring"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Repeat size={14} /> Opakovat pravidelně
                                    </label>
                                </div>
                                {isRecurring && (
                                    <div className="flex gap-2 pl-6">
                                        <button 
                                            type="button"
                                            onClick={() => setRecurringFreq('DAILY')}
                                            className={`px-3 py-1 text-xs rounded-full border ${recurringFreq === 'DAILY' ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            Denně
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setRecurringFreq('WEEKLY')}
                                            className={`px-3 py-1 text-xs rounded-full border ${recurringFreq === 'WEEKLY' ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            Týdně
                                        </button>
                                    </div>
                                )}
                          </div>

                          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">
                              {selectedChildId === ALL_CHILDREN_ID ? 'Přidělit všem' : 'Přidělit úkol'}
                          </button>
                      </form>
                  </div>

                  {/* AI Generator */}
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                      <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="text-yellow-300" />
                          <h3 className="font-bold text-lg">AI Inspirace</h3>
                      </div>
                      <p className="text-indigo-100 text-sm mb-4">Nech Gemini vymyslet úkoly na míru.</p>
                      
                      <input 
                          type="text"
                          placeholder="Co dítě baví? (např. Lego, dinosauři)"
                          value={interests}
                          onChange={e => setInterests(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white/20 border border-white/30 placeholder-indigo-200 text-white mb-3 focus:outline-none focus:bg-white/30"
                      />
                      
                      <button 
                          onClick={handleGenerateIdeas}
                          disabled={isGenerating || selectedChildId === ALL_CHILDREN_ID}
                          className="w-full py-2 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 disabled:opacity-70"
                      >
                          {isGenerating ? 'Generuji...' : selectedChildId === ALL_CHILDREN_ID ? 'Vyber konkrétní dítě' : 'Navrhnout úkoly'}
                      </button>

                      {generatedIdeas.length > 0 && (
                          <div className="mt-4 space-y-2">
                              {generatedIdeas.map((idea, idx) => (
                                  <div key={idx} onClick={() => applyIdea(idea)} className="bg-white/10 p-2 rounded hover:bg-white/20 cursor-pointer text-sm border border-white/10">
                                      <div className="font-bold">{idea.title}</div>
                                      <div className="text-xs opacity-80">{idea.suggestedPoints} bodů</div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* Right Column: Active Tasks */}
              <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-slate-800">
                        Aktivní úkoly {selectedChildId !== ALL_CHILDREN_ID && users.find(u => u.id === selectedChildId) ? `(${users.find(u => u.id === selectedChildId)?.name})` : '(Všichni)'}
                     </h3>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="divide-y divide-slate-100">
                          {tasks
                            .filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.REJECTED)
                            .filter(t => selectedChildId === ALL_CHILDREN_ID || t.assignedToId === selectedChildId)
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(task => {
                              const assignedChild = users.find(u => u.id === task.assignedToId);
                              return (
                                  <div key={task.id} className="p-4 hover:bg-slate-50 flex justify-between items-center group">
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${task.status === TaskStatus.REJECTED ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                  {task.status === TaskStatus.REJECTED ? 'Vráceno' : 'Aktivní'}
                                              </span>
                                              {task.isRecurring && (
                                                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                                                      <Repeat size={10} /> {task.recurringFrequency === 'WEEKLY' ? 'Týdně' : 'Denně'}
                                                  </span>
                                              )}
                                              <span className="text-xs text-slate-400">{new Date(task.date).toLocaleDateString('cs-CZ')}</span>
                                              {assignedChild && (
                                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                      <div className="w-3 h-3 bg-indigo-400 rounded-full"></div> {assignedChild.name}
                                                  </span>
                                              )}
                                          </div>
                                          <h4 className="font-bold text-slate-700 mt-1">{task.title}</h4>
                                          <p className="text-sm text-slate-500">{task.description}</p>
                                      </div>
                                      <div className="text-right flex flex-col items-end gap-1">
                                          <div className="font-bold text-indigo-600">{task.rewardPoints} bodů</div>
                                          {task.rewardMoney > 0 && <div className="text-xs font-bold text-emerald-600">+{task.rewardMoney} Kč</div>}
                                          
                                          {/* Action Buttons - Always visible for better UX */}
                                          <div className="flex gap-2 mt-2 transition-opacity">
                                              <button type="button" onClick={() => openEditTaskModal(task)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Upravit">
                                                  <Pencil size={16} />
                                              </button>
                                              <button type="button" onClick={(e) => confirmAndDeleteTask(e, task.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Smazat">
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                          {tasks.filter(t => (t.status === TaskStatus.TODO || t.status === TaskStatus.REJECTED) && (selectedChildId === ALL_CHILDREN_ID || t.assignedToId === selectedChildId)).length === 0 && (
                              <div className="p-8 text-center text-slate-400">Žádné aktivní úkoly{selectedChildId !== ALL_CHILDREN_ID && ' pro vybrané dítě'}.</div>
                          )}
                      </div>
                  </div>
              </div>
           </div>
        )}

        {/* APPROVE TAB */}
        {activeTab === 'approve' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Úkoly ke schválení</h2>
                
                {pendingTasks.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="text-green-500" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Vše zkontrolováno!</h3>
                        <p className="text-slate-500">Žádné úkoly momentálně nečekají na schválení.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingTasks.map(task => {
                            const child = users.find(u => u.id === task.assignedToId);
                            return (
                                <div key={task.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 relative">
                                    {/* Badge for custom tasks */}
                                    {task.createdBy === UserRole.CHILD && (
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Sparkles size={12}/> Vlastní iniciativa
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Delete Button for Pending Tasks */}
                                    <div className="absolute top-4 right-4">
                                         {task.createdBy === UserRole.CHILD ? (
                                             <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Sparkles size={12}/> Vlastní iniciativa
                                             </div>
                                         ) : (
                                             <button type="button" onClick={(e) => confirmAndDeleteTask(e, task.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors" title="Smazat úkol">
                                                 <Trash2 size={16} />
                                             </button>
                                         )}
                                    </div>

                                    {/* Proof Image */}
                                    <div className="w-full md:w-48 h-48 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200">
                                        {task.proofImageUrl ? (
                                            <img src={task.proofImageUrl} alt="Důkaz" className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                <span className="text-xs">Bez fotky</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                {child && (
                                                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                                                        <img src={child.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                                                        {child.name}
                                                    </div>
                                                )}
                                                <span className="text-sm text-slate-400">{new Date(task.date).toLocaleDateString('cs-CZ')}</span>
                                                {task.isRecurring && (
                                                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                                                        <Repeat size={10} /> Opakující se
                                                    </span>
                                                )}
                                            </div>
                                            {task.createdBy !== UserRole.CHILD && (
                                                <div className="text-right pr-8">
                                                    <span className="block font-bold text-indigo-600 text-lg">+{task.rewardPoints} bodů</span>
                                                    {task.rewardMoney > 0 && <span className="block text-sm font-bold text-emerald-600">+{task.rewardMoney} Kč</span>}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-800 mb-2">{task.title}</h3>
                                        <p className="text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg text-sm">{task.description || <em>Bez popisu</em>}</p>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleReject(task.id)}
                                                className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Vrátit k opravě
                                            </button>
                                            <button 
                                                onClick={() => initiateApproval(task)}
                                                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} /> {task.createdBy === UserRole.CHILD ? 'Ohodnotit a Schválit' : 'Schválit splnění'}
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
             <div className="max-w-xl mx-auto animate-fade-in">
                 <h2 className="text-2xl font-bold text-slate-800 mb-6">Nastavení profilu</h2>
                 <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                     <div className="flex items-center gap-4 mb-8">
                        <img src={currentUser.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-indigo-50" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">RODIČ</span>
                        </div>
                     </div>

                     <form onSubmit={handleParentPasswordChange} className="space-y-6">
                         <div className="pt-6 border-t border-slate-100">
                             <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Lock size={18}/> Změna hesla</h4>
                             
                             <div className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-slate-600 mb-1">Nové heslo</label>
                                     <input 
                                        type="password" 
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                                        placeholder="••••••"
                                        value={newParentPassword}
                                        onChange={(e) => setNewParentPassword(e.target.value)}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-slate-600 mb-1">Potvrzení hesla</label>
                                     <input 
                                        type="password" 
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                                        placeholder="••••••"
                                        value={confirmParentPassword}
                                        onChange={(e) => setConfirmParentPassword(e.target.value)}
                                     />
                                 </div>
                             </div>
                         </div>

                         {settingsMessage && (
                             <div className={`p-3 rounded-lg text-sm font-bold text-center ${settingsMessage.includes('úspěšně') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                 {settingsMessage}
                             </div>
                         )}

                         <button 
                            type="submit" 
                            disabled={!newParentPassword || !confirmParentPassword}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             Uložit změny
                         </button>
                     </form>
                 </div>
             </div>
        )}

        {/* Payout Confirmation Modal */}
        {payoutConfirmation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Potvrzení výplaty</h3>
                  <p className="text-slate-500 text-sm">Vyplacení kapesného</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                <p className="text-slate-600 mb-1 text-sm font-medium">Chystáte se vyplatit:</p>
                <div className="flex justify-between items-end mb-4">
                  <span className="font-bold text-slate-800 text-lg">{payoutConfirmation.name}</span>
                  <span className="font-bold text-emerald-600 text-3xl tracking-tight">{payoutConfirmation.amount} Kč</span>
                </div>
                
                <div className="flex items-start gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-xs border border-amber-100">
                   <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>
                   <p>Tato akce vytvoří záznam v historii a <strong>vynuluje aktuální stav kasičky</strong>.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setPayoutConfirmation(null)}
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Zrušit
                </button>
                <button 
                  onClick={handleConfirmPayout}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={20} /> Vyplatit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal for Custom Tasks */}
        {ratingTask && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 border border-slate-100">
                   <div className="flex items-center justify-between mb-6">
                       <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Sparkles className="text-orange-500"/> Ohodnotit úkol</h3>
                       <button onClick={() => setRatingTask(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18} /></button>
                   </div>

                   <div className="mb-6">
                       <div className="text-sm text-gray-500 mb-1">Název úkolu:</div>
                       <div className="font-bold text-lg text-slate-800 mb-2">{ratingTask.title}</div>
                       {ratingTask.proofImageUrl && (
                           <div className="h-32 w-full rounded-lg overflow-hidden border border-slate-200 mb-4">
                               <img src={ratingTask.proofImageUrl} alt="Proof" className="w-full h-full object-cover" />
                           </div>
                       )}
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-6">
                       <div>
                           <label className="block text-sm font-bold text-indigo-600 mb-2 flex items-center gap-1"><Star size={14}/> Body</label>
                           <input 
                             type="number" 
                             min="0"
                             value={ratingPoints}
                             onChange={(e) => setRatingPoints(Number(e.target.value))}
                             className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-lg text-slate-800"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-emerald-600 mb-2 flex items-center gap-1"><Coins size={14}/> Peníze (Kč)</label>
                           <input 
                             type="number" 
                             min="0"
                             value={ratingMoney}
                             onChange={(e) => setRatingMoney(Number(e.target.value))}
                             className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-lg text-slate-800"
                           />
                       </div>
                   </div>

                   <button 
                     onClick={confirmRating}
                     className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                       <Check size={20} /> Potvrdit a připsat
                   </button>
               </div>
           </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 border border-slate-100 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Pencil className="text-indigo-500"/> Upravit úkol</h3>
                        <button onClick={() => setEditingTask(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18} /></button>
                    </div>

                    <div className="space-y-5 mb-6">
                        {/* Section 1: Who and When */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                                    <UserCircle size={14}/> Pro koho
                                </label>
                                <select 
                                    value={editTaskAssignedTo}
                                    onChange={(e) => setEditTaskAssignedTo(e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-slate-50 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    {children.map(child => (
                                        <option key={child.id} value={child.id}>{child.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                                    <Calendar size={14}/> Datum
                                </label>
                                <input 
                                    type="date"
                                    value={editTaskDate}
                                    onChange={(e) => setEditTaskDate(e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-slate-50 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Section 2: What */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Název úkolu</label>
                            <input 
                                type="text" 
                                value={editTaskTitle}
                                onChange={(e) => setEditTaskTitle(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Popis</label>
                            <textarea 
                                value={editTaskDesc}
                                onChange={(e) => setEditTaskDesc(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                                rows={2}
                            />
                        </div>

                        {/* Section 3: Rewards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Star size={14}/> Body</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={editTaskPoints}
                                    onChange={(e) => setEditTaskPoints(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Coins size={14}/> Kč</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={editTaskMoney}
                                    onChange={(e) => setEditTaskMoney(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                />
                            </div>
                        </div>

                        {/* Section 4: Recurrence */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <input 
                                    type="checkbox" 
                                    id="editIsRecurring"
                                    checked={editTaskIsRecurring}
                                    onChange={(e) => setEditTaskIsRecurring(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="editIsRecurring" className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                    <Repeat size={14} /> Opakovat pravidelně
                                </label>
                            </div>
                            {editTaskIsRecurring && (
                                <div className="flex gap-2 pl-6">
                                    <button 
                                        type="button"
                                        onClick={() => setEditTaskRecurringFreq('DAILY')}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${editTaskRecurringFreq === 'DAILY' ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
                                    >
                                        Denně
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setEditTaskRecurringFreq('WEEKLY')}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${editTaskRecurringFreq === 'WEEKLY' ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
                                    >
                                        Týdně
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                         <button 
                            onClick={(e) => {
                                const deleted = confirmAndDeleteTask(e, editingTask.id);
                                if (deleted) {
                                    setEditingTask(null);
                                }
                            }}
                            className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                            title="Smazat úkol"
                         >
                             <Trash2 size={20} />
                         </button>
                        <button 
                            onClick={handleSaveTaskChanges}
                            disabled={!editTaskTitle.trim()}
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={20} /> Uložit změny
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Allowance Settings Modal */}
        {showAllowanceModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><PiggyBank className="text-pink-500"/> Nastavení kapesného</h3>
                        <button onClick={() => setShowAllowanceModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18} /></button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <label className="text-slate-700 font-bold">Povolit pravidelné kapesné</label>
                            <input 
                                type="checkbox"
                                checked={allowanceEnabled}
                                onChange={(e) => setAllowanceEnabled(e.target.checked)}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                        </div>

                        <div className={`space-y-4 transition-opacity ${allowanceEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Částka (Kč)</label>
                                    <input 
                                        type="number"
                                        value={allowanceAmount}
                                        onChange={(e) => setAllowanceAmount(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg text-slate-800 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Frekvence</label>
                                    <select 
                                        value={allowanceFreq}
                                        onChange={(e) => setAllowanceFreq(e.target.value as any)}
                                        className="w-full p-2 border rounded-lg text-slate-800 bg-white"
                                    >
                                        <option value="WEEKLY">Týdně</option>
                                        <option value="MONTHLY">Měsíčně</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    {allowanceFreq === 'WEEKLY' ? 'Den v týdnu (1=Po, 7=Ne)' : 'Den v měsíci (1-31)'}
                                </label>
                                <input 
                                    type="number"
                                    min="1"
                                    max={allowanceFreq === 'WEEKLY' ? 7 : 31}
                                    value={allowanceDay}
                                    onChange={(e) => setAllowanceDay(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                                    <Star size={14} className="text-indigo-500"/> Cíl bodů pro plnou částku
                                </label>
                                <input 
                                    type="number"
                                    value={allowanceThreshold}
                                    onChange={(e) => setAllowanceThreshold(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg text-slate-800"
                                />
                                <p className="text-xs text-slate-400 mt-1">Pokud dítě nasbírá méně bodů, částka se poměrně sníží.</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={saveAllowanceSettings}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                    >
                        Uložit nastavení
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default ParentDashboard;
