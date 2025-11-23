import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ShieldCheck, Baby, Lock, ArrowRight, X, Home, LogOut, Sparkles, Star, CheckSquare } from 'lucide-react';

type LoginView = 'LANDING' | 'LOGIN' | 'REGISTER' | 'PROFILES';

const LoginScreen: React.FC = () => {
  const { users, selectProfile, loginFamily, registerFamily, logoutFamily, familyId } = useApp();
  
  const [view, setView] = useState<LoginView>('LANDING');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile PIN State
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, userId: string | null, error: string }>({
    isOpen: false,
    userId: null,
    error: ''
  });
  const [inputProfilePin, setInputProfilePin] = useState('');

  // --- HANDLERS ---

  const handleLoginFamily = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setAuthError('');
      
      const result = await loginFamily(email, password);
      if (result.success) {
          setView('PROFILES');
      } else {
          setAuthError(result.error || 'Chyba přihlášení');
      }
      setIsLoading(false);
  };

  const handleRegisterFamily = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setAuthError('');

      const result = await registerFamily(email, password, familyName);
      if (result.success) {
          await loginFamily(email, password);
          setView('PROFILES');
      } else {
          setAuthError(result.error || 'Chyba registrace');
      }
      setIsLoading(false);
  };

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    // Use PIN for profile lock if it exists and is not empty
    if (user && user.pin && user.pin.length > 0) {
      setAuthModal({ isOpen: true, userId: userId, error: '' });
      setInputProfilePin('');
    } else {
      selectProfile(userId);
    }
  };

  const submitProfilePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authModal.userId) return;
    
    const user = users.find(u => u.id === authModal.userId);
    if (user && user.pin === inputProfilePin) {
       selectProfile(user.id);
    } else {
       setAuthModal(prev => ({ ...prev, error: 'Nesprávný PIN' }));
    }
  };

  const handleLogoutFamily = () => {
      logoutFamily();
      setView('LANDING');
      setEmail('');
      setPassword('');
  };

  React.useEffect(() => {
      if (familyId && view !== 'PROFILES') {
          setView('PROFILES');
      }
  }, [familyId]);


  // --- VIEWS ---

  if (view === 'LANDING') {
      return (
          <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 flex flex-col">
              <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                  <h1 className="text-2xl font-display font-bold text-brand-dark">Úkolníček<span className="text-brand-yellow">.</span></h1>
                  <button onClick={() => setView('LOGIN')} className="px-6 py-2 rounded-full font-bold text-brand-blue hover:bg-blue-50 transition-colors">Přihlásit se</button>
              </header>
              <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-20">
                  <div className="mb-8 animate-bounce"><div className="inline-block p-6 bg-white rounded-[2rem] shadow-xl shadow-blue-200 transform -rotate-3"><Sparkles size={64} className="text-brand-yellow" /></div></div>
                  <h2 className="text-5xl md:text-7xl font-display font-bold text-slate-800 mb-6 leading-tight">Domácí povinnosti <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">hrou.</span></h2>
                  <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">Motivujte děti k plnění úkolů pomocí odměn. <br className="hidden md:block"/>Jednoduché, zábavné a vytvořené pro moderní rodiny.</p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      <button onClick={() => setView('REGISTER')} className="flex-1 py-4 bg-brand-dark text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all">Vytvořit novou rodinu</button>
                      <button onClick={() => setView('LOGIN')} className="flex-1 py-4 bg-white text-brand-dark rounded-2xl font-bold text-lg shadow-lg hover:bg-gray-50 transition-all">Mám účet</button>
                  </div>
                  <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
                      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm"><CheckSquare className="w-10 h-10 text-brand-blue mb-4" /><h3 className="font-bold text-lg mb-2">Přehledné úkoly</h3><p className="text-slate-500 text-sm">Jednoduchý seznam úkolů s fotkami pro potvrzení.</p></div>
                      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm"><Star className="w-10 h-10 text-brand-yellow mb-4" /><h3 className="font-bold text-lg mb-2">Motivace a body</h3><p className="text-slate-500 text-sm">Sbírání bodů a jejich výměna za skutečné odměny.</p></div>
                      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm"><Home className="w-10 h-10 text-brand-green mb-4" /><h3 className="font-bold text-lg mb-2">Pro celou rodinu</h3><p className="text-slate-500 text-sm">Jeden účet pro rodiče i všechny děti. Vše pohromadě.</p></div>
                  </div>
              </main>
          </div>
      );
  }

  if (view === 'LOGIN' || view === 'REGISTER') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8"><button onClick={() => setView('LANDING')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowRight size={20} className="rotate-180"/></button><h2 className="text-2xl font-display font-bold text-slate-800">{view === 'LOGIN' ? 'Přihlášení' : 'Registrace'}</h2><div className="w-10"></div></div>
                    <form onSubmit={view === 'LOGIN' ? handleLoginFamily : handleRegisterFamily} className="space-y-4">
                        {view === 'REGISTER' && (<div><label className="block text-sm font-bold text-slate-600 mb-1">Název rodiny</label><input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-slate-800" placeholder="např. Novákovi" value={familyName} onChange={e => setFamilyName(e.target.value)}/></div>)}
                        <div><label className="block text-sm font-bold text-slate-600 mb-1">Email rodiče</label><input type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-slate-800" placeholder="vas@email.cz" value={email} onChange={e => setEmail(e.target.value)}/></div>
                        <div><label className="block text-sm font-bold text-slate-600 mb-1">Heslo</label><input type="password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-slate-800" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}/></div>
                        {authError && (<div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold text-center">{authError}</div>)}
                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70">{isLoading ? 'Pracuji...' : (view === 'LOGIN' ? 'Vstoupit' : 'Založit účet')}</button>
                    </form>
                    <div className="mt-6 text-center"><p className="text-slate-500 text-sm">{view === 'LOGIN' ? 'Nemáte ještě účet?' : 'Už máte účet?'}<button onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="ml-2 font-bold text-brand-blue hover:underline">{view === 'LOGIN' ? 'Zaregistrujte se' : 'Přihlaste se'}</button></p></div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden relative">
        <div className="absolute top-4 right-4"><button onClick={handleLogoutFamily} className="text-slate-300 hover:text-slate-500 p-2" title="Odhlásit rodinu"><LogOut size={20} /></button></div>
        <div className="p-8 text-center">
          <h1 className="text-4xl font-display font-bold text-brand-dark mb-2">Kdo jsi?</h1>
          <p className="text-gray-500 mb-8">Vyberte svůj profil</p>

          {users.length === 0 ? (
              <div className="py-10"><div className="animate-spin w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-slate-400">Načítám rodinu...</p></div>
          ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Rodiče</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {users.filter(u => u.role === UserRole.PARENT).map(user => (
                        <button key={user.id} onClick={() => handleUserClick(user.id)} className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 border border-gray-100 transition-all group w-full text-left">
                            <div className="flex items-center"><img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" /><span className="ml-4 font-medium text-gray-700 group-hover:text-indigo-600 text-lg">{user.name}</span></div>
                            {user.pin && <Lock size={16} className="text-gray-300 mr-2"/>}
                        </button>
                        ))}
                    </div>
                </div>
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-2"><Baby className="w-4 h-4" /> Děti</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {users.filter(u => u.role === UserRole.CHILD).map(user => (
                        <button key={user.id} onClick={() => handleUserClick(user.id)} className="flex flex-col items-center p-4 rounded-2xl bg-white border-2 border-transparent hover:border-brand-yellow hover:shadow-lg transition-all relative">
                            {user.pin && (<div className="absolute top-2 right-2 text-gray-300"><Lock size={14} /></div>)}
                            <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full mb-2 object-cover" />
                            <span className="font-display font-bold text-gray-800">{user.name}</span>
                        </button>
                        ))}
                    </div>
                </div>
              </div>
          )}
        </div>

        {authModal.isOpen && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 animate-fade-in">
                <button onClick={() => setAuthModal({ isOpen: false, userId: null, error: '' })} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} className="text-gray-500"/></button>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600"><Lock size={32} /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Zadejte PIN</h3>
                <p className="text-sm text-gray-500 mb-6">Pro přihlášení k profilu</p>
                <form onSubmit={submitProfilePin} className="w-full max-w-xs">
                    <input type="password" autoFocus maxLength={4} value={inputProfilePin} onChange={(e) => setInputProfilePin(e.target.value)} className={`w-full p-4 bg-gray-50 border rounded-xl text-center text-xl font-bold text-gray-900 mb-2 focus:outline-none focus:ring-2 ${authModal.error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500'}`} placeholder="••••"/>
                    {authModal.error && <p className="text-red-500 text-sm text-center mb-3">{authModal.error}</p>}
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">Vstoupit <ArrowRight size={18}/></button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;