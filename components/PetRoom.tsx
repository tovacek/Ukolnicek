
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Pet, PetStage, PetType } from '../types';
import { X, Heart, Zap, Sparkles, Utensils, Smile, Egg } from 'lucide-react';

interface PetRoomProps {
    onClose: () => void;
}

const PetRoom: React.FC<PetRoomProps> = ({ onClose }) => {
    const { currentUser, pets, adoptPet, feedPet, playWithPet } = useApp();
    const [view, setView] = useState<'HOME' | 'ADOPT'>('HOME');
    const [petName, setPetName] = useState('');
    const [message, setMessage] = useState('');
    
    const myPet = currentUser ? pets.find(p => p.childId === currentUser.id) : null;

    if (!currentUser) return null;

    const handleAdopt = async (type: PetType) => {
        if (!petName.trim()) {
            setMessage('Dej svému mazlíčkovi jméno!');
            return;
        }
        await adoptPet(type, petName);
        setView('HOME');
    };

    const handleFeed = async () => {
        if (!myPet) return;
        const res = await feedPet(myPet.id);
        setMessage(res.message);
        setTimeout(() => setMessage(''), 3000);
    };

    const handlePlay = async () => {
        if (!myPet) return;
        const res = await playWithPet(myPet.id);
        setMessage(res.message);
        setTimeout(() => setMessage(''), 3000);
    };

    // Render Assets Helper
    const renderPetVisual = (pet: Pet) => {
        const size = pet.stage === PetStage.EGG ? "text-8xl" : (pet.stage === PetStage.BABY ? "text-7xl" : "text-9xl");
        const animation = pet.stage === PetStage.EGG ? "animate-bounce" : "animate-pulse";
        
        if (pet.stage === PetStage.EGG) return <div className={`${size} ${animation}`}>🥚</div>;

        switch (pet.type) {
            case PetType.DRAGON:
                return <div className={`${size} ${animation}`}>{pet.stage === PetStage.BABY ? '🐉' : '🐲'}</div>;
            case PetType.UNICORN:
                return <div className={`${size} ${animation}`}>{pet.stage === PetStage.BABY ? '🦄' : '🎠'}</div>;
            case PetType.DINO:
                return <div className={`${size} ${animation}`}>{pet.stage === PetStage.BABY ? '🦖' : '🦕'}</div>;
            default: return <div>❓</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-indigo-100 to-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col h-[85vh] border-4 border-white">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 rounded-full hover:bg-white z-30"><X size={24}/></button>

                {/* ADOPTION SCREEN */}
                {(!myPet || view === 'ADOPT') && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-brand-dark mb-2">Vyber si vajíčko!</h2>
                            <p className="text-gray-500">O jaké zvířátko se chceš starat?</p>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder="Jméno mazlíčka..." 
                            value={petName} 
                            onChange={e => setPetName(e.target.value)} 
                            className="p-3 rounded-xl border-2 border-indigo-100 text-center font-bold text-lg w-full max-w-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                        {message && <p className="text-red-500 font-bold">{message}</p>}

                        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                             <button onClick={() => handleAdopt(PetType.DRAGON)} className="flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl transition-all font-bold text-lg text-left border-2 border-red-100 hover:border-red-300">
                                 <span className="text-4xl">🥚</span> Drak
                             </button>
                             <button onClick={() => handleAdopt(PetType.UNICORN)} className="flex items-center gap-4 p-4 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-2xl transition-all font-bold text-lg text-left border-2 border-pink-100 hover:border-pink-300">
                                 <span className="text-4xl">🥚</span> Jednorožec
                             </button>
                             <button onClick={() => handleAdopt(PetType.DINO)} className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl transition-all font-bold text-lg text-left border-2 border-green-100 hover:border-green-300">
                                 <span className="text-4xl">🥚</span> Dinosaurus
                             </button>
                        </div>
                    </div>
                )}

                {/* PET ROOM */}
                {myPet && view === 'HOME' && (
                    <div className="flex-1 flex flex-col relative h-full">
                        {/* Status Header */}
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl flex justify-between items-center mb-6 shadow-sm">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{myPet.name}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    {myPet.stage === PetStage.EGG ? 'Vajíčko' : (myPet.stage === PetStage.BABY ? 'Miminko' : 'Dospělý')}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-sm font-bold text-slate-600">XP: {myPet.experience}/100</div>
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-yellow" style={{width: `${Math.min(100, myPet.experience)}%`}}></div>
                                </div>
                            </div>
                        </div>

                        {/* Pet Visual Area */}
                        <div className="flex-1 flex items-center justify-center relative">
                            {/* Message Bubble */}
                            {message && (
                                <div className="absolute top-10 bg-white px-4 py-2 rounded-xl shadow-lg animate-bounce-short text-sm font-bold text-brand-dark z-20 border border-gray-100">
                                    {message}
                                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b border-r border-gray-100"></div>
                                </div>
                            )}
                            
                            {/* The Pet */}
                            <div className="transform transition-transform hover:scale-110 cursor-pointer active:scale-95 drop-shadow-2xl">
                                {renderPetVisual(myPet)}
                            </div>
                        </div>

                        {/* Stats & Controls */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-indigo-50">
                            {myPet.stage === PetStage.EGG ? (
                                <div className="text-center py-4">
                                    <p className="text-slate-500 italic mb-2">Vajíčko potřebuje teplo a péči...</p>
                                    <button onClick={handleFeed} className="w-full py-3 bg-brand-yellow text-brand-dark font-bold rounded-xl shadow hover:bg-yellow-400 transition-colors">
                                        Zahřívat (Krmit) - 10b
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-red-500 mb-1">
                                                <span className="flex items-center gap-1"><Heart size={12}/> Zdraví</span>
                                                <span>{myPet.health}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 transition-all duration-500" style={{width: `${myPet.health}%`}}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-yellow-500 mb-1">
                                                <span className="flex items-center gap-1"><Smile size={12}/> Štěstí</span>
                                                <span>{myPet.happiness}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-yellow-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-500 transition-all duration-500" style={{width: `${myPet.happiness}%`}}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={handleFeed} className="flex flex-col items-center justify-center p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl hover:bg-orange-100 hover:border-orange-200 transition-all active:scale-95 group">
                                            <Utensils className="text-orange-500 mb-1 group-hover:scale-110 transition-transform" size={28}/>
                                            <span className="font-bold text-orange-700">Nakrmit</span>
                                            <span className="text-xs text-orange-400 font-bold">-10 bodů</span>
                                        </button>
                                        <button onClick={handlePlay} className="flex flex-col items-center justify-center p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100 hover:border-blue-200 transition-all active:scale-95 group">
                                            <Zap className="text-blue-500 mb-1 group-hover:scale-110 transition-transform" size={28}/>
                                            <span className="font-bold text-blue-700">Hrát si</span>
                                            <span className="text-xs text-blue-400 font-bold">-5 bodů</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PetRoom;
