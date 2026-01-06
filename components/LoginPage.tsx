
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
  error?: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin(username.trim().toLowerCase(), password.trim());
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background with "Wow" Logistics Imagery */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop")',
          filter: 'brightness(0.4) saturate(1.2)'
        }}
      />
      
      {/* Dynamic Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-[#5851FF]/20 z-1" />

      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#5851FF]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scaleIn border border-white/20">
        <div className="bg-[#5851FF] p-10 flex flex-col items-center relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/20 relative z-10">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter text-center relative z-10">DistriGestión <span className="opacity-70 font-light">v1.0</span></h1>
          <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-2 relative z-10">Desarrollado por Ilde</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-slideIn">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <p className="text-[11px] font-black text-rose-600 uppercase tracking-tight">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Identificador</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <input 
                type="text" 
                autoFocus
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-[#5851FF] transition-all placeholder:text-slate-300"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Clave de Acceso</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <input 
                type="password" 
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-[#5851FF] transition-all placeholder:text-slate-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#5851FF] hover:bg-[#4a44d4] text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 transform active:scale-[0.98] mt-2 group"
          >
            <span className="flex items-center justify-center gap-2">
              Ingresar al Panel
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </span>
          </button>

          <div className="pt-6 text-center border-t border-slate-100 mt-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
              Control de distribución de mercancías<br/>
              <span className="text-slate-300">© 2025 Sistema DistriGestión</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
