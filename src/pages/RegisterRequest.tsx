import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Calendar, UserPlus, ArrowLeft, Mail, User } from 'lucide-react';

export default function RegisterRequest() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/public/registration-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      
      if (res.ok) {
        setIsSuccess(true);
        toast.success('Anfrage gesendet');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Fehler beim Senden');
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Ambient Background */}
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
          Zurück
        </Link>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-12"
          >
            <div className="w-32 h-32 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center mx-auto border border-emerald-500/10 shadow-[0_0_80px_rgba(16,185,129,0.1)] relative overflow-hidden group">
              <UserPlus className="w-16 h-16 text-emerald-400/60 group-hover:scale-110 transition-transform duration-700 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
            </div>
            <div className="space-y-6">
              <h1 className="text-6xl font-serif font-bold tracking-tighter leading-none">Bestätigt</h1>
              <p className="text-white/30 text-lg leading-relaxed tracking-tight max-w-xs mx-auto">
                Deine Anfrage wird geprüft. Du erhältst deinen Key sobald er freigegeben wurde.
              </p>
            </div>
            <Link 
              to="/login"
              className="inline-flex items-center gap-4 bg-white text-black font-black py-6 px-12 rounded-[2rem] hover:bg-white/90 transition-all shadow-3xl text-[11px] uppercase tracking-[0.3em] active:scale-95"
            >
              Zum Login
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-16 space-y-4">
              <h1 className="text-6xl font-serif font-bold tracking-tighter leading-none text-white">Beitreten</h1>
              <p className="text-white/20 font-medium text-lg tracking-tight">Beantrage deinen persönlichen Key.</p>
            </div>

            <div className="bg-surface-muted backdrop-blur-3xl border border-white/5 p-8 sm:p-12 rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/60 border border-white/5 rounded-[1.8rem] py-6 pl-16 pr-8 text-white placeholder:text-white/5 focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/10 transition-all font-medium text-lg"
                      placeholder="Max Mustermann"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Email (optional)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-white/20 group-focus-within:text-white transition-all duration-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/60 border border-white/5 rounded-[1.8rem] py-6 pl-16 pr-8 text-white placeholder:text-white/5 focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/10 transition-all font-medium text-lg"
                      placeholder="max@beispiel.de"
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
                    'Anfrage senden'
                  )}
                </motion.button>
              </form>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
