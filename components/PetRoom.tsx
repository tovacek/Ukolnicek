
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Pet, PetStage, PetType } from '../types';
import { X, Heart, Zap, Utensils, Smile, ArrowRight, Sparkles, Trophy } from 'lucide-react';

interface PetRoomProps {
    onClose: () => void;
}

const PetRoom: React.FC<PetRoomProps> = ({ onClose }) => {
    const { currentUser, pets, adoptPet, feedPet, playWithPet } = useApp();
    const [view, setView] = useState<'HOME' | 'ADOPT'>('HOME');
    const [petName, setPetName] = useState('');
    const [message, setMessage] = useState('');
    const [animationClass, setAnimationClass] = useState(''); // 'eating', 'playing', 'idle'
    
    // State for visual effects (floating food/toys)
    const [floatingItem, setFloatingItem] = useState<{ src: string, type: 'food' | 'toy' } | null>(null);
    
    const myPet = currentUser ? pets.find(p => p.childId === currentUser.id) : null;

    useEffect(() => {
        if (!myPet) setView('ADOPT');
    }, [myPet]);

    if (!currentUser) return null;

    // --- ASSETS CONFIG (Microsoft Fluent 3D Emojis) ---
    const BASE_URL = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis";
    
    const PET_ASSETS = {
        EGG: `${BASE_URL}/Food/Egg.png`,
        DRAGON: `${BASE_URL}/Animals/Dragon.png`,
        UNICORN: `${BASE_URL}/Animals/Unicorn.png`,
        DINO: `${BASE_URL}/Animals/T-Rex.png`
    };

    // Items based on Level (Low = Lvl 1-2, Mid = Lvl 3-5, High = Lvl 6+)
    const INTERACTION_ASSETS = {
        FOOD: {
            LOW: `${BASE_URL}/Food/Red Apple.png`,
            MID: `${BASE_URL}/Food/Hamburger.png`,
            HIGH: `${BASE_URL}/Food/Birthday Cake.png`
        },
        TOY: {
            LOW: `${BASE_URL}/Activities/Tennis Ball.png`,
            MID: `${BASE_URL}/Activities/Kite.png`,
            HIGH: `${BASE_URL}/Activities/Joystick.png`
        }
    };

    const handleAdopt = async (type: PetType) => {
        if (!petName.trim()) {
            setMessage('Dej svému mazlíčkovi jméno!');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        await adoptPet(type, petName);
        setView('HOME');
    };

    const triggerAnimation = (type: 'eating' | 'playing') => {
        setAnimationClass(type);
        setTimeout(() => setAnimationClass(''), 1000);
    };

    const getAssetForLevel = (type: 'FOOD' | 'TOY', level: number) => {
        if (type === 'FOOD') {
            if (level >= 6) return INTERACTION_ASSETS.FOOD.HIGH;
            if (level >= 3) return INTERACTION_ASSETS.FOOD.MID;
            return INTERACTION_ASSETS.FOOD.LOW;
        } else {
            if (level >= 6) return INTERACTION_ASSETS.TOY.HIGH;
            if (level >= 3) return INTERACTION_ASSETS.TOY.MID;
            return INTERACTION_ASSETS.TOY.LOW;
        }
    };

    const handleFeed = async () => {
        if (!myPet) return;
        
        // 1. Trigger Pet Animation
        triggerAnimation('eating');
        
        // 2. Trigger Floating Item Effect
        const level = Math.floor(myPet.experience / 100) + 1;
        const itemSrc = getAssetForLevel('FOOD', level);
        setFloatingItem({ src: itemSrc, type: 'food' });
        setTimeout(() => setFloatingItem(null), 1000); // Clear after animation

        // 3. Logic
        const res = await feedPet(myPet.id);
        setMessage(res.message);
        setTimeout(() => setMessage(''), 3000);
    };

    const handlePlay = async () => {
        if (!myPet) return;

        // 1. Trigger Pet Animation
        triggerAnimation('playing');

        // 2. Trigger Floating Item Effect
        const level = Math.floor(myPet.experience / 100) + 1;
        const itemSrc = getAssetForLevel('TOY', level);
        setFloatingItem({ src: itemSrc, type: 'toy' });
        setTimeout(() => setFloatingItem(null), 1000); // Clear after animation

        // 3. Logic
        const res = await playWithPet(myPet.id);
        setMessage(res.message);
        setTimeout(() => setMessage(''), 3000);
    };

    const getPetImageSrc = (pet: Pet) => {
        if (pet.stage === PetStage.EGG) return PET_ASSETS.EGG;
        switch (pet.type) {
            case PetType.DRAGON: return PET_ASSETS.DRAGON;
            case PetType.UNICORN: return PET_ASSETS.UNICORN;
            case PetType.DINO: return PET_ASSETS.DINO;
            default: return PET_ASSETS.EGG;
        }
    };

    const getPetSizeClass = (stage: PetStage) => {
        if (stage === PetStage.EGG) return "w-32 h-32";
        if (stage === PetStage.BABY) return "w-48 h-48";
        return "w-64 h-64 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]";
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Main Container - The "Room" */}
            <div className="bg-gradient-to-b from-indigo-500 to-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-[90vh] border-8 border-white/10 ring-1 ring-white/20">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/20 text-white rounded-full hover:bg-white/20 transition-colors z-50 backdrop-blur-sm">
                    <X size={24}/>
                </button>

                {/* ADOPTION SCREEN */}
                {(!myPet || view === 'ADOPT') && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400/30 via-transparent to-transparent pointer-events-none"></div>
                        
                        <h2 className="text-4xl font-display font-bold text-white mb-2 drop-shadow-md">Nový kamarád</h2>
                        <p className="text-indigo-100 mb-8">Vyber si vajíčko, o které se budeš starat.</p>
                        
                        <input 
                            type="text" 
                            placeholder="Jméno mazlíčka..." 
                            value={petName} 
                            onChange={e => setPetName(e.target.value)} 
                            className="p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder-indigo-200 text-center font-bold text-xl w-full mb-6 focus:ring-4 focus:ring-white/30 outline-none backdrop-blur-sm"
                        />
                        {message && <p className="text-red-300 font-bold bg-black/40 px-4 py-2 rounded-lg mb-4 animate-pulse">{message}</p>}

                        <div className="grid grid-cols-1 gap-4 w-full overflow-y-auto max-h-[40vh] pr-2">
                             {[
                                 { type: PetType.DRAGON, label: 'Drak', img: PET_ASSETS.DRAGON, color: 'from-red-400 to-orange-500' },
                                 { type: PetType.UNICORN, label: 'Jednorožec', img: PET_ASSETS.UNICORN, color: 'from-pink-400 to-purple-500' },
                                 { type: PetType.DINO, label: 'Dino', img: PET_ASSETS.DINO, color: 'from-green-400 to-emerald-500' }
                             ].map((opt) => (
                                 <button 
                                    key={opt.type} 
                                    onClick={() => handleAdopt(opt.type)} 
                                    className={`flex items-center justify-between p-3 bg-gradient-to-r ${opt.color} rounded-2xl shadow-lg transform hover:scale-105 transition-all active:scale-95 group border border-white/20 relative overflow-hidden`}
                                 >
                                     <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                                     <div className="flex items-center gap-4 relative z-10">
                                         <img src={opt.img} alt={opt.label} className="w-16 h-16 drop-shadow-md group-hover:animate-bounce" />
                                         <span className="text-white font-bold text-xl text-shadow">{opt.label}</span>
                                     </div>
                                     <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm relative z-10">
                                        <ArrowRight className="text-white" />
                                     </div>
                                 </button>
                             ))}
                        </div>
                    </div>
                )}

                {/* PET ROOM SCREEN */}
                {myPet && view === 'HOME' && (
                    <div className="flex-1 flex flex-col relative">
                        
                        {/* 1. TOP STATS BAR */}
                        <div className="absolute top-0 left-0 w-full p-6 pt-8 z-30 flex justify-between items-start">
                            <div>
                                <h3 className="text-3xl font-display font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{myPet.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider shadow-sm">
                                        {myPet.stage === PetStage.EGG ? 'Vajíčko' : (myPet.stage === PetStage.BABY ? 'Miminko' : 'Dospělý')}
                                    </span>
                                    <span className="text-indigo-200 text-xs font-bold drop-shadow-md">Level {Math.floor(myPet.experience / 100) + 1}</span>
                                </div>
                            </div>
                            
                            <div className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2 w-32 shadow-lg">
                                <div>
                                    <div className="flex justify-between text-[10px] text-white font-bold mb-0.5">
                                        <span className="flex items-center gap-1"><Heart size={10} className="text-red-400 fill-red-400"/> Zdraví</span>
                                        <span>{myPet.health}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500" style={{width: `${myPet.health}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-white font-bold mb-0.5">
                                        <span className="flex items-center gap-1"><Smile size={10} className="text-yellow-400 fill-yellow-400"/> Štěstí</span>
                                        <span>{myPet.happiness}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500" style={{width: `${myPet.happiness}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-white font-bold mb-0.5">
                                        <span className="flex items-center gap-1"><Zap size={10} className="text-blue-400 fill-blue-400"/> XP</span>
                                        <span>{myPet.experience % 100}/100</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500" style={{width: `${myPet.experience % 100}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. THE STAGE (3D Environment) */}
                        <div className="flex-1 relative flex items-center justify-center z-10 perspective-[1000px]">
                            {/* Spotlight Effect */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 blur-[60px] rounded-full pointer-events-none"></div>
                            
                            {/* The Pet Container */}
                            <div className={`relative transition-transform duration-500 flex items-center justify-center ${
                                animationClass === 'eating' ? 'scale-110' : 
                                animationClass === 'playing' ? 'animate-bounce' : 
                                'animate-pulse-slow'
                            }`}>
                                <img 
                                    src={getPetImageSrc(myPet)} 
                                    alt="Pet" 
                                    className={`object-contain transition-all duration-700 ${getPetSizeClass(myPet.stage)}`}
                                    style={{
                                        filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
                                    }}
                                />

                                {/* FLOATING ITEM EFFECT */}
                                {floatingItem && (
                                    <div className={`absolute z-50 ${floatingItem.type === 'food' ? 'animate-feed-item' : 'animate-play-item'}`}>
                                        <img 
                                            src={floatingItem.src} 
                                            alt="Item" 
                                            className="w-24 h-24 drop-shadow-xl"
                                        />
                                    </div>
                                )}

                                {/* Feedback Bubble */}
                                {message && (
                                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white text-brand-dark px-4 py-2 rounded-2xl font-bold text-sm shadow-xl whitespace-nowrap animate-bounce z-50 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[8px] after:border-transparent after:border-t-white">
                                        {message}
                                    </div>
                                )}
                            </div>

                            {/* The Floor / Shadow */}
                            <div className="absolute bottom-16 w-48 h-12 bg-black/40 blur-xl rounded-[100%] transform rotate-x-[60deg] z-0"></div>
                            
                            {/* Floor Surface */}
                            <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-black/40 to-transparent z-0"></div>
                        </div>

                        {/* 3. CONTROLS */}
                        <div className="p-6 pb-8 bg-white/10 backdrop-blur-md border-t border-white/10 relative z-20 flex justify-between items-center gap-4">
                            
                            <button 
                                onClick={handleFeed}
                                className="flex-1 group relative overflow-hidden bg-gradient-to-br from-orange-400 to-red-500 p-4 rounded-2xl shadow-lg active:scale-95 transition-all border border-white/20"
                            >
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors"></div>
                                <div className="flex flex-col items-center relative z-10">
                                    <Utensils className="text-white mb-1 drop-shadow-md" size={28} />
                                    <span className="text-white font-bold text-sm">Nakrmit</span>
                                    <span className="text-orange-100 text-[10px] font-bold bg-black/20 px-2 rounded-full mt-1">-10 bodů</span>
                                </div>
                            </button>

                            <button 
                                onClick={handlePlay}
                                className="flex-1 group relative overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 p-4 rounded-2xl shadow-lg active:scale-95 transition-all border border-white/20"
                            >
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors"></div>
                                <div className="flex flex-col items-center relative z-10">
                                    <Trophy className="text-white mb-1 drop-shadow-md" size={28} />
                                    <span className="text-white font-bold text-sm">Hrát si</span>
                                    <span className="text-blue-100 text-[10px] font-bold bg-black/20 px-2 rounded-full mt-1">-5 bodů</span>
                                </div>
                            </button>

                            {/* Info */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                Máš {currentUser.points || 0} bodů
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                
                @keyframes feed-item {
                    0% { transform: translateY(100px) scale(0.5); opacity: 0; }
                    20% { transform: translateY(50px) scale(1); opacity: 1; }
                    80% { transform: translateY(0px) scale(0.8); opacity: 1; }
                    100% { transform: translateY(-20px) scale(0); opacity: 0; }
                }
                .animate-feed-item {
                    animation: feed-item 1s ease-in-out forwards;
                }

                @keyframes play-item {
                    0% { transform: translate(-50px, 50px) rotate(-20deg); opacity: 0; }
                    20% { opacity: 1; }
                    50% { transform: translate(50px, -50px) rotate(20deg); }
                    100% { transform: translate(-20px, 0px) rotate(0deg) scale(0); opacity: 0; }
                }
                .animate-play-item {
                    animation: play-item 1s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PetRoom;
