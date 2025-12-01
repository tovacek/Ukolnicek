
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

    // --- ASSETS CONFIG ---
    const BASE_URL = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis";
    
    const PET_ASSETS = {
        EGG: `${BASE_URL}/Food/Egg.png`,
        DRAGON: `${BASE_URL}/Animals/Dragon.png`,
        UNICORN: `${BASE_URL}/Animals/Unicorn.png`,
        DINO: `${BASE_URL}/Animals/T-Rex.png`
    };

    const ACCESSORIES = {
        CROWN: `${BASE_URL}/Objects/Crown.png`,
        GLASSES: `${BASE_URL}/Objects/Glasses.png`,
        HAT: `${BASE_URL}/Objects/Top Hat.png`,
        ZZZ: `${BASE_URL}/Smilies/Zzz.png`,
        SPARKLES: `${BASE_URL}/Activities/Sparkles.png`
    };

    // Initial Setup
    useEffect(() => {
        if (!myPet) setView('ADOPT');
        
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 7) setIsLightsOut(true);

        if (myPet && myPet.happiness < 50) {
            setPoopCount(Math.floor(Math.random() * 2) + 1);
        }

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
            `Lvl ${myPet.stage} je super! 🚀`,
            "Sleduj mě! 👀",
            "Mám plno energie! ⚡",
            "Jsi můj nejlepší kámoš ❤️",
            "Co budeme dělat? 🤔"
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
            playWithPet(myPet.id); 
        }, 2000);
    };

    const toggleSleep = () => {
        setIsLightsOut(!isLightsOut);
        setAnimationState(isLightsOut ? 'IDLE' : 'SLEEPING');
    };

    // --- PROCEDURAL EVOLUTION ENGINE ---
    // Calculates visual properties based on level to ensure distinct look every stage
    const getPetVisuals = (stage: number, type: PetType) => {
        // 1. Color Shift (Hue Rotation)
        // Every level shifts hue by 15 degrees. 
        // Lvl 1: Normal, Lvl 10: Green-ish, Lvl 20: Blue-ish
        const hue = (stage * 15) % 360;
        const filter = `hue-rotate(${hue}deg)`;

        // 2. Shape Morphing (Scale X/Y)
        // Lvl 2-9: Baby (Fat/Short)
        // Lvl 10-19: Teen (Thin/Tall)
        // Lvl 20+: Adult (Normal/Large)
        // Lvl 30+: Mythic (Wide/Strong)
        let scaleX = 1;
        let scaleY = 1;
        
        if (stage >= 2 && stage < 10) { scaleX = 1.15; scaleY = 0.9; } // Baby
        else if (stage >= 10 && stage < 20) { scaleX = 0.9; scaleY = 1.1; } // Teen
        else if (stage >= 30) { scaleX = 1.2; scaleY = 1.1; } // Mythic

        // 3. Continuous Growth
        const baseSize = Math.min(2.0, 0.8 + (stage * 0.05)); // Grows 5% every level
        const transform = `scale(${baseSize}) scaleX(${scaleX}) scaleY(${scaleY})`;

        // 4. Source Image
        let src = PET_ASSETS.EGG;
        if (stage > 1) {
            switch(type) {
                case PetType.DRAGON: src = PET_ASSETS.DRAGON; break;
                case PetType.UNICORN: src = PET_ASSETS.UNICORN; break;
                case PetType.DINO: src = PET_ASSETS.DINO; break;
            }
        }

        // 5. Titles
        const titles = ["Vajíčko", "Miminko", "Batole", "Rošťák", "Průzkumník", "Teenager", "Rebel", "Bojovník", "Dospělý", "Mistr", "Legenda", "Titán", "Mytický", "Božský"];
        const titleIndex = Math.min(titles.length - 1, Math.floor((stage - 1) / 3));

        return { src, filter, transform, title: titles[titleIndex] };
    };

    // --- ELEMENTAL THEMES ---
    const getTheme = (type: PetType) => {
        switch (type) {
            case PetType.DRAGON: return {
                device: 'bg-red-100 border-red-300',
                screen: 'bg-gradient-to-b from-orange-900 to-red-900',
                floor: 'bg-orange-600/30',
                particles: '🌋'
            };
            case PetType.UNICORN: return {
                device: 'bg-purple-100 border-purple-300',
                screen: 'bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-200',
                floor: 'bg-white/40',
                particles: '✨'
            };
            case PetType.DINO: return {
                device: 'bg-green-100 border-green-300',
                screen: 'bg-gradient-to-b from-emerald-800 to-green-600',
                floor: 'bg-emerald-900/40',
                particles: '🍃'
            };
            default: return {
                device: 'bg-slate-200 border-slate-300',
                screen: 'bg-gradient-to-b from-blue-200 to-white',
                floor: 'bg-green-600/20',
                particles: ''
            };
        }
    };

    if (!currentUser) return null;
    const theme = myPet ? getTheme(myPet.type) : getTheme(PetType.DINO);
    const visuals = myPet ? getPetVisuals(myPet.stage, myPet.type) : getPetVisuals(1, PetType.DINO);

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
                                
                                {/* Living Pet Container */}
                                <div className={`relative transition-transform duration-500 z-10
                                    ${animationState === 'WALK' ? 'animate-bounce-slow' : ''}
                                    ${animationState === 'EATING' ? 'scale-110' : ''}
                                    ${animationState === 'SLEEPING' ? 'scale-90 opacity-80' : 'animate-float-fast'}
                                    ${animationState === 'CLEANING' ? 'translate-x-10' : ''}
                                `} style={{ transform: visuals.transform }}>
                                    
                                    {/* Accessory Layers */}
                                    {myPet.stage >= 10 && <img src={ACCESSORIES.GLASSES} className="absolute top-1/4 left-1/2 -translate-x-1/2 w-1/2 z-20" alt="Glasses" />}
                                    {myPet.stage >= 20 && <img src={ACCESSORIES.CROWN} className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-1/2 z-20" alt="Crown" />}
                                    
                                    {/* Main Pet Body with Hue Shift */}
                                    <img 
                                        src={visuals.src} 
                                        alt="Pet" 
                                        className="w-32 h-32 object-contain drop-shadow-xl"
                                        style={{ filter: visuals.filter }}
                                    />
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
                                    Lvl {myPet.stage} • {visuals.title}
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
            `}</style>
        </div>
    );
};

export default PetRoom;
