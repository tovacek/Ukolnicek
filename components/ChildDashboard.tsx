
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatus, Task, UserRole, Goal } from '../types';
import { CheckCircle2, Star, Coins, LogOut, Clock, Calendar, History, Wallet, X, ArrowRightLeft, Repeat, Trophy, ListTodo, Plus, Sparkles, Settings, Lock, Target, Trash2, Pencil, PiggyBank, RefreshCw, AlertTriangle, Sun, AlertCircle } from 'lucide-react';
import { generateMotivationalMessage } from '../services/geminiService';
import AvatarDisplay from './AvatarDisplay';
import ImageUploader from './ImageUploader';
import ProfilePhotoModal from './ProfilePhotoModal';

const ChildDashboard: React.FC = () => {
  const { currentUser, getTasksForChild, updateTaskStatus, logout, payoutHistory, convertPointsToMoney, addTask, updateUserPin, updateChild, goals, addGoal, updateGoal, deleteGoal, getAllowanceProgress, deleteTask, refreshData, checkAndClaimDailyReward } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [motivation, setMotivation] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Exchange Modal State
  const [showExchange, setShowExchange] = useState(false);
  const [exchangePoints, setExchangePoints] = useState(0);

  // Custom Task Modal State
  const [showCustomTaskModal, setShowCustomTaskModal] = useState(false);
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [customTaskDesc, setCustomTaskDesc] = useState('');
  const [customTaskImage, setCustomTaskImage] = useState<string | null>(null);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');

  // Goal Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState(100);
  const [newGoalImage, setNewGoalImage] = useState<string | null>(null);

  // Daily Reward State
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);

  // Profile Photo Modal
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);

  // Delete Confirmation States
  const [deleteGoalConfirmation, setDeleteGoalConfirmation] = useState<{isOpen: boolean, goalId: string | null}>({ isOpen: false, goalId: null });
  const [deleteTaskConfirmation, setDeleteTaskConfirmation] = useState<{isOpen: boolean, taskId: string | null}>({ isOpen: false, taskId: null });

  // Get ALL tasks for child
  const tasks = currentUser ? getTasksForChild(currentUser.id) : [];
  const childGoals = currentUser ? goals.filter(g => g.childId === currentUser.id) : [];

  // Calculate Daily Progress
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(t => t.date === todayStr);
  const todaysCompleted = todaysTasks.filter(t => t.status === TaskStatus.APPROVED).length;
  const todaysTotal = todaysTasks.length;
  const progressPercentage = todaysTotal > 0 ? (todaysCompleted / todaysTotal) * 100 : 0;

  // Get Allowance Progress
  const allowanceProgress = currentUser ? getAllowanceProgress(currentUser.id) : null;

  // Categorize tasks for Lists
  const todoTasks = tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.REJECTED);
  todoTasks.sort((a, b) => a.date.localeCompare(b.date));
  
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING_APPROVAL);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.APPROVED);
  const doneList = [...pendingTasks, ...completedTasks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    const checkReward = async () => {
        if (currentUser) {
            const received = await checkAndClaimDailyReward(currentUser.id);
            if (received) {
                setShowDailyRewardModal(true);
                triggerCelebration();
            }
        }
    };
    checkReward();
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser && completedTasks.length > 0) {
       generateMotivationalMessage(currentUser.name, completedTasks.length).then(setMotivation);
    }
  }, [currentUser, completedTasks.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const submitTask = () => {
    if (selectedTask) {
      updateTaskStatus(selectedTask.id, TaskStatus.PENDING_APPROVAL, previewImage || undefined);
      setSelectedTask(null);
      setPreviewImage(null);
      triggerCelebration();
    }
  };

  const submitCustomTask = () => {
      if (!currentUser || !customTaskTitle.trim()) return;

      const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          familyId: currentUser.familyId,
          title: customTaskTitle,
          description: customTaskDesc,
          rewardPoints: 0, 
          rewardMoney: 0,
          assignedToId: currentUser.id,
          date: new Date().toISOString().split('T')[0],
          status: TaskStatus.PENDING_APPROVAL,
          proofImageUrl: customTaskImage || undefined,
          createdBy: UserRole.CHILD
      };

      addTask(newTask);
      setShowCustomTaskModal(false);
      setCustomTaskTitle('');
      setCustomTaskDesc('');
      setCustomTaskImage(null);
      triggerCelebration();
  };

  const requestDeleteCustomTask = (taskId: string) => {
      setDeleteTaskConfirmation({ isOpen: true, taskId });
  };

  const confirmDeleteTask = () => {
      if (deleteTaskConfirmation.taskId) {
          deleteTask(deleteTaskConfirmation.taskId);
          setDeleteTaskConfirmation({ isOpen: false, taskId: null });
      }
  };

  const handleExchangeOpen = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      if (currentUser) {
          setExchangePoints(0);
          setShowExchange(true);
      }
  };

  const submitExchange = () => {
      if (currentUser && exchangePoints > 0) {
          convertPointsToMoney(currentUser.id, exchangePoints);
          setShowExchange(false);
          setExchangePoints(0);
          triggerCelebration();
      }
  };

  const handlePinChange = () => {
      if (!newPin || newPin !== confirmPin) {
          setSettingsMessage("PINy se neshodují!");
          return;
      }
      if (newPin.length !== 4) {
          setSettingsMessage("PIN musí mít 4 číslice!");
          return;
      }
      if (currentUser) {
          updateUserPin(currentUser.id, newPin);
          setSettingsMessage("PIN byl uložen!");
          setTimeout(() => {
              setShowSettings(false);
              setNewPin('');
              setConfirmPin('');
              setSettingsMessage('');
          }, 1500);
      }
  };

  const openAddGoalModal = () => {
      setEditingGoalId(null);
      setNewGoalTitle('');
      setNewGoalAmount(100);
      setNewGoalImage(null);
      setShowGoalModal(true);
  };

  const openEditGoalModal = (goal: Goal) => {
      setEditingGoalId(goal.id);
      setNewGoalTitle(goal.title);
      setNewGoalAmount(goal.targetAmount);
      setNewGoalImage(goal.imageUrl || null);
      setShowGoalModal(true);
  };

  const handleSaveGoal = () => {
      if (!currentUser || !newGoalTitle.trim() || newGoalAmount <= 0) return;
      
      if (editingGoalId) {
          updateGoal(editingGoalId, {
              title: newGoalTitle,
              targetAmount: Number(newGoalAmount),
              imageUrl: newGoalImage || undefined
          });
      } else {
          const newGoal: Goal = {
              id: Math.random().toString(36).substr(2, 9),
              familyId: currentUser.familyId,
              childId: currentUser.id,
              title: newGoalTitle,
              targetAmount: Number(newGoalAmount),
              imageUrl: newGoalImage || undefined
          };
          addGoal(newGoal);
          triggerCelebration();
      }
      setShowGoalModal(false);
  };

  const requestDeleteGoal = (e: React.MouseEvent | null, id: string) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setDeleteGoalConfirmation({ isOpen: true, goalId: id });
  };

  const confirmDeleteGoal = () => {
      if (deleteGoalConfirmation.goalId) {
          deleteGoal(deleteGoalConfirmation.goalId);
          setDeleteGoalConfirmation({ isOpen: false, goalId: null });
          setShowGoalModal(false);
      }
  };

  const handleProfilePhotoSave = (newUrl: string) => {
      if (currentUser) {
          updateChild(currentUser.id, currentUser.name, newUrl);
      }
  };

  if (!currentUser) return null;

  const myPayouts = payoutHistory.filter(p => p.childId === currentUser.id);
  
  const historyItems = [
    ...completedTasks.map(t => ({
        id: t.id,
        type: 'TASK',
        title: t.title,
        date: t.date,
        points: t.rewardPoints,
        money: t.rewardMoney
    })),
    ...myPayouts.map(p => ({
        id: p.id,
        type: 'PAYOUT',
        title: 'Výplata odměny',
        date: p.date,
        points: 0,
        money: -p.amount
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const maxExchangeablePoints = Math.floor((currentUser.points || 0) / 10) * 10;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-brand-yellow/30">
      
      {showCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-brand-yellow/20 backdrop-blur-[2px] animate-fade-in"></div>
          <div className="text-6xl animate-bounce delay-100">🎉</div>
          <div className="text-6xl animate-bounce delay-200 absolute top-1/3 left-1/4">⭐</div>
          <div className="text-6xl animate-bounce delay-300 absolute bottom-1/3 right-1/4">💰</div>
          <div className="text-6xl animate-bounce delay-75 absolute top-20 right-20">🎈</div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-b-[3rem] shadow-sm p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-yellow via-brand-red to-brand-blue"></div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="relative group cursor-pointer" onClick={() => setShowProfilePhotoModal(true)}>
                <div className="w-14 h-14 rounded-full border-4 border-brand-yellow bg-gray-100 overflow-hidden">
                    <AvatarDisplay user={currentUser} />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                    <Pencil size={10} className="text-gray-500" />
                </div>
             </div>
             <div>
                 <h1 className="text-xl font-display font-bold text-brand-dark leading-tight">Ahoj, {currentUser.name}!</h1>
                 <p className="text-xs text-gray-500 truncate max-w-[180px]">{motivation || "Jdeme na to!"}</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRefresh} className={`p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-blue-50 hover:text-brand-blue transition-colors ${isRefreshing ? 'animate-spin' : ''}`}>
                <RefreshCw size={20} />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-blue-50 hover:text-brand-blue transition-colors">
                <Settings size={20} />
            </button>
            <button onClick={logout} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div 
            onClick={() => setShowHistory(true)}
            className="w-full bg-brand-dark rounded-2xl p-5 text-white flex justify-around items-center shadow-lg shadow-brand-dark/20 hover:scale-[1.02] active:scale-98 transition-all relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-brand-yellow/10 rounded-full blur-xl"></div>

          <div className="text-center relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-1 text-brand-yellow mb-1">
              <Star fill="currentColor" size={22} />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight">{currentUser.points}</span>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium mb-1">Body</p>
            
            {(currentUser.points || 0) >= 10 && (
                <button 
                    onClick={handleExchangeOpen}
                    className="mt-1 bg-brand-yellow text-brand-dark rounded-full px-2 py-1 text-[10px] font-bold shadow-md hover:bg-white hover:scale-105 transition-all flex items-center gap-1"
                >
                    <Repeat size={10} /> Proměnit
                </button>
            )}
          </div>

          <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent relative z-10"></div>
          
          <div className="text-center relative z-10">
             <div className="flex items-center justify-center gap-1 text-brand-green mb-1">
              <Coins size={22} />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight">{currentUser.balance} <span className="text-lg">Kč</span></span>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium">Kasička</p>
          </div>
          <div className="absolute top-3 right-3 opacity-30">
              <History size={14} />
          </div>
        </div>

        {todaysTotal > 0 && (
          <div className="mt-6">
             <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>Dnešní plán</span>
                <span>{todaysCompleted} / {todaysTotal}</span>
             </div>
             <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-green to-emerald-400 transition-all duration-1000 ease-out rounded-full relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
             </div>
          </div>
        )}
      </div>

      {allowanceProgress && (
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-pink-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                      <h3 className="font-bold text-lg flex items-center gap-2"><PiggyBank size={20}/> Kapesné</h3>
                      <p className="text-pink-100 text-xs">Výplata za {allowanceProgress.daysLeft} dní ({allowanceProgress.nextDate})</p>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                      <span className="font-bold text-xl">{allowanceProgress.projectedAmount}</span>
                      <span className="text-xs ml-1 opacity-80">/ {allowanceProgress.totalAmount} Kč</span>
                  </div>
              </div>

              <div className="relative z-10">
                  <div className="flex justify-between text-xs font-bold text-pink-100 mb-1">
                      <span>{allowanceProgress.earnedPoints} bodů</span>
                      <span>Cíl: {allowanceProgress.pointThreshold}</span>
                  </div>
                  <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                      <div 
                          className="h-full bg-white transition-all duration-1000 ease-out rounded-full"
                          style={{ width: `${Math.min(100, (allowanceProgress.earnedPoints / allowanceProgress.pointThreshold) * 100)}%` }}
                      ></div>
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* Goals */}
      <div className="px-4 mb-6 animate-fade-in">
         <div className="flex justify-between items-center mb-3">
             <h3 className="font-display font-bold text-lg text-brand-dark flex items-center gap-2">
                 <Target className="text-brand-red" size={20} /> Na co šetřím
             </h3>
             <button onClick={openAddGoalModal} className="bg-white p-2 rounded-full text-brand-dark shadow-sm hover:bg-gray-50">
                 <Plus size={18} />
             </button>
         </div>
         
         <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
             {childGoals.length === 0 ? (
                 <div onClick={openAddGoalModal} className="flex-shrink-0 w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-brand-yellow hover:bg-yellow-50/50 transition-colors">
                     <Target size={32} className="mb-2 opacity-50"/>
                     <p className="text-sm font-bold">Přidat nové přání</p>
                 </div>
             ) : (
                 childGoals.map(goal => {
                     const percent = Math.min(100, ((currentUser.balance || 0) / goal.targetAmount) * 100);
                     const isAchieved = (currentUser.balance || 0) >= goal.targetAmount;
                     
                     return (
                         <div key={goal.id} onClick={() => openEditGoalModal(goal)} className="flex-shrink-0 w-48 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative snap-start cursor-pointer hover:shadow-md transition-shadow group">
                             <button type="button" onClick={(e) => requestDeleteGoal(e, goal.id)} className="absolute top-2 right-2 p-3 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-md transition-colors z-20">
                                <Trash2 size={20}/>
                             </button>
                             
                             <div className="h-24 bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                                 {goal.imageUrl ? (
                                     <img src={goal.imageUrl} className="w-full h-full object-cover" alt={goal.title} />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center bg-brand-yellow/10 text-brand-yellow">
                                         <Target size={32} />
                                     </div>
                                 )}
                                 {isAchieved && (
                                     <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center text-white font-bold text-lg animate-pulse">
                                         Splněno!
                                     </div>
                                 )}
                             </div>
                             
                             <h4 className="font-bold text-gray-800 text-sm truncate mb-1">{goal.title}</h4>
                             <div className="flex justify-between text-xs text-gray-500 mb-2">
                                 <span className={isAchieved ? "text-green-600 font-bold" : ""}>{currentUser.balance} Kč</span>
                                 <span>{goal.targetAmount} Kč</span>
                             </div>
                             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${isAchieved ? 'bg-green-500' : 'bg-brand-yellow'}`} style={{ width: `${percent}%` }}></div>
                             </div>
                         </div>
                     );
                 })
             )}
         </div>
      </div>

      {/* Task Tabs */}
      <div className="px-4 mb-24">
         <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl flex shadow-sm mb-4 border border-white sticky top-4 z-10">
             <button 
                onClick={() => setActiveTab('todo')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'todo' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
             >
                Moje úkoly ({todoTasks.length})
             </button>
             <button 
                onClick={() => setActiveTab('done')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'done' ? 'bg-brand-green text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
             >
                Hotovo ({doneList.length})
             </button>
         </div>

         <div className="space-y-4">
             {activeTab === 'todo' && (
                 <>
                    {todoTasks.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                           <Sun size={48} className="mx-auto mb-4 text-brand-yellow opacity-50" />
                           <p className="font-bold text-lg">Všechno hotovo!</p>
                           <p className="text-sm">Užívej si volno nebo si přidej vlastní úkol.</p>
                        </div>
                    ) : (
                        todoTasks.map(task => {
                            const isFuture = task.date > todayStr;
                            return (
                                <div key={task.id} onClick={!isFuture ? () => setSelectedTask(task) : undefined} className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all flex gap-4 ${isFuture ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <div className={`w-3 h-auto rounded-full ${task.status === TaskStatus.REJECTED ? 'bg-red-500' : isFuture ? 'bg-gray-300' : 'bg-brand-blue'}`}></div>
                                    <div className="flex-1 py-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                {isFuture ? <Lock size={12}/> : <Calendar size={12}/>} 
                                                {new Date(task.date).toLocaleDateString('cs-CZ')}
                                            </span>
                                            <div className="flex gap-2">
                                                 <span className="text-xs font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full">+{task.rewardPoints}b</span>
                                                 {task.rewardMoney > 0 && <span className="text-xs font-bold text-brand-green bg-green-50 px-2 py-0.5 rounded-full">+{task.rewardMoney} Kč</span>}
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1">{task.title}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                                        {task.status === TaskStatus.REJECTED && (
                                            <div className="mt-2 bg-red-50 text-red-600 text-xs p-2 rounded-lg font-medium flex items-center gap-2">
                                                <AlertCircle size={14}/> {task.feedback}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    
                    <button onClick={() => setShowCustomTaskModal(true)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-white hover:border-brand-yellow hover:text-brand-yellow transition-all mt-6">
                        <Sparkles size={20} /> Udělal jsem něco navíc!
                    </button>
                 </>
             )}

             {activeTab === 'done' && (
                 doneList.length === 0 ? (
                     <div className="text-center py-10 text-gray-400">Zatím nic splněno.</div>
                 ) : (
                     doneList.map(task => (
                         <div key={task.id} className="bg-white/60 rounded-2xl p-4 border border-gray-100 flex gap-4 opacity-80 relative">
                             {task.status === TaskStatus.PENDING_APPROVAL && task.createdBy === UserRole.CHILD && (
                                 <button onClick={() => requestDeleteCustomTask(task.id)} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 z-10"><Trash2 size={16}/></button>
                             )}
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === TaskStatus.APPROVED ? 'bg-green-100 text-brand-green' : 'bg-yellow-100 text-brand-yellow'}`}>
                                 {task.status === TaskStatus.APPROVED ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                             </div>
                             <div className="py-1">
                                 <h4 className="font-bold text-gray-700 line-through decoration-gray-300 decoration-2">{task.title}</h4>
                                 <p className="text-xs font-bold text-gray-400 uppercase mt-1">
                                     {task.status === TaskStatus.APPROVED ? 'Schváleno' : 'Čeká na rodiče'}
                                 </p>
                             </div>
                         </div>
                     ))
                 )
             )}
         </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-start mb-6">
              <div>
                  <h2 className="text-2xl font-display font-bold text-brand-dark mb-1">{selectedTask.title}</h2>
                  <div className="flex gap-2">
                      <span className="text-sm font-bold text-brand-blue bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1"><Star size={14} fill="currentColor"/> {selectedTask.rewardPoints} bodů</span>
                      {selectedTask.rewardMoney > 0 && <span className="text-sm font-bold text-brand-green bg-green-50 px-3 py-1 rounded-full flex items-center gap-1"><Coins size={14}/> {selectedTask.rewardMoney} Kč</span>}
                  </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                <p className="text-gray-700 leading-relaxed">{selectedTask.description || "Tento úkol nemá popis."}</p>
                {selectedTask.feedback && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-bold text-red-500 uppercase mb-1">Poznámka od rodiče:</p>
                        <p className="text-sm text-red-600 italic">"{selectedTask.feedback}"</p>
                    </div>
                )}
            </div>

            <div className="mb-6">
               <ImageUploader 
                  onImageSelected={setPreviewImage} 
                  label="Vyfoť důkaz (nepovinné)"
               />
            </div>

            <button 
                onClick={submitTask} 
                className="w-full py-4 bg-brand-green text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-200 hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <CheckCircle2 size={24} /> Splněno!
            </button>
          </div>
        </div>
      )}

      {/* Custom Task Modal */}
      {showCustomTaskModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-brand-dark">Můj vlastní úkol</h3>
                      <button onClick={() => setShowCustomTaskModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-1">Co jsi udělal/a?</label>
                          <input type="text" value={customTaskTitle} onChange={(e) => setCustomTaskTitle(e.target.value)} placeholder="např. Uklidil jsem si hračky" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-bold text-gray-900"/>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-1">Popis (volitelné)</label>
                          <textarea value={customTaskDesc} onChange={(e) => setCustomTaskDesc(e.target.value)} placeholder="Detaily..." className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-gray-900" rows={2}/>
                      </div>
                      <ImageUploader 
                          onImageSelected={setCustomTaskImage} 
                          label="Fotka (doporučeno)"
                      />
                  </div>

                  <button 
                      onClick={submitCustomTask}
                      disabled={!customTaskTitle.trim()}
                      className="w-full py-4 bg-brand-blue text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                      Odeslat ke schválení
                  </button>
              </div>
          </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-brand-dark">{editingGoalId ? 'Upravit přání' : 'Nové přání'}</h3>
                      <button onClick={() => setShowGoalModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>

                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-1">Co si přeješ?</label>
                          <input type="text" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="např. Lego Star Wars" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-bold text-gray-900"/>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-1">Kolik to stojí (Kč)?</label>
                          <input type="number" min="1" value={newGoalAmount} onChange={(e) => setNewGoalAmount(Number(e.target.value))} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-bold text-gray-900"/>
                      </div>
                      <div className="mb-2">
                         <label className="block text-sm font-bold text-gray-500 mb-1">Obrázek přání</label>
                         <input type="text" value={newGoalImage || ''} onChange={(e) => setNewGoalImage(e.target.value)} placeholder="URL obrázku (volitelné)" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 mb-2"/>
                         {newGoalImage && <div className="h-32 rounded-xl overflow-hidden bg-gray-100"><img src={newGoalImage} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')}/></div>}
                      </div>
                  </div>

                  <div className="flex gap-3">
                      {editingGoalId && (
                           <button onClick={(e) => requestDeleteGoal(e, editingGoalId)} className="p-4 bg-red-50 text-red-500 rounded-xl font-bold border border-red-100 hover:bg-red-100"><Trash2 size={24}/></button>
                      )}
                      <button onClick={handleSaveGoal} disabled={!newGoalTitle.trim() || newGoalAmount <= 0} className="flex-1 py-4 bg-brand-yellow text-brand-dark font-bold text-lg rounded-2xl shadow-lg hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50">
                          {editingGoalId ? 'Uložit změny' : 'Přidat přání'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* History Modal */}
      {showHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-scale-in h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2"><History/> Historie</h3>
                      <button onClick={() => setShowHistory(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {historyItems.length === 0 ? (
                          <div className="text-center text-gray-400 py-10">Zatím prázdno...</div>
                      ) : (
                          historyItems.map((item, idx) => (
                              <div key={`${item.id}-${idx}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                  <div>
                                      <div className="font-bold text-gray-800 text-sm">{item.title}</div>
                                      <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('cs-CZ')}</div>
                                  </div>
                                  <div className="text-right">
                                      {item.points !== 0 && <div className="font-bold text-brand-blue text-sm">+{item.points}b</div>}
                                      {item.money !== 0 && <div className={`font-bold text-sm ${item.money > 0 ? 'text-brand-green' : 'text-gray-500'}`}>{item.money > 0 ? '+' : ''}{item.money} Kč</div>}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Exchange Modal */}
      {showExchange && currentUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2"><Repeat/> Směnárna</h3>
                      <button onClick={() => setShowExchange(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>

                  <div className="flex items-center justify-between mb-8 px-4">
                      <div className="text-center"><div className="text-4xl mb-2">⭐</div><div className="font-bold text-gray-600">Body</div></div>
                      <div className="text-gray-300"><ArrowRightLeft size={32}/></div>
                      <div className="text-center"><div className="text-4xl mb-2">💰</div><div className="font-bold text-gray-600">Peníze</div></div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl text-center mb-6">
                      <p className="text-sm text-blue-800 font-bold mb-1">Kurz: 10 bodů = 1 Kč</p>
                      <p className="text-xs text-blue-600">Můžeš směnit max {maxExchangeablePoints} bodů</p>
                  </div>

                  <div className="mb-8">
                      <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                          <span>0</span>
                          <span className="text-brand-blue">{exchangePoints} bodů</span>
                          <span>{maxExchangeablePoints}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={maxExchangeablePoints} 
                        step="10" 
                        value={exchangePoints} 
                        onChange={(e) => setExchangePoints(Number(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                      />
                      <div className="mt-4 text-center">
                          <span className="text-gray-500">Dostaneš:</span>
                          <span className="block text-3xl font-bold text-brand-green">{exchangePoints / 10} Kč</span>
                      </div>
                  </div>

                  <button 
                      onClick={submitExchange}
                      disabled={exchangePoints === 0}
                      className="w-full py-4 bg-brand-dark text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                  >
                      Proměnit body
                  </button>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2"><Settings/> Nastavení</h3>
                      <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>

                  <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 border-b pb-2">Změnit PIN</h4>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Nový PIN (4 čísla)</label>
                          <input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-center tracking-widest font-bold text-gray-900" placeholder="####" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Potvrdit PIN</label>
                          <input type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-center tracking-widest font-bold text-gray-900" placeholder="####" />
                      </div>
                      {settingsMessage && <p className={`text-center text-sm font-bold ${settingsMessage.includes('!') ? 'text-green-500' : 'text-red-500'}`}>{settingsMessage}</p>}
                      
                      <button onClick={handlePinChange} className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl shadow-md hover:bg-blue-600">Uložit PIN</button>
                  </div>
              </div>
          </div>
      )}

      {/* Daily Reward Modal */}
      {showDailyRewardModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-scale-in text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/50 to-transparent pointer-events-none"></div>
                  <div className="relative z-10">
                      <div className="text-6xl mb-4 animate-bounce">🎁</div>
                      <h2 className="text-2xl font-display font-bold text-brand-dark mb-2">Vítej zpět!</h2>
                      <p className="text-gray-600 mb-6">Tady je tvá denní odměna za přihlášení.</p>
                      <div className="text-4xl font-bold text-brand-yellow drop-shadow-sm mb-8">+10 Bodů</div>
                      <button onClick={() => setShowDailyRewardModal(false)} className="w-full py-3 bg-brand-yellow text-brand-dark font-bold rounded-xl shadow-lg hover:bg-yellow-400 transition-all active:scale-95">Děkuju!</button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Goal Confirmation Modal */}
      {deleteGoalConfirmation.isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in border border-red-100">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Smazat přání?</h3>
                        <p className="text-gray-500 mt-2 text-sm">Opravdu chceš toto přání smazat?</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteGoalConfirmation({ isOpen: false, goalId: null })}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Ne
                        </button>
                        <button 
                            onClick={confirmDeleteGoal}
                            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                        >
                            Ano
                        </button>
                    </div>
                </div>
            </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {deleteTaskConfirmation.isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in border border-red-100">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Smazat úkol?</h3>
                        <p className="text-gray-500 mt-2 text-sm">Chceš tento úkol odstranit?</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteTaskConfirmation({ isOpen: false, taskId: null })}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Nechat
                        </button>
                        <button 
                            onClick={confirmDeleteTask}
                            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                        >
                            Smazat
                        </button>
                    </div>
                </div>
            </div>
      )}

      {/* Profile Photo Modal */}
      {showProfilePhotoModal && currentUser && (
          <ProfilePhotoModal 
              user={currentUser}
              onSave={handleProfilePhotoSave}
              onClose={() => setShowProfilePhotoModal(false)}
          />
      )}

    </div>
  );
};

export default ChildDashboard;
