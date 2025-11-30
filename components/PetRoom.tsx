
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Pet, PetType } from '../types';
import { X, Heart, Zap, Utensils, Smile, Trophy, Moon, Sun, Bath, Sparkles } from 'lucide-react';

interface PetRoomProps {
    onClose: () => void;
}

const PetRoom: React.FC<PetRoomProps> = ({ onClose }) => {
    const { currentUser, pets, adoptPet, feedPet, playWithPet } = useApp();
    const [view, setView] = useState<'HOME' | 'ADOPT'>('HOME');
    const [petName, setPetName] = useState('');
    const [message, setMessage] = useState('');
    
    // States for Micro Pet Logic
    const [animationState, setAnimationState] = useState<'IDLE' | 'WALK' | 'EATING' | 'PLAYING' | 'SLEEPING' | 'CLEANING'>('IDLE');
    const [chatBubble, setChatBubble] = useState<string | null>(null);
    const [isLightsOut, setIsLightsOut] = useState(false);
    const [poopCount, setPoopCount] = useState(0);
    const [floatingItem, setFloatingItem] = useState<{ icon: React.ReactNode, color: string } | null>(null);
    
    const myPet = currentUser ? pets.find(p => p.childId === currentUser.id) : null;
    const chatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initial Setup
    useEffect(() => {
        if (!myPet) setView('ADOPT');
        
        // Auto-detect night time for initial state
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 7) setIsLightsOut(true);

        // Randomly generate "mess" based on low hygiene (simulated by inverse happiness)
        if (myPet && myPet.happiness < 50) {
            setPoopCount(Math.floor(Math.random() * 2) + 1);
        }

        // Random idle chatter
        chatTimerRef.current = setInterval(() => {
            if (Math.random() > 0.7 && myPet && !isLightsOut) generateRandomChat();
        }, 6000);

        return () => {
            if (chatTimerRef.current) clearInterval(chatTimerRef.current);
        };
    }, [myPet]);

    const generateRandomChat = () => {
        if (!myPet || isLightsOut) return;
        
        if (poopCount > 0) { setChatBubble("Fuj! Uklidit! 💩"); return; }
        if (myPet.health < 30) { setChatBubble("Hlad! 🍖"); return; }
        if (myPet.happiness < 30) { setChatBubble("Nuda... 🥱"); return; }

        const phrases = [
            "Jsi super! ❤️",
            "Hrajeme? 🎾",
            `Lvl ${myPet.stage} 🚀`,
            "Sleduj! 👀",
            "Energie! ⚡",
            "Mám tě rád! 🥰"
        ];
        setChatBubble(phrases[Math.floor(Math.random() * phrases.length)]);
        setTimeout(() => setChatBubble(null), 3000);
    };

    const handleAdopt = async (type: PetType) => {
        if (!petName.trim()) return;
        await adoptPet(type, petName);
        setView('HOME');
    };

    const triggerFloat = (icon: React.ReactNode, color: string) => {
        setFloatingItem({ icon, color });
        setTimeout(() => setFloatingItem(null), 1500);
    };

    // --- ACTIONS ---

    const handleFeed = async () => {
        if (!myPet || isLightsOut) return;
        if (poopCount > 0) { setChatBubble("Nejdřív uklidit! 🤢"); return; }
        
        setAnimationState('EATING');
        triggerFloat(<Utensils size={32}/>, "text-orange-500");
        setTimeout(() => setAnimationState('IDLE'), 2000);

        const res = await feedPet(myPet.id);
        if (res.success) {
             setChatBubble("Mňam! 😋");
             // Chance to poop after eating
             if (Math.random() > 0.8) setTimeout(() => setPoopCount(prev => prev + 1), 3000);
        } else {
             setMessage(res.message);
             setTimeout(() => setMessage(''), 3000);
        }
    };

    const handlePlay = async () => {
        if (!myPet || isLightsOut) return;
        if (poopCount > 0) { setChatBubble("Tady smrdí... 🤢"); return; }

        setAnimationState('PLAYING');
        triggerFloat(<Trophy size={32}/>, "text-blue-500");
        setTimeout(() => setAnimationState('IDLE'), 2000);

        const res = await playWithPet(myPet.id);
         if (res.success) setChatBubble("Jupí! 🤪");
         else {
             setMessage(res.message);
             setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleClean = () => {
        if (!myPet || isLightsOut) return;
        setAnimationState('CLEANING');
        triggerFloat(<Sparkles size={32}/>, "text-cyan-400");
        
        setTimeout(() => {
            setPoopCount(0);
            setAnimationState('IDLE');
            setChatBubble("Čisto! ✨");
            // Small bonus interaction (using playWithPet for backend simplicity)
            playWithPet(myPet.id); 
        }, 2000);
    };

    const toggleSleep = () => {
        setIsLightsOut(!isLightsOut);
        setAnimationState(isLightsOut ? 'IDLE' : 'SLEEPING');
    };

    // --- ELEMENTAL WORLDS & SKINS ---
    const getTheme = (type: PetType) => {
        switch (type) {
            case PetType.DRAGON: return {
                device: 'bg-red-100 border-red-300',
                screen: 'bg-gradient-to-b from-orange-900 to-red-900', // Volcano
                accent: 'text-red-500',
                floor: 'bg-orange-600/30',
                particles: '🌋'
            };
            case PetType.UNICORN: return {
                device: 'bg-purple-100 border-purple-300',
                screen: 'bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-200', // Sky Kingdom
                accent: 'text-purple-500',
                floor: 'bg-white/40',
                particles: '✨'
            };
            case PetType.DINO: return {
                device: 'bg-green-100 border-green-300',
                screen: 'bg-gradient-to-b from-emerald-800 to-green-600', // Jungle
                accent: 'text-green-500',
                floor: 'bg-emerald-900/40',
                particles: '🍃'
            };
            default: return {
                device: 'bg-slate-200 border-slate-300',
                screen: 'bg-gradient-to-b from-blue-200 to-white',
                accent: 'text-slate-500',
                floor: 'bg-green-600/20',
                particles: ''
            };
        }
    };

    // --- RENDERERS ---

    const renderMicroPet = (stage: number, type: PetType) => {
        // Base Colors based on Type
        let mainColor = '#4ADE80'; // Dino Green
        let secondColor = '#166534';
        let accentColor = '#FEF08A';

        if (type === PetType.DRAGON) {
            mainColor = '#EF4444'; // Red
            secondColor = '#7F1D1D';
            accentColor = '#FDBA74';
        } else if (type === PetType.UNICORN) {
            mainColor = '#D8B4FE'; // Purple
            secondColor = '#6B21A8';
            accentColor = '#F472B6';
        }

        // Color shift by level (Rainbow evolution)
        const hueShift = (stage * 5) % 360;
        
        // EGG
        if (stage === 1) {
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md animate-bounce-slow">
                    <ellipse cx="50" cy="60" rx="30" ry="35" fill="white" stroke={secondColor} strokeWidth="3" />
                    <circle cx="40" cy="50" r="5" fill={mainColor} opacity="0.5" />
                    <circle cx="60" cy="70" r="8" fill={mainColor} opacity="0.5" />
                    <path d="M35 35 L45 45 L40 55" stroke={secondColor} strokeWidth="2" fill="none"/>
                </svg>
            );
        }

        // BABY (Big Head, Small Body)
        if (stage < 10) {
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" style={{ filter: `hue-rotate(${hueShift}deg)` }}>
                    {/* Legs */}
                    <path d="M40 80 L40 90" stroke={secondColor} strokeWidth="6" strokeLinecap="round"/>
                    <path d="M60 80 L60 90" stroke={secondColor} strokeWidth="6" strokeLinecap="round"/>
                    {/* Body */}
                    <circle cx="50" cy="60" r="30" fill={mainColor} stroke={secondColor} strokeWidth="3"/>
                    <circle cx="50" cy="65" r="15" fill={accentColor} opacity="0.6"/>
                    {/* Eyes */}
                    <circle cx="40" cy="55" r="4" fill="black"/>
                    <circle cx="60" cy="55" r="4" fill="black"/>
                    <circle cx="38" cy="53" r="1.5" fill="white"/>
                    <circle cx="58" cy="53" r="1.5" fill="white"/>
                    {/* Cheeks */}
                    <circle cx="35" cy="62" r="3" fill="#FCA5A5" opacity="0.6"/>
                    <circle cx="65" cy="62" r="3" fill="#FCA5A5" opacity="0.6"/>
                    
                    {/* ACCESSORIES (Layered) */}
                    {stage >= 5 && (
                        // Cap
                        <path d="M30 40 Q50 20 70 40 L70 45 Q50 25 30 45 Z" fill="#3B82F6" stroke="black" strokeWidth="1"/> 
                    )}
                    
                    {/* Type Specifics */}
                    {type === PetType.UNICORN && <path d="M50 30 L45 45 L55 45 Z" fill="#FDE047" stroke="black" strokeWidth="1"/>}
                    {type === PetType.DRAGON && <path d="M20 50 Q10 30 30 40" stroke={secondColor} strokeWidth="3" fill="none"/>}
                    {type === PetType.DINO && <path d="M50 30 L45 35 L50 40 L55 35 Z" fill={secondColor} />}
                </svg>
            );
        }

        // ADULT (Complex)
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" style={{ filter: `hue-rotate(${hueShift}deg)` }}>
                {/* Wings (Level 20+) */}
                {stage >= 20 && (
                    <>
                        <path d="M20 50 Q5 20 40 40" fill={accentColor} opacity="0.8" stroke={secondColor} strokeWidth="1"/>
                        <path d="M80 50 Q95 20 60 40" fill={accentColor} opacity="0.8" stroke={secondColor} strokeWidth="1"/>
                    </>
                )}

                {/* Tail */}
                <path d="M30 80 Q10 80 20 60" stroke={mainColor} strokeWidth="8" strokeLinecap="round" fill="none"/>
                
                {/* Legs */}
                <path d="M35 85 L35 95" stroke={secondColor} strokeWidth="8" strokeLinecap="round"/>
                <path d="M65 85 L65 95" stroke={secondColor} strokeWidth="8" strokeLinecap="round"/>
                
                {/* Body */}
                <rect x="30" y="40" width="40" height="50" rx="15" fill={mainColor} stroke={secondColor} strokeWidth="3"/>
                <path d="M40 50 L60 50 L60 80 L40 80 Z" fill={accentColor} opacity="0.5" rx="5"/>
                
                {/* Head */}
                <circle cx="50" cy="35" r="25" fill={mainColor} stroke={secondColor} strokeWidth="3"/>
                
                {/* Face */}
                <circle cx="42" cy="32" r="4" fill="black"/>
                <circle cx="58" cy="32" r="4" fill="black"/>
                <path d="M48 40 Q50 43 52 40" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* ACCESSORIES (Layered on top) */}
                {stage >= 10 && (
                    // Sunglasses
                    <g>
                        <rect x="35" y="28" width="12" height="8" fill="black" rx="2"/>
                        <rect x="53" y="28" width="12" height="8" fill="black" rx="2"/>
                        <line x1="47" y1="32" x2="53" y2="32" stroke="black" strokeWidth="1"/>
                    </g>
                )}
                {stage >= 30 && (
                    // Crown
                    <path d="M35 15 L42 25 L50 10 L58 25 L65 15 L65 28 L35 28 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1"/>
                )}

                {/* Type Specifics */}
                {type === PetType.UNICORN && <path d="M50 10 L45 25 L55 25 Z" fill="#FDE047" stroke="black" strokeWidth="1"/>}
            </svg>
        );
    };

    if (!currentUser) return null;
    const theme = myPet ? getTheme(myPet.type) : getTheme(PetType.DINO);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* GAMEBOY DEVICE CONTAINER */}
            <div className={`w-full max-w-sm rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col h-[85vh] border-8 border-b-[20px] transition-colors duration-500 overflow-hidden ${!myPet ? 'bg-slate-200 border-slate-300' : theme.device}`}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 rounded-full hover:bg-black/20 text-slate-600 z-50"><X size={20}/></button>

                {(!myPet || view === 'ADOPT') ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50 m-4 rounded-[2rem]">
                        <h2 className="text-2xl font-display font-bold text-slate-700 mb-4">Vyber si vajíčko</h2>
                        <input type="text" placeholder="Jméno..." value={petName} onChange={e => setPetName(e.target.value)} className="p-3 rounded-xl border-2 border-slate-300 text-center font-bold text-lg w-full mb-6 outline-none"/>
                        <div className="flex gap-4">
                             {[{ type: PetType.DRAGON, label: 'Drak', color: 'bg-red-200' }, { type: PetType.UNICORN, label: 'Uni', color: 'bg-purple-200' }, { type: PetType.DINO, label: 'Dino', color: 'bg-green-200' }].map((opt) => (
                                 <button key={opt.type} onClick={() => handleAdopt(opt.type)} className={`flex-1 p-2 ${opt.color} rounded-xl shadow-sm hover:scale-105 transition-transform border-2 border-white`}>
                                     <div className="text-2xl mb-1">{opt.type === PetType.DRAGON ? '🐉' : opt.type === PetType.UNICORN ? '🦄' : '🦖'}</div>
                                     <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                                 </button>
                             ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        
                        {/* SCREEN */}
                        <div className={`m-5 mb-0 flex-1 rounded-2xl border-4 border-slate-300/50 shadow-inner relative overflow-hidden transition-all duration-1000 ${isLightsOut ? 'bg-slate-900' : theme.screen}`}>
                            
                            {/* Elemental Particles */}
                            {!isLightsOut && (
                                <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
                                    <div className="absolute top-10 left-10 text-2xl animate-float-slow">{theme.particles}</div>
                                    <div className="absolute top-40 right-20 text-xl animate-float-medium">{theme.particles}</div>
                                    <div className="absolute bottom-20 left-1/3 text-lg animate-bounce-slow">{theme.particles}</div>
                                </div>
                            )}

                            {/* Status Bar */}
                            <div className={`absolute top-2 left-2 right-2 flex justify-between items-center bg-white/40 backdrop-blur-sm p-1.5 rounded-lg z-20 ${isLightsOut ? 'opacity-20' : ''}`}>
                                <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
                                    <Heart size={10} className="text-red-500 fill-red-500"/> {myPet.health}%
                                </div>
                                <div className="font-display font-bold text-slate-900 text-sm">{myPet.name}</div>
                                <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
                                    <Smile size={10} className="text-yellow-500 fill-yellow-500"/> {myPet.happiness}%
                                </div>
                            </div>

                            {/* Scene Content */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                
                                {/* Pet */}
                                <div className={`w-40 h-40 transition-transform duration-500 z-10
                                    ${animationState === 'WALK' ? 'animate-bounce-slow' : ''}
                                    ${animationState === 'EATING' ? 'scale-110' : ''}
                                    ${animationState === 'SLEEPING' ? 'scale-90 opacity-80' : 'animate-float-fast'}
                                    ${animationState === 'CLEANING' ? 'translate-x-10' : ''}
                                `}>
                                    {renderMicroPet(myPet.stage, myPet.type)}
                                </div>

                                {/* Floating Action Items */}
                                {floatingItem && (
                                    <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 animate-bounce ${floatingItem.color} z-20`}>
                                        {floatingItem.icon}
                                    </div>
                                )}

                                {/* Chat Bubble */}
                                {chatBubble && !isLightsOut && (
                                    <div className="absolute top-16 bg-white border-2 border-black rounded-xl p-2 text-xs font-bold shadow-md animate-scale-in whitespace-nowrap z-30">
                                        {chatBubble}
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-black transform rotate-45"></div>
                                    </div>
                                )}

                                {/* ZZZ for Sleep */}
                                {isLightsOut && (
                                    <div className="absolute top-20 right-10 text-slate-200 animate-pulse text-2xl font-bold z-20">Zzz...</div>
                                )}

                                {/* Poop Mess */}
                                {poopCount > 0 && !isLightsOut && (
                                    <div className="absolute bottom-4 right-10 text-2xl animate-bounce z-10">💩</div>
                                )}
                                {poopCount > 1 && !isLightsOut && (
                                    <div className="absolute bottom-4 left-10 text-2xl animate-bounce delay-100 z-10">💩</div>
                                )}

                            </div>
                            
                            {/* Floor */}
                            <div className={`absolute bottom-0 w-full h-12 ${isLightsOut ? 'bg-slate-800' : theme.floor}`}></div>
                        </div>

                        {/* CONTROLS */}
                        <div className="p-6">
                            <div className="grid grid-cols-4 gap-3">
                                {/* Feed Button */}
                                <button 
                                    onClick={handleFeed} 
                                    disabled={isLightsOut}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all
                                        ${isLightsOut ? 'opacity-30 grayscale' : 'hover:bg-orange-50'}
                                    `}
                                >
                                    <Utensils className="text-orange-500 mb-1" size={24}/>
                                    <span className="text-[10px] font-bold text-slate-500">Jídlo</span>
                                </button>

                                {/* Play Button */}
                                <button 
                                    onClick={handlePlay} 
                                    disabled={isLightsOut || poopCount > 0}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all
                                        ${(isLightsOut || poopCount > 0) ? 'opacity-30 grayscale' : 'hover:bg-blue-50'}
                                    `}
                                >
                                    <Trophy className="text-blue-500 mb-1" size={24}/>
                                    <span className="text-[10px] font-bold text-slate-500">Hra</span>
                                </button>

                                {/* Clean Button */}
                                <button 
                                    onClick={handleClean} 
                                    disabled={isLightsOut}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all relative
                                        ${isLightsOut ? 'opacity-30 grayscale' : 'hover:bg-cyan-50'}
                                    `}
                                >
                                    {poopCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>}
                                    <Bath className="text-cyan-500 mb-1" size={24}/>
                                    <span className="text-[10px] font-bold text-slate-500">Mytí</span>
                                </button>

                                {/* Sleep Button */}
                                <button 
                                    onClick={toggleSleep} 
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all
                                        ${isLightsOut ? 'bg-indigo-100 border-indigo-300' : 'hover:bg-indigo-50'}
                                    `}
                                >
                                    {isLightsOut ? <Sun className="text-indigo-600 mb-1" size={24}/> : <Moon className="text-indigo-400 mb-1" size={24}/>}
                                    <span className="text-[10px] font-bold text-slate-500">{isLightsOut ? 'Vstávat' : 'Spát'}</span>
                                </button>
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center px-2">
                                <div className="text-xs font-bold text-slate-500 bg-white/50 px-2 py-1 rounded-md border border-white/50">
                                    Lvl {myPet.stage}
                                </div>
                                <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-md border border-white/50">
                                    <Zap size={10} className="text-cyan-600 fill-cyan-600"/>
                                    <span className="text-xs font-bold text-slate-600">{currentUser.petPoints}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5%); } }
                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
                
                @keyframes float-fast { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(2px, -2px); } 50% { transform: translate(-2px, 2px); } 75% { transform: translate(2px, 2px); } }
                .animate-float-fast { animation: float-fast 0.5s linear infinite; }

                @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
                
                @keyframes float-medium { 0%, 100% { transform: translateY(0) rotate(5deg); } 50% { transform: translateY(-15px) rotate(-5deg); } }
                .animate-float-medium { animation: float-medium 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default PetRoom;
