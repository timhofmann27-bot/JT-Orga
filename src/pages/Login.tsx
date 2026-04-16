import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Calendar, Lock, User, Shield } from 'lucide-react';

export default function Login() {
  const [loginType, setLoginType] = useState<'person' | 'admin'>('person');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // The previous code used /api/auth/login for admin and /api/public/login for person
    const endpoint = loginType === 'admin' ? '/api/auth/login' : '/api/public/login';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        toast.success('Erfolgreich angemeldet', {
          style: { background: '#333', color: '#fff', borderRadius: '12px' }
        });
        if (loginType === 'admin') {
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Login fehlgeschlagen', {
          style: { background: '#333', color: '#fff', borderRadius: '12px' }
        });
      }
    } catch (e) {
      toast.error('Netzwerkfehler', {
        style: { background: '#333', color: '#fff', borderRadius: '12px' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-white/30 relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-white/[0.01] blur-[120px] rounded-full" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-white/[0.01] blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-16 space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-24 h-24 bg-surface-elevated text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group border border-white/10"
          >
            <Calendar className="w-10 h-10 relative z-10 group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-6xl font-serif font-bold tracking-tighter leading-none text-white">Login</h1>
            <p className="text-white/20 font-medium text-lg tracking-tight">Melde dich an um fortzufahren.</p>
          </div>
        </div>

        <div className="bg-surface-muted backdrop-blur-3xl border border-white/5 p-8 sm:p-12 rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Animated Toggle */}
          <div className="flex bg-black/40 p-1.5 rounded-[1.8rem] mb-12 relative z-10 border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setLoginType('person')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.4rem] relative z-10 transition-all duration-500 ${loginType === 'person' ? 'text-black' : 'text-white/20 hover:text-white'}`}
            >
              Mitglied
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.4rem] relative z-10 transition-all duration-500 ${loginType === 'admin' ? 'text-black' : 'text-white/20 hover:text-white'}`}
            >
              Admin
            </button>
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-[1.4rem] shadow-2xl"
              style={{ left: loginType === 'person' ? '6px' : 'calc(50%)' }}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">
                User
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                  {loginType === 'admin' ? <Shield className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" /> : <User className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" />}
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/60 border border-white/5 rounded-[1.8rem] py-6 pl-16 pr-8 text-white placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/10 transition-all font-medium text-lg"
                  placeholder={loginType === 'admin' ? 'Administrator' : 'Benutzername'}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Passwort</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/5 rounded-[1.8rem] py-6 pl-16 pr-8 text-white placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/10 transition-all font-medium text-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full bg-white text-black font-black py-6 rounded-[1.8rem] mt-12 hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center shadow-3xl text-[11px] uppercase tracking-[0.3em]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                'Anmelden'
              )}
            </motion.button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 flex flex-col gap-6 text-center">
            <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.2em]">
              Interessiert?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link 
                to="/register-request"
                className="text-white/30 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all px-6 py-4 rounded-2xl hover:bg-white/5 active:scale-95"
              >
                Key beantragen
              </Link>
              <div className="w-1.5 h-1.5 bg-white/5 rounded-full hidden sm:block" />
              <Link 
                to="/register"
                className="text-white/30 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all px-6 py-4 rounded-2xl border border-white/5 hover:bg-white/5 active:scale-95"
              >
                Registrieren
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
