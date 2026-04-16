import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 selection:bg-white/30 relative overflow-hidden">
      {/* Cinematic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
          >
            <Calendar className="w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl font-serif font-bold tracking-tight mb-4">Willkommen</h1>
          <p className="text-white/30 font-medium text-lg">Bitte melde dich an, um fortzufahren.</p>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          {/* Inner subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Animated Toggle Switch */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl mb-10 relative z-10 shadow-inner border border-white/5">
            <button
              type="button"
              onClick={() => setLoginType('person')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${loginType === 'person' ? 'text-black' : 'text-white/30 hover:text-white'}`}
            >
              Mitglied
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${loginType === 'admin' ? 'text-black' : 'text-white/30 hover:text-white'}`}
            >
              Admin
            </button>
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md"
              style={{ left: loginType === 'person' ? '6px' : 'calc(50%)' }}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-1">
                Benutzername
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  {loginType === 'admin' ? <Shield className="w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" /> : <User className="w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" />}
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                  placeholder={loginType === 'admin' ? 'admin' : 'Benutzername'}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-1">Passwort</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
              type="submit"
              className="w-full bg-white text-black font-bold py-5 rounded-2xl mt-8 hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center shadow-2xl shadow-white/5 text-lg"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                'Anmelden'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
