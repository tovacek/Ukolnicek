
import React, { useState, useEffect } from 'react';
import { X, Trophy, Clock, Brain, Languages, Check, AlertTriangle } from 'lucide-react';
import { generateQuestion, Question, QuestionType } from '../services/gameQuestions';
import { useApp } from '../context/AppContext';

interface TowerGameProps {
    onClose: () => void;
}

const TowerGame: React.FC<TowerGameProps> = ({ onClose }) => {
    const { saveGameResult, currentUser } = useApp();
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [highScore, setHighScore] = useState(0); 
    const [blocks, setBlocks] = useState<number[]>([]);
    const [category, setCategory] = useState<QuestionType>('MATH');
    
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [timeLeft, setTimeLeft] = useState(5);
    const [gameOverReason, setGameOverReason] = useState('');
    const [rewardMessage, setRewardMessage] = useState('');

    useEffect(() => {
        let timer: any;
        if (gameState === 'PLAYING' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'PLAYING') {
            endGame("Čas vypršel!");
        }
        return () => clearInterval(timer);
    }, [timeLeft, gameState]);

    const startGame = (type: QuestionType) => {
        setCategory(type);
        const currentRecord = type === 'MATH' 
            ? (currentUser?.towerHighScoreMath || 0) 
            : (currentUser?.towerHighScoreEnglish || 0);
        setHighScore(currentRecord);

        setScore(0);
        setCorrectCount(0);
        setIncorrectCount(0);
        setBlocks([]);
        setGameState('PLAYING');
        nextQuestion(type);
    };

    const nextQuestion = (type: QuestionType) => {
        const q = generateQuestion(type);
        setCurrentQuestion(q);
        setTimeLeft(5); 
    };

    const handleAnswer = (answer: string) => {
        if (!currentQuestion) return;

        if (answer === currentQuestion.correctAnswer) {
            const newScore = score + 1;
            setScore(newScore);
            setCorrectCount(prev => prev + 1);
            setBlocks(prev => [...prev, Date.now()]);
            nextQuestion(category);
        } else {
            if (score > 0) {
                setScore(prev => prev - 1);
                setBlocks(prev => prev.slice(0, -1));
            }
            setIncorrectCount(prev => prev + 1);
            nextQuestion(category);
        }
    };

    const endGame = async (reason: string) => {
        setGameState('GAMEOVER');
        setGameOverReason(reason);
        
        const { isNewRecord, reward } = await saveGameResult(score, correctCount, incorrectCount, category);
        
        let msg = "";
        if (reward > 0) msg = `Perfektní hra! Získáváš +${reward} Kč!`;
        else if (isNewRecord) msg = "Nový rekord!";
        
        setRewardMessage(msg);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col h-[80vh]">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-30"><X size={24}/></button>

                {gameState === 'MENU' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                        <div>
                            <h2 className="text-4xl font-display font-bold text-brand-dark mb-2">Stavitel Věže</h2>
                            <p className="text-gray-500">Odpovídej správně a postav nejvyšší věž!</p>
                            <p className="text-xs text-green-600 font-bold mt-2 bg-green-50 inline-block px-3 py-1 rounded-full">Bonus: 10 Kč za hru bez chyb!</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                 <div className="text-xs font-bold text-blue-400 uppercase mb-1">Matematika</div>
                                 <div className="text-xl font-bold text-brand-dark flex items-center justify-center gap-2">
                                     <Trophy size={16} className="text-yellow-500"/> {currentUser?.towerHighScoreMath || 0}
                                 </div>
                             </div>
                             <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
                                 <div className="text-xs font-bold text-purple-400 uppercase mb-1">Angličtina</div>
                                 <div className="text-xl font-bold text-brand-dark flex items-center justify-center gap-2">
                                     <Trophy size={16} className="text-yellow-500"/> {currentUser?.towerHighScoreEnglish || 0}
                                 </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                            <button onClick={() => startGame('MATH')} className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-all font-bold text-lg text-left">
                                <div className="bg-white p-2 rounded-lg"><Brain size={24}/></div> Matematika
                            </button>
                            <button onClick={() => startGame('ENGLISH')} className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl transition-all font-bold text-lg text-left">
                                <div className="bg-white p-2 rounded-lg"><Languages size={24}/></div> Angličtina
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'PLAYING' && (
                    <div className="flex-1 flex flex-col relative">
                        {/* Game Header */}
                        <div className="flex justify-between items-center mb-4 z-10 relative">
                            <div className="font-bold text-xl text-brand-dark bg-white/80 px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                Skóre: {score}
                            </div>
                            <div className={`flex items-center gap-2 font-bold text-xl px-3 py-1 rounded-full bg-white/80 shadow-sm border border-gray-100 ${timeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-brand-blue'}`}>
                                <Clock size={20}/> {timeLeft}s
                            </div>
                            <div className="w-10"></div>
                        </div>

                        {/* Tower Visuals */}
                        <div className="flex-1 bg-sky-50 rounded-2xl border border-sky-100 relative overflow-hidden flex flex-col-reverse items-center justify-start p-4 mb-4 shadow-inner">
                             <div className="w-full h-4 bg-green-400 absolute bottom-0 left-0"></div>
                             <div className="flex flex-col-reverse w-full items-center transition-all duration-300 pb-4">
                                 {blocks.map((id, index) => (
                                     <div key={id} className="w-32 h-10 bg-gradient-to-r from-orange-400 to-orange-500 border-2 border-orange-600 rounded-md shadow-sm mb-0.5 animate-bounce-short flex items-center justify-center text-white font-bold text-xs z-10">
                                         {index + 1}
                                     </div>
                                 ))}
                             </div>
                             <div className="absolute top-10 left-10 text-white opacity-40"><span className="text-4xl">☁️</span></div>
                             <div className="absolute top-20 right-10 text-white opacity-40"><span className="text-3xl">☁️</span></div>
                        </div>

                        {/* Question Area */}
                        {currentQuestion && (
                            <div className="z-20 bg-white p-2">
                                <h3 className="text-center text-xl font-bold text-slate-800 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">{currentQuestion.text}</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {currentQuestion.options.map((opt, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleAnswer(opt)}
                                            className="py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'GAMEOVER' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-in">
                        <div className="text-6xl mb-4">🏁</div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Hra skončila</h2>
                        <p className="text-red-500 font-bold text-lg mb-6">{gameOverReason}</p>
                        
                        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-green-700">
                                <div className="text-xs font-bold uppercase mb-1 flex items-center justify-center gap-1"><Check size={12}/> Správně</div>
                                <div className="text-2xl font-bold">{correctCount}</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-red-700">
                                <div className="text-xs font-bold uppercase mb-1 flex items-center justify-center gap-1"><AlertTriangle size={12}/> Chyby</div>
                                <div className="text-2xl font-bold">{incorrectCount}</div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl w-full max-w-xs mb-6 border border-slate-200">
                            <div className="text-sm text-slate-500 uppercase font-bold mb-1">Tvoje věž</div>
                            <div className="text-4xl font-bold text-brand-dark mb-2">{score} pater</div>
                            {rewardMessage && (
                                <div className="bg-green-100 text-green-700 p-2 rounded-lg font-bold text-sm animate-pulse border border-green-200">
                                    {rewardMessage}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 w-full max-w-xs">
                             <button onClick={() => setGameState('MENU')} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">Zpět</button>
                             <button onClick={() => startGame(category)} className="flex-1 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-600">Znovu</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TowerGame;
