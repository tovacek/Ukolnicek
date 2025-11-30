
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Pet, PetType } from '../types';
import { X, Heart, Zap, Utensils, Smile, ArrowRight, Trophy, Moon, Sun } from 'lucide-react';

interface PetRoomProps {
    onClose: () => void;
}

const PetRoom: React.FC<PetRoomProps> = ({ onClose }) => {
    const { currentUser, pets, adoptPet, feedPet, playWithPet } = useApp();
    const [view, setView] = useState<'HOME' | 'ADOPT'>('HOME');
    const [petName, setPetName] = useState('');
    const [message, setMessage] = useState('');
    const [animationState, setAnimationState] = useState<'IDLE' | 'EATING' | 'PLAYING' | 'PETTING'>('IDLE');
    const [chatBubble, setChatBubble] = useState<string | null>(null);
    const [isNight, setIsNight] = useState(false);
    const [floatingItem, setFloatingItem] = useState<{ src: string, type: 'food' | 'toy' | 'love' } | null>(null);
    
    const myPet = currentUser ? pets.find(p => p.childId === currentUser.id) : null;
    const chatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- ASSETS CONFIG ---
    const BASE_URL = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis";
    const PET_ASSETS = {
        EGG: `${BASE_URL}/Food/Egg.png`,
        DRAGON: `${BASE_URL}/Animals/Dragon.png`,
        UNICORN: `${BASE_URL}/Animals/Unicorn.png`,
        DINO: `${BASE_URL}/Animals/T-Rex.png`
    };

    const INTERACTION_ASSETS = {
        FOOD: [`${BASE_URL}/Food/Red Apple.png`, `${BASE_URL}/Food/Hamburger.png`, `${BASE_URL}/Food/Birthday Cake.png`, `${BASE_URL}/Food/Pizza.png`, `${BASE_URL}/Food/Sushi.png`],
        TOY: [`${BASE_URL}/Activities/Tennis Ball.png`, `${BASE_URL}/Activities/Kite.png`, `${BASE_URL}/Activities/Joystick.png`, `${BASE_URL}/Activities/Soccer Ball.png`, `${BASE_URL}/Activities/Trophy.png`]
    };

    const ACCESSORIES = {
        ZZZ: `${BASE_URL}/Smilies/Zzz.png`,
        SPARKLES: `${BASE_URL}/Activities/Sparkles.png`
    };

    useEffect(() => {
        if (!myPet) setView('ADOPT');
        
        const hour = new Date().getHours();
        const night = hour >= 21 || hour < 7;
        setIsNight(night);

        chatTimerRef.current = setInterval(() => {
            if (Math.random() > 0.6 && myPet) generateRandomChat();
        }, 8000);

        return () => {
            if (chatTimerRef.current) clearInterval(chatTimerRef.current);
        };
    }, [myPet]);

    const generateRandomChat = () => {
        if (!myPet) return;
        const hour = new Date().getHours();
        
        if (myPet.health < 30) { setChatBubble("Mám hrozný hlad! 🍔"); return; }
        if (myPet.happiness < 30) { setChatBubble("Nudím se... 🥱"); return; }
        if (hour >= 21 || hour < 7) { setChatBubble("Chrup... 😴"); return; }

        const phrases = [
            `Ahoj ${currentUser?.name}! 👋`,
            "Kdy si budeme hrát? 🎾",
            `Level ${myPet.stage} je super! 🚀`,
            "Sleduj mě! 👀",
            "Mám plno energie! ⚡",
            "Jsi můj nejlepší kámoš ❤️"
        ];
        setChatBubble(phrases[Math.floor(Math.random() * phrases.length)]);
        setTimeout(() => setChatBubble(null), 4000);
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

    const handleFeed = async () => {
        if (!myPet || isNight) return;
        setAnimationState('EATING');
        setTimeout(() => setAnimationState('IDLE'), 1000);
        
        const itemSrc = INTERACTION_ASSETS.FOOD[Math.floor(Math.random() * INTERACTION_ASSETS.FOOD.length)];
        setFloatingItem({ src: itemSrc, type: 'food' });
        setTimeout(() => setFloatingItem(null), 1000);

        const res = await feedPet(myPet.id);
        if (res.success) {
             setChatBubble("Mňam! 😋");
             setTimeout(() => setChatBubble(null), 2000);
        } else {
             setMessage(res.message);
             setTimeout(() => setMessage(''), 3000);
        }
    };

    const handlePlay = async () => {
        if (!myPet || isNight) return;
        setAnimationState('PLAYING');
        setTimeout(() => setAnimationState('IDLE'), 1000);

        const itemSrc = INTERACTION_ASSETS.TOY[Math.floor(Math.random() * INTERACTION_ASSETS.TOY.length)];
        setFloatingItem({ src: itemSrc, type: 'toy' });
        setTimeout(() => setFloatingItem(null), 1000);

        const res = await playWithPet(myPet.id);
         if (res.success) {
             setChatBubble("Jupí! 🤪");
             setTimeout(() => setChatBubble(null), 2000);
        } else {
             setMessage(res.message);
             setTimeout(() => setMessage(''), 3000);
        }
    };

    const handlePet = () => {
        if (!myPet) return;
        setAnimationState('PETTING');
        setTimeout(() => setAnimationState('IDLE'), 1000);
        setChatBubble("To lechtá! ❤️");
        setTimeout(() => setChatBubble(null), 2000);
        setFloatingItem({ src: `${BASE_URL}/Smilies/Heart%20with%20Arrow.png`, type: 'love' });
        setTimeout(() => setFloatingItem(null), 1000);
    };

    // --- PROCEDURAL VECTOR PET ENGINE ---
    
    // Calculates SVG paths and properties based on Pet Stage
    const getVectorPetProps = (stage: number) => {
        const level = stage;
        
        // 1. Color (HUE CYCLES)
        const baseHue = (stage * 15) % 360;
        const colorPrimary = `hsl(${baseHue}, 70%, 50%)`;
        const colorSecondary = `hsl(${baseHue}, 70%, 40%)`;
        const colorBelly = `hsl(${baseHue}, 80%, 80%)`;

        // 2. Shape Morphing Logic
        
        // EGG PHASE (1)
        if (level === 1) {
            return {
                title: "Vajíčko",
                bgClass: "from-blue-100 to-blue-200",
                svg: (
                    <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-xl">
                        <ellipse cx="100" cy="120" rx="60" ry="70" fill={colorPrimary} />
                        <ellipse cx="100" cy="120" rx="40" ry="50" fill={colorBelly} opacity="0.3" />
                        {/* Cracks */}
                        <path d="M80 80 L90 90 L85 100" stroke="rgba(0,0,0,0.2)" strokeWidth="3" fill="none"/>
                    </svg>
                )
            };
        }

        // BABY PHASE (2-9)
        if (level < 10) {
            // Grows slightly fatter each level
            const fatness = 60 + (level * 2);
            return {
                title: "Miminko",
                bgClass: "from-green-200 to-emerald-400",
                svg: (
                    <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-xl animate-bounce-slow">
                        {/* Feet */}
                        <circle cx="70" cy="160" r="15" fill={colorSecondary} />
                        <circle cx="130" cy="160" r="15" fill={colorSecondary} />
                        {/* Body - Round Blob */}
                        <path d={`M${100-fatness} 150 Q${100-fatness} 50 100 50 Q${100+fatness} 50 ${100+fatness} 150 Z`} fill={colorPrimary} />
                        <ellipse cx="100" cy="120" rx={fatness * 0.6} ry="40" fill={colorBelly} />
                        {/* Simple Eyes */}
                        <circle cx="80" cy="90" r="8" fill="white" />
                        <circle cx="80" cy="90" r="3" fill="black" />
                        <circle cx="120" cy="90" r="8" fill="white" />
                        <circle cx="120" cy="90" r="3" fill="black" />
                        {/* Smile */}
                        <path d="M90 110 Q100 120 110 110" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                )
            };
        }

        // TEEN PHASE (10-19)
        if (level < 20) {
            // Elongates each level
            const height = 150 - (level - 10) * 3; 
            return {
                title: "Teenager",
                bgClass: "from-purple-300 to-indigo-500",
                svg: (
                    <svg viewBox="0 0 200 200" className="w-56 h-56 drop-shadow-2xl animate-float-medium">
                        {/* Arms */}
                        <path d="M60 100 Q40 120 50 140" stroke={colorSecondary} strokeWidth="12" strokeLinecap="round" fill="none"/>
                        <path d="M140 100 Q160 120 150 140" stroke={colorSecondary} strokeWidth="12" strokeLinecap="round" fill="none"/>
                        {/* Legs */}
                        <path d="M80 150 L80 180" stroke={colorSecondary} strokeWidth="15" strokeLinecap="round" />
                        <path d="M120 150 L120 180" stroke={colorSecondary} strokeWidth="15" strokeLinecap="round" />
                        {/* Body - Oval/Tall */}
                        <ellipse cx="100" cy="100" rx="50" ry="70" fill={colorPrimary} />
                        <ellipse cx="100" cy="100" rx="30" ry="50" fill={colorBelly} />
                        {/* Eyes with Glasses maybe? or just bigger */}
                        <circle cx="85" cy="80" r="10" fill="white" />
                        <circle cx="85" cy="80" r="4" fill="black" />
                        <circle cx="115" cy="80" r="10" fill="white" />
                        <circle cx="115" cy="80" r="4" fill="black" />
                        {/* Cool Smile */}
                        <path d="M90 120 Q100 120 110 115" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
                        {/* Hair Spikes */}
                        <path d="M80 40 L90 10 L100 40 L110 10 L120 40" fill={colorSecondary} />
                    </svg>
                )
            };
        }

        // ADULT PHASE (20-29)
        if (level < 30) {
            // Shoulders broaden
            const width = 60 + (level - 20) * 2;
            return {
                title: "Dospělý",
                bgClass: "from-orange-300 to-red-500",
                svg: (
                    <svg viewBox="0 0 200 200" className="w-64 h-64 drop-shadow-2xl animate-float-slow">
                        {/* Tail */}
                        <path d="M60 150 Q20 180 40 120" stroke={colorSecondary} strokeWidth="15" strokeLinecap="round" fill="none"/>
                        {/* Body - Trapezoidish */}
                        <path d={`M${100-width} 80 L${100+width} 80 L140 160 L60 160 Z`} fill={colorPrimary} stroke={colorSecondary} strokeWidth="2" strokeLinejoin="round" />
                        <path d={`M${100-width+10} 80 L${100+width-10} 80 L130 160 L70 160 Z`} fill={colorBelly} opacity="0.5" />
                        {/* Head */}
                        <circle cx="100" cy="60" r="40" fill={colorPrimary} />
                        {/* Eyes - Angry/Determined */}
                        <path d="M80 50 L95 60" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M120 50 L105 60" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                        <circle cx="90" cy="65" r="5" fill="black" />
                        <circle cx="110" cy="65" r="5" fill="black" />
                        {/* Arms with muscles */}
                        <path d={`M${100-width} 90 Q${60-width} 120 ${80-width} 140`} stroke={colorSecondary} strokeWidth="18" strokeLinecap="round" fill="none"/>
                        <path d={`M${100+width} 90 Q${140+width} 120 ${120+width} 140`} stroke={colorSecondary} strokeWidth="18" strokeLinecap="round" fill="none"/>
                    </svg>
                )
            };
        }

        // MYTHIC PHASE (30+)
        // Complex shape with wings
        return {
            title: "Legenda",
            bgClass: "from-slate-900 via-purple-900 to-black",
            svg: (
                <svg viewBox="0 0 300 300" className="w-80 h-80 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-float-fast">
                    <defs>
                        <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colorSecondary} stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    {/* Aura */}
                    <circle cx="150" cy="150" r="120" fill="none" stroke={colorSecondary} strokeWidth="2" strokeDasharray="10 5" className="animate-spin-slow opacity-50"/>
                    
                    {/* Wings (Grow with level) */}
                    <path d="M100 120 Q50 50 20 80 Q50 150 100 160" fill="url(#wingGrad)" />
                    <path d="M200 120 Q250 50 280 80 Q250 150 200 160" fill="url(#wingGrad)" />

                    {/* Main Body - Complex */}
                    <path d="M150 60 L190 100 L180 200 L120 200 L110 100 Z" fill={colorPrimary} />
                    <circle cx="150" cy="150" r="30" fill={colorBelly} className="animate-pulse" />
                    
                    {/* Horns */}
                    <path d="M130 60 L120 20 L140 50" fill="gold" />
                    <path d="M170 60 L180 20 L160 50" fill="gold" />

                    {/* Glowing Eyes */}
                    <ellipse cx="140" cy="90" rx="8" ry="12" fill="white" className="animate-pulse" />
                    <ellipse cx="160" cy="90" rx="8" ry="12" fill="white" className="animate-pulse" />
                </svg>
            )
        };
    };

    const petVisuals = myPet ? getVectorPetProps(myPet.stage) : getVectorPetProps(1);

    // Dynamic transform for interactions
    const getInteractionTransform = () => {
        let transform = `scale(1)`;
        if (animationState === 'EATING') transform += ' scale(1.1) rotate(-5deg)';
        if (animationState === 'PLAYING') transform += ' scale(1.1) rotate(10deg)';
        if (animationState === 'PETTING') transform += ' scale(1.05) rotate(5deg)';
        return transform;
    };

    if (!currentUser) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className={`w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col h-[90vh] border-[6px] border-white/20 transition-all duration-1000 bg-gradient-to-b ${petVisuals.bgClass}`}>
                
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {myPet && myPet.stage >= 30 && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 animate-pulse"></div>}
                    {myPet && myPet.stage >= 10 && myPet.stage < 20 && <div className="absolute top-10 left-10 text-white/20 text-4xl animate-float-slow">🎵</div>}
                    {myPet && myPet.stage < 10 && <div className="absolute top-20 right-20 text-white/20 text-4xl animate-bounce-slow">☁️</div>}
                </div>

                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/20 text-white rounded-full hover:bg-white/20 transition-colors z-50 backdrop-blur-sm"><X size={24}/></button>

                {(!myPet || view === 'ADOPT') ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-20">
                        <h2 className="text-4xl font-display font-bold text-white mb-2 drop-shadow-md">Nový kamarád</h2>
                        <input type="text" placeholder="Jméno mazlíčka..." value={petName} onChange={e => setPetName(e.target.value)} className="p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder-indigo-200 text-center font-bold text-xl w-full mb-6 focus:ring-4 focus:ring-white/30 outline-none backdrop-blur-sm"/>
                        {message && <p className="text-red-300 font-bold bg-black/40 px-4 py-2 rounded-lg mb-4 animate-pulse">{message}</p>}
                        <div className="grid grid-cols-1 gap-4 w-full overflow-y-auto max-h-[40vh] pr-2">
                             {[{ type: PetType.DRAGON, label: 'Drak', img: PET_ASSETS.DRAGON, color: 'from-red-400 to-orange-500' }, { type: PetType.UNICORN, label: 'Jednorožec', img: PET_ASSETS.UNICORN, color: 'from-pink-400 to-purple-500' }, { type: PetType.DINO, label: 'Dino', img: PET_ASSETS.DINO, color: 'from-green-400 to-emerald-500' }].map((opt) => (
                                 <button key={opt.type} onClick={() => handleAdopt(opt.type)} className={`flex items-center justify-between p-3 bg-gradient-to-r ${opt.color} rounded-2xl shadow-lg transform hover:scale-105 transition-all active:scale-95 group border border-white/20 relative overflow-hidden`}>
                                     <div className="flex items-center gap-4 relative z-10"><img src={opt.img} alt={opt.label} className="w-16 h-16 drop-shadow-md group-hover:animate-bounce" /><span className="text-white font-bold text-xl text-shadow">{opt.label}</span></div>
                                     <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm relative z-10"><ArrowRight className="text-white" /></div>
                                 </button>
                             ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col relative">
                        {/* Header Stats */}
                        <div className="absolute top-0 left-0 w-full p-6 pt-8 z-30 flex justify-between items-start">
                            <div>
                                <h3 className="text-3xl font-display font-bold text-white drop-shadow-md flex items-center gap-2">{myPet.name} {isNight && <Moon size={20} className="text-blue-200 fill-blue-200 animate-pulse"/>}</h3>
                                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider shadow-sm block w-fit mt-1">Lvl {myPet.stage} • {petVisuals.title}</span>
                            </div>
                            <div className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2 w-32 shadow-lg">
                                {[{icon:Heart, color:'red', val:myPet.health, label:'Zdraví'}, {icon:Smile, color:'yellow', val:myPet.happiness, label:'Štěstí'}, {icon:Zap, color:'blue', val:myPet.experience % 100, label:'XP'}].map((s, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-[10px] text-white font-bold mb-0.5"><span className="flex items-center gap-1"><s.icon size={10} className={`text-${s.color}-400 fill-${s.color}-400`}/> {s.label}</span><span>{s.val}{s.label==='XP'?'/100':'%'}</span></div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r from-${s.color}-500 to-${s.color}-400 transition-all duration-500`} style={{width: `${s.val}%`}}></div></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PET SCENE */}
                        <div className="flex-1 relative flex items-center justify-center z-10 perspective-[1000px] overflow-hidden">
                            
                            {/* The Living Pet Container */}
                            <div 
                                onClick={handlePet}
                                className={`relative cursor-pointer select-none transition-transform duration-500 ${isNight ? 'animate-pulse-slow' : ''}`}
                                style={{ transform: getInteractionTransform() }}
                            >
                                {/* Vector SVG Pet */}
                                {petVisuals.svg}

                                {/* Status Effects */}
                                {isNight && <img src={ACCESSORIES.ZZZ} className="absolute -top-6 right-0 w-12 h-12 z-30 animate-bounce" alt="Zzz" />}
                                {floatingItem && (
                                    <div className={`absolute z-50 left-1/2 -translate-x-1/2 ${floatingItem.type === 'food' ? 'animate-feed-item' : floatingItem.type === 'toy' ? 'animate-play-item' : 'animate-love-item'}`}>
                                        <img src={floatingItem.src} alt="Item" className="w-24 h-24 drop-shadow-xl" />
                                    </div>
                                )}
                                
                                {/* Chat Bubble */}
                                {chatBubble && (
                                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-white text-brand-dark px-4 py-3 rounded-2xl rounded-bl-none font-bold text-sm shadow-xl whitespace-nowrap animate-scale-in z-50 border-2 border-indigo-100 max-w-[200px] text-center">
                                        {chatBubble}
                                    </div>
                                )}
                            </div>

                            {/* Floor/Shadow */}
                            <div className={`absolute bottom-24 w-64 h-16 blur-2xl rounded-[100%] transform rotate-x-[60deg] z-0 bg-black/20 transition-colors duration-1000`}></div>
                        </div>

                        {/* Controls */}
                        <div className="p-6 pb-8 bg-white/10 backdrop-blur-md border-t border-white/10 relative z-20 flex justify-between items-center gap-4">
                            <button onClick={handleFeed} disabled={isNight} className={`flex-1 group relative overflow-hidden p-4 rounded-2xl shadow-lg active:scale-95 transition-all border border-white/20 ${isNight ? 'bg-gray-600 grayscale cursor-not-allowed' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors"></div>
                                <div className="flex flex-col items-center relative z-10"><Utensils className="text-white mb-1 drop-shadow-md" size={28} /><span className="text-white font-bold text-sm">Nakrmit</span><span className="text-orange-100 text-[10px] font-bold bg-black/20 px-2 rounded-full mt-1 flex items-center gap-1"><Zap size={10} fill="currentColor"/> 10</span></div>
                            </button>
                            <button onClick={handlePlay} disabled={isNight} className={`flex-1 group relative overflow-hidden p-4 rounded-2xl shadow-lg active:scale-95 transition-all border border-white/20 ${isNight ? 'bg-gray-600 grayscale cursor-not-allowed' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors"></div>
                                <div className="flex flex-col items-center relative z-10"><Trophy className="text-white mb-1 drop-shadow-md" size={28} /><span className="text-white font-bold text-sm">Hrát si</span><span className="text-blue-100 text-[10px] font-bold bg-black/20 px-2 rounded-full mt-1 flex items-center gap-1"><Zap size={10} fill="currentColor"/> 5</span></div>
                            </button>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2"><Zap size={12} className="text-cyan-400 fill-cyan-400"/> {currentUser.petPoints || 0} energie</div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
                
                @keyframes float-medium { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
                .animate-float-medium { animation: float-medium 2s ease-in-out infinite; }

                @keyframes float-fast { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(2px, -2px); } 50% { transform: translate(-2px, 2px); } 75% { transform: translate(2px, 2px); } }
                .animate-float-fast { animation: float-fast 0.2s linear infinite; }

                @keyframes bounce-slow { 0%, 100% { transform: translateY(0) scale(1, 1); } 50% { transform: translateY(-20px) scale(1.05, 0.95); } }
                .animate-bounce-slow { animation: bounce-slow 1.5s ease-in-out infinite; }

                @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 10s linear infinite; }

                @keyframes feed-item { 0% { transform: translateY(100px) scale(0.5); opacity: 0; } 20% { transform: translateY(50px) scale(1); opacity: 1; } 80% { transform: translateY(0px) scale(0.8); opacity: 1; } 100% { transform: translateY(-20px) scale(0); opacity: 0; } }
                .animate-feed-item { animation: feed-item 1s ease-in-out forwards; }
                
                @keyframes play-item { 0% { transform: translate(-50px, 50px) rotate(-20deg); opacity: 0; } 20% { opacity: 1; } 50% { transform: translate(50px, -50px) rotate(20deg); } 100% { transform: translate(-20px, 0px) rotate(0deg) scale(0); opacity: 0; } }
                .animate-play-item { animation: play-item 1s ease-in-out forwards; }
                
                @keyframes love-item { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 50% { transform: translateY(-50px) scale(1.5); opacity: 1; } 100% { transform: translateY(-100px) scale(1); opacity: 0; } }
                .animate-love-item { animation: love-item 1s ease-in-out forwards; }
            `}</style>
        </div>
    );
};

export default PetRoom;
