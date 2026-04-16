import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Key, Lock, User, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwörter stimmen nicht überein');
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, username, password })
      });
      
      if (res.ok) {
        toast.success('Profil erfolgreich erstellt!');
        navigate('/dashboard');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-white/[0.01] blur-[120px] rounded-full" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-white/[0.01] blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/login" className="inline-flex items-center gap-3 text-white/20 hover:text-white mb-12 text-[10px] font-black uppercase tracking-[0.3em] transition-all group active:scale-95">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Abbrechen
        </Link>

        <div className="mb-16 space-y-4">
          <h1 className="text-6xl font-serif font-bold tracking-tighter leading-none text-white">Join Us</h1>
          <p className="text-white/20 font-medium text-lg tracking-tight">Erstelle dein Profil mit deinem Key.</p>
        </div>

        <div className="bg-surface-muted border border-white/5 p-8 sm:p-12 rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          
          <form onSubmit={handleRegister} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                  <Key className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" />
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/60 border border-white/5 rounded-[1.8rem] py-6 pl-16 pr-8 text-white placeholder:text-white/5 focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/10 transition-all font-mono tracking-[0.3em] text-lg font-bold"
                  placeholder="CODE123"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/60 border border-white/5 rounded-[1.8rem] py-6 pl-16 pr-8 text-white placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/10 transition-all font-medium text-lg"
                  placeholder="Dein Name"
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

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Bestätigen</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                  <ShieldCheck className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                'Abschließen'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
