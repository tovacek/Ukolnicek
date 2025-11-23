
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatus, Task, UserRole, Goal, AvatarConfig } from '../types';
import { CheckCircle2, Camera, Star, Coins, LogOut, Clock, Calendar, History, Wallet, X, ArrowRightLeft, Repeat, Trophy, ListTodo, Plus, Sparkles, Settings, Lock, Target, Trash2, Pencil, PiggyBank, RefreshCw, AlertTriangle, Image as ImageIcon, Sun } from 'lucide-react';
import { generateMotivationalMessage } from '../services/geminiService';
import AvatarEditor from './AvatarEditor';
import AvatarDisplay from './AvatarDisplay';

// --- Helper Component for Camera/Gallery ---
const ImageUploader: React.FC<{
    onImageSelected: (base64: string | null) => void;
    initialImage?: string | null;
    label?: string;
}> = ({ onImageSelected, initialImage, label = "Fotka" }) => {
    const [image, setImage] = useState<string | null>(initialImage || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Sync if parent changes initialImage
    useEffect(() => {
        setImage(initialImage || null);
    }, [initialImage]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer rear camera on mobile
            });
            streamRef.current = stream;
            setIsCameraOpen(true);
            // Wait slightly for modal/dom to be ready
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error(err);
            alert("Nelze spustit kameru. Zkontrolujte, zda jste aplikaci povolili přístup k fotoaparátu v nastavení prohlížeče.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg', 0.7); // Compress slightly
                setImage(base64);
                onImageSelected(base64);
                stopCamera();
            }
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                setImage(res);
                onImageSelected(res);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setImage(null);
        onImageSelected(null);
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    return (
        <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>

            {isCameraOpen ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute bottom-4 flex gap-6 items-center z-10">
                        <button type="button" onClick={stopCamera} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                            <X size={24} />
                        </button>
                        <button type="button" onClick={takePhoto} className="p-1 bg-white rounded-full border-4 border-white/30 shadow-lg active:scale-95 transition-transform">
                            <div className="w-14 h-14 bg-red-500 rounded-full border-2 border-white"></div>
                        </button>
                    </div>
                </div>
            ) : image ? (
                 <div className="relative rounded-2xl overflow-hidden aspect-video border-2 border-brand-green bg-green-50 shadow-sm group">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    <button type="button" onClick={clearImage} className="absolute top-2 right-2 p-2 bg-white rounded-full text-red-500 shadow-md hover:bg-red-50 transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-blue-50 hover:border-brand-blue transition-colors gap-2 text-gray-500 hover:text-brand-blue h-32"
                    >
                        <div className="p-3 bg-blue-50 rounded-full text-brand-blue mb-1">
                            <Camera size={24} />
                        </div>
                        <span className="font-bold text-sm">Vyfotit</span>
                    </button>

                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-green-50 hover:border-brand-green transition-colors gap-2 text-gray-500 hover:text-brand-green cursor-pointer h-32 relative">
                        <div className="p-3 bg-green-50 rounded-full text-brand-green mb-1">
                             <ImageIcon size={24} />
                        </div>
                        <span className="font-bold text-sm">Galerie</span>
                        <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                </div>
            )}
        </div>
    );
};

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

  // Avatar Editor State
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

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
  // Sort: Today/Past tasks first (priority), then Future tasks
  todoTasks.sort((a, b) => a.date.localeCompare(b.date));
  
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING_APPROVAL);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.APPROVED);

  // Combined "Done" list for the second tab
  const doneList = [...pendingTasks, ...completedTasks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Check for Daily Reward on Mount
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
  }, [currentUser?.id]); // Only run when user changes (login)

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

  // Trigger celebration
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
          rewardPoints: 0, // Will be set by parent
          rewardMoney: 0, // Will be set by parent
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
          // Update existing
          updateGoal(editingGoalId, {
              title: newGoalTitle,
              targetAmount: Number(newGoalAmount),
              imageUrl: newGoalImage || undefined
          });
      } else {
          // Create new
          const newGoal: Goal = {
              id: Math.random().toString(36).substr(2, 9),
              familyId: currentUser.familyId,
              childId: currentUser.id,
              title: newGoalTitle,
              targetAmount: Number(newGoalAmount),
              imageUrl: newGoalImage || undefined
          };
          addGoal(newGoal);
          triggerCelebration(); // Celebrate only on new goal creation
      }
      
      setShowGoalModal(false);
      setNewGoalTitle('');
      setNewGoalAmount(100);
      setNewGoalImage(null);
      setEditingGoalId(null);
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
          setShowGoalModal(false); // Close edit modal if open
      }
  };

  const handleAvatarSave = (config: AvatarConfig) => {
    if (currentUser) {
        // We pass empty string as avatarUrl because we now use config primarily
        updateChild(currentUser.id, currentUser.name, currentUser.avatarUrl, undefined, config);
        setShowAvatarEditor(false);
    }
  };

  if (!currentUser) return null;

  // Prepare History Data
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
      
      {/* Celebration Overlay */}
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
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="relative group cursor-pointer" onClick={() => setShowAvatarEditor(true)}>
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

        {/* Stats Card (Clickable) */}
        <div 
            onClick={() => setShowHistory(true)}
            className="w-full bg-brand-dark rounded-2xl p-5 text-white flex justify-around items-center shadow-lg shadow-brand-dark/20 hover:scale-[1.02] active:scale-98 transition-all relative overflow-hidden group cursor-pointer"
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-brand-yellow/10 rounded-full blur-xl"></div>

          {/* Points Section */}
          <div className="text-center relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-1 text-brand-yellow mb-1">
              <Star fill="currentColor" size={22} />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight">{currentUser.points}</span>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium mb-1">Body</p>
            
            {/* Exchange Button - Always Visible now */}
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
          
          {/* Money Section */}
          <div className="text-center relative z-10">
             <div className="flex items-center justify-center gap-1 text-brand-green mb-1">
              <Coins size={22} />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight">{currentUser.balance} <span className="text-lg">Kč</span></span>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium">Kasička</p>
          </div>
          
          {/* History indicator */}
          <div className="absolute top-3 right-3 opacity-30">
              <History size={14} />
          </div>
        </div>

        {/* Daily Progress */}
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

      {/* Allowance Widget */}
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
                  <p className="text-xs mt-2 text-pink-100 font-medium">
                      {allowanceProgress.earnedPoints >= allowanceProgress.pointThreshold 
                          ? "🎉 Skvělé! Máš nárok na plné kapesné." 
                          : `Získej ještě ${allowanceProgress.pointThreshold - allowanceProgress.earnedPoints} bodů pro plnou částku.`}
                  </p>
              </div>
          </div>
        </div>
      )}

      {/* Savings Goals Section */}
      <div className="px-4 mb-6 animate-fade-in">
         <div className="flex justify-between items-center mb-3">
             <h3 className="font-display font-bold text-lg text-brand-dark flex items-center gap-2">
                 <Target className="text-brand-red" size={20} /> Na co šetřím
             </h3>
             <button 
                onClick={openAddGoalModal}
                className="bg-white p-2 rounded-full text-brand-dark shadow-sm hover:bg-gray-50"
             >
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
                             <button 
                                type="button"
                                onClick={(e) => requestDeleteGoal(e, goal.id)} 
                                className="absolute top-2 right-2 p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-md transition-colors z-20"
                                title="Smazat"
                             >
                                <Trash2 size={18}/>
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
                                 <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isAchieved ? 'bg-green-500' : 'bg-brand-yellow'}`} 
                                    style={{ width: `${percent}%` }}
                                 ></div>
                             </div>
                         </div>
                     );
                 })
             )}
         </div>
      </div>

      {/* Add Custom Task Button */}
      <div className="px-4 mb-6">
          <button 
            onClick={() => setShowCustomTaskModal(true)}
            className="w-full py-3 bg-gradient-to-r from-brand-yellow to-orange-400 rounded-xl shadow-lg shadow-brand-yellow/20 text-brand-dark font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
              <Sparkles size={20} className="animate-pulse" />
              Udělal jsem něco navíc!
          </button>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex p-1 bg-gray-200/50 rounded-xl">
           <button 
              onClick={() => setActiveTab('todo')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'todo' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
           >
              <ListTodo size={16} />
              Moje úkoly
              {todoTasks.length > 0 && (
                 <span className="bg-brand-red text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {todoTasks.length}
                 </span>
              )}
           </button>
           <button 
              onClick={() => setActiveTab('done')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'done' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
           >
              <CheckCircle2 size={16} />
              Hotovo
           </button>
        </div>
      </div>

      {/* Task Lists */}
      <div className="px-4 space-y-4 animate-slide-up">

        {/* Active Tasks Tab */}
        {activeTab === 'todo' && (
          <div className="space-y-3">
            {todoTasks.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-4xl">
                    🎉
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Všechno hotovo!</h3>
                <p className="text-gray-500 text-sm">Užij si volno nebo požádej rodiče o další úkoly.</p>
              </div>
            ) : (
              todoTasks.map(task => {
                const isFuture = task.date > todayStr;
                return (
                  <button 
                    key={task.id} 
                    disabled={isFuture}
                    onClick={() => { if (!isFuture) { setSelectedTask(task); setPreviewImage(null); } }}
                    className={`w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-transform group ${isFuture ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'active:scale-[0.98]'}`}
                  >
                    {task.status === TaskStatus.REJECTED && (
                        <div className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded absolute top-3 right-3 flex items-center gap-1">
                            <X size={10} strokeWidth={3} /> Opravit
                        </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="pr-16">
                        <div className="flex items-center gap-2 mb-1">
                           {isFuture ? (
                               <div className="text-gray-400 bg-gray-100 rounded-full p-0.5"><Lock size={12} /></div>
                           ) : task.status === TaskStatus.REJECTED ? (
                               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                           ) : (
                               <div className="w-2 h-2 bg-brand-blue rounded-full"></div>
                           )}
                           <span className={`text-xs flex items-center gap-1 ${isFuture ? 'text-orange-600 font-bold bg-orange-50 px-1.5 rounded' : 'text-gray-400'}`}>
                              <Calendar size={10}/> {new Date(task.date).toLocaleDateString('cs-CZ')}
                           </span>
                        </div>
                        <h3 className={`font-bold text-lg transition-colors leading-snug ${isFuture ? 'text-gray-500' : 'text-gray-800 group-hover:text-brand-blue'}`}>
                            {task.title}
                        </h3>
                      </div>
                      
                      <div className={`absolute bottom-4 right-4 flex flex-col items-end gap-1 ${isFuture ? 'opacity-50' : ''}`}>
                        <div className="bg-brand-yellow/10 text-brand-dark font-bold px-3 py-1.5 rounded-xl text-sm border border-brand-yellow/20">
                            +{task.rewardPoints} ★
                        </div>
                        {task.rewardMoney > 0 && (
                            <div className="text-xs font-bold text-brand-green bg-green-50 px-2 py-0.5 rounded-md">
                                +{task.rewardMoney} Kč
                            </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Done Tab */}
        {activeTab === 'done' && (
           <div className="space-y-3">
               {doneList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                      <Clock size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Zatím žádná historie.</p>
                  </div>
               ) : (
                   doneList.map(task => (
                    <div key={task.id} className={`p-4 rounded-2xl border flex justify-between items-center ${task.status === TaskStatus.APPROVED ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-100 opacity-75'}`}>
                      <div className="flex-1">
                        <h3 className={`font-bold ${task.status === TaskStatus.APPROVED ? 'text-green-900' : 'text-gray-700'}`}>{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                           {task.status === TaskStatus.APPROVED ? (
                               <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> Schváleno</span>
                           ) : (
                               <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Clock size={12}/> Čeká na rodiče</span>
                           )}
                           {task.createdBy === UserRole.CHILD && (
                               <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                   <Sparkles size={10}/> Vlastní
                               </span>
                           )}
                           <span className="text-xs text-gray-400">• {new Date(task.date).toLocaleDateString('cs-CZ')}</span>
                        </div>
                      </div>
                      
                      <div className="text-right flex items-center gap-3">
                        <div>
                            <div className="font-bold text-gray-400 text-sm">
                                {task.rewardPoints > 0 ? `+${task.rewardPoints} ★` : '---'}
                            </div>
                            {task.rewardMoney > 0 && <div className="text-xs font-bold text-green-600">+{task.rewardMoney} Kč</div>}
                        </div>
                        
                        {/* Child can delete their pending custom tasks */}
                        {task.status === TaskStatus.PENDING_APPROVAL && task.createdBy === UserRole.CHILD && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); requestDeleteCustomTask(task.id); }} 
                                className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                      </div>
                    </div>
                   ))
               )}
           </div>
        )}
      </div>

      {/* Task Detail Modal (for Standard Tasks) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="text-center mb-6">
                <div className="inline-block p-3 bg-brand-yellow/20 rounded-full mb-4">
                   <Star className="text-brand-dark w-8 h-8 fill-current" />
                </div>
                <h3 className="text-2xl font-display font-bold text-brand-dark mb-2 leading-tight">{selectedTask.title}</h3>
                
                <div className="flex justify-center gap-3 mb-6">
                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold border border-gray-200">+{selectedTask.rewardPoints} bodů</span>
                    {selectedTask.rewardMoney > 0 && (
                        <span className="bg-green-50 text-brand-green px-4 py-1.5 rounded-full text-sm font-bold border border-green-100">+{selectedTask.rewardMoney} Kč</span>
                    )}
                </div>

                <p className="text-gray-600 bg-slate-50 p-5 rounded-2xl text-sm text-left mb-4 border border-slate-100 leading-relaxed">
                    {selectedTask.description || "Bez popisu."}
                </p>
                
                {selectedTask.feedback && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-left border border-red-100 flex gap-3 items-start">
                        <XCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <div>
                            <strong className="block mb-1 text-red-700">Co opravit:</strong>
                            {selectedTask.feedback}
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 pt-6">
                <ImageUploader 
                    onImageSelected={setPreviewImage} 
                    initialImage={previewImage} 
                    label="Fotka hotového úkolu (nepovinné)" 
                />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedTask(null); setPreviewImage(null); }}
                className="flex-1 py-3.5 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Zavřít
              </button>
              <button
                onClick={submitTask}
                className="flex-[2] py-3.5 font-bold text-white bg-brand-green rounded-xl shadow-lg shadow-brand-green/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <CheckCircle2 /> Splnit úkol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reward Modal */}
      {showDailyRewardModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl animate-scale-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-yellow to-orange-400"></div>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-2xl"></div>
                  
                  <div className="inline-block p-4 bg-yellow-100 rounded-full text-brand-yellow mb-4 animate-bounce">
                      <Sun size={48} fill="currentColor" />
                  </div>
                  
                  <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">Vítej zpět!</h2>
                  <p className="text-slate-500 mb-6">Tady je tvá denní odměna za přihlášení.</p>
                  
                  <div className="bg-gradient-to-br from-brand-yellow to-orange-400 text-white rounded-2xl p-6 mb-8 shadow-lg transform rotate-2">
                      <div className="text-4xl font-bold font-display flex items-center justify-center gap-2">
                          +10 <Star fill="currentColor" size={32}/>
                      </div>
                      <div className="text-xs uppercase font-bold tracking-widest opacity-80 mt-1">Bodů</div>
                  </div>

                  <button 
                    onClick={() => setShowDailyRewardModal(false)}
                    className="w-full py-3.5 bg-brand-dark text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                  >
                      Paráda, beru to!
                  </button>
              </div>
          </div>
      )}

      {/* Custom Task Modal */}
      {showCustomTaskModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2"><Sparkles className="text-brand-yellow"/> Mám hotovo navíc</h3>
                    <button onClick={() => setShowCustomTaskModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} className="text-gray-500"/></button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Co jsi udělal?</label>
                        <input 
                            type="text" 
                            placeholder="např. Vyskládal jsem myčku"
                            value={customTaskTitle}
                            onChange={(e) => setCustomTaskTitle(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Popis (volitelné)</label>
                        <textarea 
                            placeholder="Kratký popis..."
                            value={customTaskDesc}
                            onChange={(e) => setCustomTaskDesc(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow h-20 text-gray-900"
                        />
                    </div>
                    <div>
                         <ImageUploader 
                            onImageSelected={setCustomTaskImage} 
                            initialImage={customTaskImage} 
                            label="Důkaz (fotka)" 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={submitCustomTask}
                    disabled={!customTaskTitle.trim()}
                    className="w-full py-3.5 bg-brand-dark text-white font-bold rounded-xl shadow-lg shadow-brand-dark/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <CheckCircle2 /> Odeslat ke schválení
                </button>
            </div>
          </div>
      )}

       {/* Add/Edit Goal Modal */}
       {showGoalModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                        <Target className="text-brand-red"/> 
                        {editingGoalId ? 'Upravit přání' : 'Nové přání'}
                    </h3>
                    <button onClick={() => setShowGoalModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} className="text-gray-500"/></button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Co si přeješ?</label>
                        <input 
                            type="text" 
                            placeholder="např. Nové Lego"
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Cena (Kč)</label>
                        <input 
                            type="number" 
                            min="1"
                            placeholder="100"
                            value={newGoalAmount}
                            onChange={(e) => setNewGoalAmount(Number(e.target.value))}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow font-bold text-lg text-gray-900"
                        />
                    </div>
                    <div>
                        <ImageUploader 
                            onImageSelected={setNewGoalImage} 
                            initialImage={newGoalImage} 
                            label="Obrázek přání (volitelné)" 
                        />
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {editingGoalId && (
                        <button 
                            onClick={(e) => requestDeleteGoal(e, editingGoalId)}
                            className="p-3.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                            title="Smazat přání"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button 
                        onClick={handleSaveGoal}
                        disabled={!newGoalTitle.trim() || newGoalAmount <= 0}
                        className="flex-1 py-3.5 bg-brand-dark text-white font-bold rounded-xl shadow-lg shadow-brand-dark/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {editingGoalId ? <Pencil size={20}/> : <Plus size={20} />} 
                        {editingGoalId ? 'Uložit změny' : 'Přidat do seznamu'}
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Goal Delete Confirmation Modal */}
      {deleteGoalConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in border border-red-100">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Smazat toto přání?</h3>
                      <p className="text-gray-500 mt-2 text-sm">Tato akce je nevratná.</p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setDeleteGoalConfirmation({ isOpen: false, goalId: null })}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                          Ne, nechat
                      </button>
                      <button 
                          onClick={confirmDeleteGoal}
                          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                      >
                          Ano, smazat
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Task Delete Confirmation Modal */}
      {deleteTaskConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in border border-red-100">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Smazat tento úkol?</h3>
                      <p className="text-gray-500 mt-2 text-sm">Úkol bude trvale odstraněn.</p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setDeleteTaskConfirmation({ isOpen: false, taskId: null })}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                          Ne, nechat
                      </button>
                      <button 
                          onClick={confirmDeleteTask}
                          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                      >
                          Ano, smazat
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Exchange Modal */}
      {showExchange && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-slide-up shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h3 className="text-xl font-bold text-brand-dark">Proměnit body</h3>
                          <p className="text-sm text-gray-500">Kurz: 10 bodů = 1 Kč</p>
                      </div>
                      <button onClick={() => setShowExchange(false)} className="p-2 hover:bg-gray-100 rounded-full">
                          <X size={20} className="text-gray-400"/>
                      </button>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-6 mb-6 text-center relative overflow-hidden border border-gray-200">
                      <div className="flex items-center justify-center gap-6 mb-6">
                          <div className="text-brand-dark flex flex-col items-center">
                              <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-2 text-brand-dark">
                                <Star size={24} fill="currentColor"/>
                              </div>
                              <div className="font-bold text-3xl font-display">{exchangePoints}</div>
                              <div className="text-xs font-bold text-gray-400 uppercase">bodů</div>
                          </div>
                          <div className="text-gray-300">
                             <ArrowRightLeft size={24} />
                          </div>
                          <div className="text-brand-green flex flex-col items-center">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 text-brand-green">
                                <Coins size={24}/>
                              </div>
                              <div className="font-bold text-3xl font-display">{exchangePoints / 10} Kč</div>
                              <div className="text-xs font-bold text-gray-400 uppercase">do kasičky</div>
                          </div>
                      </div>
                      
                      <div className="px-2">
                        <input 
                            type="range" 
                            min="0" 
                            max={maxExchangeablePoints} 
                            step="10" 
                            value={exchangePoints}
                            onChange={(e) => setExchangePoints(Number(e.target.value))}
                            className="w-full accent-brand-green h-3 bg-white rounded-full appearance-none cursor-pointer shadow-inner"
                        />
                      </div>
                      <div className="flex justify-between mt-3 text-xs text-gray-400 font-bold px-1">
                          <span>0</span>
                          <span>{maxExchangeablePoints}</span>
                      </div>
                  </div>

                  <button 
                      onClick={submitExchange}
                      disabled={exchangePoints === 0}
                      className="w-full py-4 bg-brand-green text-white font-bold rounded-xl shadow-lg shadow-brand-green/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-green/90 transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
                  >
                      <Trophy size={20} /> Potvrdit výměnu
                  </button>
              </div>
          </div>
      )}

      {/* History Modal */}
      {showHistory && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-slide-up max-h-[85vh] flex flex-col shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                       <History size={24} className="text-brand-blue"/> Historie odměn
                   </h3>
                   <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                       <X size={20} className="text-gray-400"/>
                   </button>
               </div>

               <div className="overflow-y-auto flex-1 -mx-2 px-2">
                   {historyItems.length === 0 ? (
                       <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-3">
                           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                              <ListTodo size={32} />
                           </div>
                           <p>Zatím tu nic není. Splň nějaký úkol!</p>
                       </div>
                   ) : (
                       <div className="space-y-3">
                           {historyItems.map((item, index) => (
                               <div key={`${item.type}-${item.id}-${index}`} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                                   <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${item.type === 'PAYOUT' ? 'bg-blue-500 text-white' : 'bg-brand-yellow text-brand-dark'}`}>
                                           {item.type === 'PAYOUT' ? <Wallet size={18}/> : <CheckCircle2 size={18}/>}
                                       </div>
                                       <div>
                                           <div className="font-bold text-gray-700">{item.title}</div>
                                           <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('cs-CZ')}</div>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       {item.type === 'TASK' ? (
                                           <>
                                               <div className="font-bold text-brand-dark">+{item.points} ★</div>
                                               {item.money > 0 && <div className="text-xs font-bold text-brand-green">+{item.money} Kč</div>}
                                           </>
                                       ) : (
                                           <div className="font-bold text-blue-600">Vyplaceno</div>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
            </div>
         </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-slide-up shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                          <Settings className="text-gray-500"/> Nastavení
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full">
                          <X size={20} className="text-gray-400"/>
                      </button>
                  </div>

                  <div className="space-y-6">
                      <div className="text-center">
                           <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden border-2 border-gray-100">
                                <AvatarDisplay user={currentUser} />
                           </div>
                          <h4 className="font-bold text-lg">{currentUser.name}</h4>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                          <h5 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Lock size={16}/> Nastavit PIN (4 čísla)</h5>
                          <div className="space-y-3">
                              <input 
                                type="password" 
                                placeholder="Nový PIN"
                                maxLength={4}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow text-gray-900 text-center font-bold tracking-widest"
                              />
                              <input 
                                type="password" 
                                placeholder="Potvrdit PIN"
                                maxLength={4}
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow text-gray-900 text-center font-bold tracking-widest"
                              />
                          </div>
                          <p className="text-xs text-gray-400 mt-2 text-center">Používá se pro přihlášení k tvému profilu.</p>
                      </div>

                      {settingsMessage && (
                          <div className={`p-3 rounded-lg text-sm font-bold text-center ${settingsMessage.includes('uložen') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {settingsMessage}
                          </div>
                      )}

                      <button 
                        onClick={handlePinChange}
                        disabled={!newPin || !confirmPin}
                        className="w-full py-3 bg-brand-dark text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
                      >
                          Uložit PIN
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Avatar Editor Modal */}
      {showAvatarEditor && (
        <AvatarEditor
            currentConfig={currentUser.avatarConfig}
            onSave={handleAvatarSave}
            onClose={() => setShowAvatarEditor(false)}
        />
      )}

    </div>
  );
};

// Helper for feedback
const XCircle = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);

export default ChildDashboard;
