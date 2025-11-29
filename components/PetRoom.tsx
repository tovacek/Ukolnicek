
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Pet, PetStage, PetType } from '../types';
import { X, Heart, Zap, Utensils, Smile, ArrowRight, Sparkles, Trophy, Moon, Sun, MessageCircle } from 'lucide-react';

interface PetRoomProps {
    onClose: () => void;
}

const PetRoom: React.FC<PetRoomProps> = ({ onClose }) => {
    const { currentUser, pets, adoptPet, feedPet, playWithPet } = useApp();
    const [view, setView] = useState<'HOME' | 'ADOPT'>('HOME');
    const [petName, setPetName] = useState('');
    const [message, setMessage] = useState('');
    const [animationClass, setAnimationClass] = useState('');
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

    const ACCESSORIES = {
        CROWN: `${BASE_URL}/Objects/Crown.png`,
        WAND: `${BASE_URL}/Activities/Magic Wand.png`,
        GLASSES: `${BASE_URL}/Objects/Glasses.png`,
        HAT: `${BASE_URL}/Objects/Top Hat.png`,
        BOW: `${BASE_URL}/Objects/Ribbon.png`,
        FIRE: `${BASE_URL}/Travel%20and%20places/Fire.png`,
        SNOWFLAKE: `${BASE_URL}/Travel%20and%20places/Snowflake.png`,
        ZZZ: `${BASE_URL}/Smilies/Zzz.png`,
        SPARKLES: `${BASE_URL}/Activities/Sparkles.png`
    };

    const INTERACTION_ASSETS = {
        FOOD: [`${BASE_URL}/Food/Red Apple.png`, `${BASE_URL}/Food/Hamburger.png`, `${BASE_URL}/Food/Birthday Cake.png`, `${BASE_URL}/Food/Pizza.png`, `${BASE_URL}/Food/Sushi.png`],
        TOY: [`${BASE_URL}/Activities/Tennis Ball.png`, `${BASE_URL}/Activities/Kite.png`, `${BASE_URL}/Activities/Joystick.png`, `${BASE_URL}/Activities/Soccer Ball.png`, `${BASE_URL}/Activities/Trophy.png`]
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
        if (hour >= 21 || hour < 7) { setChatBubble("Jsem unavený... 😴"); return; }

        const phrases = [
            `Jsi nejlepší, ${currentUser?.name || 'kamaráde'}! ❤️`,
            "Kdy si budeme hrát? 🎾",
            `Můj level ${myPet.stage} je super! 🚀`,
            "Podívej, jak rostou! 💪",
            "Co budeme dělat? 🤔"
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

    const triggerAnimation = (type: string) => {
        setAnimationClass(type);
        setTimeout(() => setAnimationClass(''), 1000);
    };

    const handleFeed = async () => {
        if (!myPet || isNight) return;
        triggerAnimation('eating');
        const itemSrc = INTERACTION_ASSETS.FOOD[Math.floor(Math.random() * INTERACTION_ASSETS.FOOD.length)];
        setFloatingItem({ src: itemSrc, type: 'food' });
        setTimeout(() => setFloatingItem(null), 1000);

        const res = await feedPet(myPet.id);
        if (res.success) {
             setChatBubble("Mňam! To bylo dobré! 😋");
             setTimeout(() => setChatBubble(null), 2000);
        } else {
             setMessage(res.message);
             setTimeout(() => setMessage(''), 3000);
        }
    };

    const handlePlay = async () => {
        if (!myPet || isNight) return;
        triggerAnimation('playing');
        const itemSrc = INTERACTION_ASSETS.TOY[Math.floor(Math.random() * INTERACTION_ASSETS.TOY.length)];
        setFloatingItem({ src: itemSrc, type: 'toy' });
        setTimeout(() => setFloatingItem(null), 1000);

        const res = await playWithPet(myPet.id);
         if (res.success) {
             setChatBubble("Jupí! To je zábava! 🤪");
             setTimeout(() => setChatBubble(null), 2000);
        } else {
             setMessage(res.message);
             setTimeout(() => setMessage(''), 3000);
        }
    };

    const handlePet = () => {
        if (!myPet) return;
        triggerAnimation('petting');
        setChatBubble("To lechtá! Hihi ❤️");
        setTimeout(() => setChatBubble(null), 2000);
        setFloatingItem({ src: `${BASE_URL}/Smilies/Heart%20with%20Arrow.png`, type: 'love' });
        setTimeout(() => setFloatingItem(null), 1000);
    };

    const getPetImageSrc = (pet: Pet) => {
        if (pet.stage === 1) return PET_ASSETS.EGG;
        switch (pet.type) {
            case PetType.DRAGON: return PET_ASSETS.DRAGON;
            case PetType.UNICORN: return PET_ASSETS.UNICORN;
            case PetType.DINO: return PET_ASSETS.DINO;
            default: return PET_ASSETS.EGG;
        }
    };

    // --- PROCEDURAL EVOLUTION SYSTEM ---
    const getEvolutionStyles = (stage: number) => {
        // 1. Color Shift (Hue Rotation)
        // Every level shifts hue by 15 degrees, creating a rainbow cycle over levels
        const hue = (stage * 15) % 360;
        const saturate = 1 + (stage * 0.02); // Slightly more vivid each level
        const filter = `hue-rotate(${hue}deg) saturate(${saturate})`;

        // 2. Shape Morphing (Squash & Stretch via Scale)
        // This simulates changing body types: 
        // 0: Balanced, 1: Fat/Wide, 2: Tall/Thin, 3: Big/Muscular, 4: Compact
        let scaleX = 1;
        let scaleY = 1;
        const morphPhase = stage % 5;
        
        if (stage > 2) { // Start morphing after baby phase
            if (morphPhase === 1) { scaleX = 1.15; scaleY = 0.9; } // Chunky
            if (morphPhase === 2) { scaleX = 0.9; scaleY = 1.15; } // Lanky
            if (morphPhase === 3) { scaleX = 1.1; scaleY = 1.1; } // Big
            if (morphPhase === 4) { scaleX = 0.95; scaleY = 0.95; } // Small
        }

        // 3. Continuous Size Growth
        // Base starts at 0.8, grows 3% every level. Cap at 2.5x
        const baseSize = Math.min(2.5, 0.8 + (stage * 0.03));
        const transform = `scale(${baseSize}) scaleX(${scaleX}) scaleY(${scaleY})`;

        // 4. Titles & Environment
        let title = "Vajíčko";
        let bgGradient = 'from-indigo-500 to-slate-900';
        let floorColor = 'bg-black/40';
        let accessory = null;
        let particle = null;

        const titles = [
            "Vajíčko", "Miminko", "Batole", "Rošťák", "Průzkumník", 
            "Učeň", "Tovaryš", "Bojovník", "Mistr", "Velmistr", 
            "Hrdina", "Legendární", "Mytický", "Božský", "Nesmrtelný",
            "Vládce", "Titán", "Kolos", "Vesmírný", "Nekonečný"
        ];
        // Title changes every 3 levels approximately
        const titleIdx = Math.min(titles.length - 1, Math.floor((stage - 1) / 3));
        title = titles[titleIdx];

        if (stage < 5) {
            bgGradient = 'from-sky-300 to-indigo-400';
        } else if (stage < 10) {
            bgGradient = 'from-green-400 to-teal-600';
            accessory = ACCESSORIES.HAT;
            floorColor = 'bg-green-900/20';
        } else if (stage < 15) {
            bgGradient = 'from-orange-400 to-red-600';
            accessory = ACCESSORIES.FIRE;
            floorColor = 'bg-red-900/20';
        } else if (stage < 20) {
            bgGradient = 'from-cyan-400 to-blue-800';
            accessory = ACCESSORIES.GLASSES;
            particle = ACCESSORIES.SNOWFLAKE;
            floorColor = 'bg-cyan-900/20';
        } else if (stage < 30) {
            bgGradient = 'from-purple-500 to-pink-600';
            accessory = ACCESSORIES.WAND;
            particle = ACCESSORIES.SPARKLES;
        } else if (stage < 40) {
            bgGradient = 'from-yellow-500 to-amber-700';
            accessory = ACCESSORIES.CROWN;
            particle = ACCESSORIES.SPARKLES;
            floorColor = 'bg-yellow-900/20';
        } else {
            bgGradient = 'from-slate-900 via-purple-900 to-black';
            accessory = ACCESSORIES.CROWN;
            particle = ACCESSORIES.WAND;
            floorColor = 'bg-purple-500/20';
        }

        if (isNight) bgGradient = 'from-slate-900 to-black';

        return { filter, transform, bgGradient, floorColor, accessory, particle, title };
    };

    const evo = myPet ? getEvolutionStyles(myPet.stage) : getEvolutionStyles(1);

    if (!currentUser) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-[90vh] border-8 border-white/10 ring-1 ring-white/20 transition-all duration-1000 bg-gradient-to-b ${evo.bgGradient}`}>
                
                {myPet && myPet.stage >= 40 && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 animate-pulse-slow"></div>}
                
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/20 text-white rounded-full hover:bg-white/20 transition-colors z-50 backdrop-blur-sm"><X size={24}/></button>

                {(!myPet || view === 'ADOPT') && (
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
                )}

                {myPet && view === 'HOME' && (
                    <div className="flex-1 flex flex-col relative">
                        <div className="absolute top-0 left-0 w-full p-6 pt-8 z-30 flex justify-between items-start">
                            <div>
                                <h3 className="text-3xl font-display font-bold text-white drop-shadow-md flex items-center gap-2">{myPet.name} {isNight && <Moon size={20} className="text-blue-200 fill-blue-200 animate-pulse"/>}</h3>
                                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider shadow-sm block w-fit mt-1">Lvl {myPet.stage} • {evo.title}</span>
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

                        <div className="flex-1 relative flex items-center justify-center z-10 perspective-[1000px] overflow-hidden">
                            <div onClick={handlePet} className={`relative transition-all duration-700 ease-out cursor-pointer select-none ${animationClass === 'eating' ? 'scale-110' : animationClass === 'playing' ? 'animate-bounce' : animationClass === 'petting' ? 'scale-105 rotate-3' : 'animate-pulse-slow'}`} style={{ transform: evo.transform }}>
                                {evo.accessory && <img src={evo.accessory} className="absolute -top-16 left-1/2 -translate-x-1/2 w-20 h-20 z-20 drop-shadow-lg" alt="Acc" />}
                                {evo.particle && <img src={evo.particle} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] z-0 opacity-60 animate-pulse" alt="Part" />}
                                <img src={getPetImageSrc(myPet)} alt="Pet" className="object-contain relative z-10" style={{ filter: `${evo.filter} drop-shadow(0px 10px 20px rgba(0,0,0,0.5))`, width: '12rem', height: '12rem' }} />
                                {isNight && <img src={ACCESSORIES.ZZZ} className="absolute -top-10 right-0 w-12 h-12 z-30 animate-bounce" alt="Zzz" />}
                                {floatingItem && <div className={`absolute z-50 left-1/2 -translate-x-1/2 ${floatingItem.type === 'food' ? 'animate-feed-item' : floatingItem.type === 'toy' ? 'animate-play-item' : 'animate-love-item'}`}><img src={floatingItem.src} alt="Item" className="w-24 h-24 drop-shadow-xl" /></div>}
                                {chatBubble && <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-white text-brand-dark px-4 py-3 rounded-2xl rounded-bl-none font-bold text-sm shadow-xl whitespace-nowrap animate-scale-in z-50 border-2 border-indigo-100 max-w-[200px] text-center">{chatBubble}</div>}
                            </div>
                            <div className={`absolute bottom-24 w-64 h-16 blur-2xl rounded-[100%] transform rotate-x-[60deg] z-0 ${evo.floorColor} transition-colors duration-1000`}></div>
                        </div>

                        <div className="p-6 pb-8 bg-white/10 backdrop-blur-md border-t border-white/10 relative z-20 flex justify-between items-center gap-4">
                            <button onClick={handleFeed} className={`flex-1 group relative overflow-hidden p-4 rounded-2xl shadow-lg active:scale-95 transition-all border border-white/20 ${isNight ? 'bg-gray-600 grayscale cursor-not-allowed' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors"></div>
                                <div className="flex flex-col items-center relative z-10"><Utensils className="text-white mb-1 drop-shadow-md" size={28} /><span className="text-white font-bold text-sm">Nakrmit</span><span className="text-orange-100 text-[10px] font-bold bg-black/20 px-2 rounded-full mt-1 flex items-center gap-1"><Zap size={10} fill="currentColor"/> 10</span></div>
                            </button>
                            <button onClick={handlePlay} className={`flex-1 group relative overflow-hidden p-4 rounded-2xl shadow-lg active:scale-95 transition-all border border-white/20 ${isNight ? 'bg-gray-600 grayscale cursor-not-allowed' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors"></div>
                                <div className="flex flex-col items-center relative z-10"><Trophy className="text-white mb-1 drop-shadow-md" size={28} /><span className="text-white font-bold text-sm">Hrát si</span><span className="text-blue-100 text-[10px] font-bold bg-black/20 px-2 rounded-full mt-1 flex items-center gap-1"><Zap size={10} fill="currentColor"/> 5</span></div>
                            </button>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2"><Zap size={12} className="text-cyan-400 fill-cyan-400"/> {currentUser.petPoints || 0} energie</div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes pulse-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
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
