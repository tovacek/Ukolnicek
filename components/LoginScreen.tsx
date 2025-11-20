
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ShieldCheck, Baby, Lock, ArrowRight, X } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { users, login } = useApp();
  
  // Password Prompt State
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, userId: string | null, error: string }>({
    isOpen: false,
    userId: null,
    error: ''
  });
  const [inputPassword, setInputPassword] = useState('');

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.password) {
      setAuthModal({ isOpen: true, userId: userId, error: '' });
      setInputPassword('');
    } else {
      login(userId);
    }
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authModal.userId) return;
    
    const user = users.find(u => u.id === authModal.userId);
    if (user && user.password === inputPassword) {
       login(user.id);
    } else {
       setAuthModal(prev => ({ ...prev, error: 'Nesprávné heslo' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden relative">
        <div className="p-8 text-center">
          <h1 className="text-4xl font-display font-bold text-brand-dark mb-2">Úkolníček</h1>
          <p className="text-gray-500 mb-8">Vyberte svůj profil</p>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Rodiče
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {users.filter(u => u.role === UserRole.PARENT).map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 border border-gray-100 transition-all group w-full text-left"
                  >
                    <div className="flex items-center">
                        <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                        <span className="ml-4 font-medium text-gray-700 group-hover:text-indigo-600 text-lg">{user.name}</span>
                    </div>
                    {user.password && <Lock size={16} className="text-gray-300 mr-2"/>}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-2">
                <Baby className="w-4 h-4" /> Děti
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {users.filter(u => u.role === UserRole.CHILD).map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="flex flex-col items-center p-4 rounded-2xl bg-white border-2 border-transparent hover:border-brand-yellow hover:shadow-lg transition-all relative"
                  >
                    {user.password && (
                        <div className="absolute top-2 right-2 text-gray-300">
                            <Lock size={14} />
                        </div>
                    )}
                    <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full mb-2 object-cover" />
                    <span className="font-display font-bold text-gray-800">{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
          Demo verze • Powered by Gemini 2.5
        </div>

        {/* Password Modal */}
        {authModal.isOpen && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 animate-fade-in">
                <button 
                    onClick={() => setAuthModal({ isOpen: false, userId: null, error: '' })} 
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                >
                    <X size={20} className="text-gray-500"/>
                </button>
                
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                    <Lock size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Zadejte heslo</h3>
                <p className="text-sm text-gray-500 mb-6">Pro přihlášení je vyžadováno heslo</p>
                
                <form onSubmit={submitPassword} className="w-full max-w-xs">
                    <input 
                        type="password" 
                        autoFocus
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        className={`w-full p-4 bg-gray-50 border rounded-xl text-center text-xl font-bold text-gray-900 mb-2 focus:outline-none focus:ring-2 ${authModal.error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500'}`}
                        placeholder="••••"
                    />
                    {authModal.error && <p className="text-red-500 text-sm text-center mb-3">{authModal.error}</p>}
                    
                    <button 
                        type="submit"
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                        Přihlásit <ArrowRight size={18}/>
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
