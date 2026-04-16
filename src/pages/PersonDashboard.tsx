import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, LogOut, User, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import NotificationsMenu from '../components/NotificationsMenu';

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const target = parseISO(deadline);
    const update = () => {
      const diff = differenceInSeconds(target, new Date());
      setTimeLeft(Math.max(0, diff));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === 0) return null;

  const days = Math.floor(timeLeft / (24 * 3600));
  const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div 
      animate={timeLeft < 86400 ? { 
        scale: [1, 1.02, 1],
        boxShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 20px rgba(239, 68, 68, 0.2)", "0 0 0px rgba(239, 68, 68, 0)"]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className="flex flex-col items-end justify-center px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-md shrink-0"
    >
      <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Frist läuft ab
      </div>
      <div className="flex gap-1.5 font-mono text-sm font-black text-white">
        {days > 0 && (
          <div className="flex flex-col items-center">
            <span>{days}d</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span>{hours.toString().padStart(2, '0')}h</span>
        </div>
        <div className="flex flex-col items-center">
          <span>{minutes.toString().padStart(2, '0')}m</span>
        </div>
        <div className="flex flex-col items-center text-red-400">
          <span>{seconds.toString().padStart(2, '0')}s</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PersonDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/public/check');
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        setUser(data.user);
        setIsAdmin(data.isAdmin);
        
        const invRes = await fetch('/api/public/dashboard');
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvitations(invData);
        }
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('/api/public/logout', { method: 'POST' });
      toast.success('Abgemeldet');
      navigate('/login');
    } catch (err) {
      toast.error('Fehler beim Abmelden');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Lade...</div>;

  const upcoming = invitations.filter(i => new Date(i.date) >= new Date());
  const past = invitations.filter(i => new Date(i.date) < new Date());
  const pending = upcoming.filter(i => i.status === 'pending');
  const responded = upcoming.filter(i => i.status !== 'pending');

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="bg-black/60 sticky top-0 z-50 backdrop-blur-3xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-surface-elevated text-white rounded-[1.2rem] flex items-center justify-center border border-white/10 shadow-2xl relative overflow-hidden group">
              <User className="w-6 h-6 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Willkommen</span>
              <span className="font-serif text-2xl font-bold text-white tracking-tighter leading-none mt-1">{user?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link 
                to="/" 
                className="hidden sm:flex items-center gap-2 text-[10px] text-white/40 hover:text-white transition-all font-black uppercase tracking-widest bg-white/5 px-6 py-3 rounded-2xl border border-white/5"
              >
                Dashboard
              </Link>
            )}
            <NotificationsMenu apiPrefix="/api/public" />
            <button 
              onClick={handleLogout}
              className="w-12 h-12 flex items-center justify-center bg-white/5 text-white/20 hover:text-white hover:bg-white/10 rounded-2xl border border-white/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* Offene Einladungen */}
        {pending.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div className="space-y-4">
                <h2 className="text-5xl font-serif font-bold text-white tracking-tighter leading-none">Neu für <span className="text-white/30">dich</span></h2>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <p className="text-white/30 text-xs font-black uppercase tracking-widest">{pending.length} offene {pending.length === 1 ? 'Einladung' : 'Einladungen'}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-8">
              {pending.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} 
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className={`bg-surface-muted p-8 sm:p-12 rounded-[3.5rem] border transition-all flex flex-col sm:flex-row sm:items-center justify-between group relative overflow-hidden gap-10 ${
                      inv.response_deadline && differenceInSeconds(parseISO(inv.response_deadline), new Date()) < 86400 
                      ? 'border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.05)] bg-red-500/[0.02]' 
                      : 'border-white/5 hover:border-white/10 hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-start gap-10 relative z-10 font-serif">
                      <div className="w-20 h-20 bg-surface-elevated rounded-[2.2rem] flex flex-col items-center justify-center text-white/30 shrink-0 border border-white/5 shadow-2xl group-hover:scale-105 transition-transform duration-700 relative overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 z-10">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-3xl font-bold leading-none text-white z-10">{format(parseISO(inv.date), 'dd')}</span>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-4xl sm:text-5xl text-white group-hover:text-white transition-colors tracking-tighter font-bold leading-tight">{inv.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-xs font-bold uppercase tracking-[0.2em] text-white/20">
                          <span className="flex items-center gap-3"><Clock className="w-4 h-4" /> {format(parseISO(inv.date), 'HH:mm')} Uhr</span>
                          <span className="flex items-center gap-3"><MapPin className="w-4 h-4" /> {inv.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10 relative z-10 mt-6 sm:mt-0 justify-between sm:justify-end">
                      {inv.response_deadline && (
                        <Countdown deadline={inv.response_deadline} />
                      )}
                      <div className="w-16 h-16 rounded-[2rem] bg-surface-elevated flex items-center justify-center group-hover:bg-white/[0.08] transition-all border border-white/5 active:scale-90 shadow-xl">
                        <ChevronRight className="w-8 h-8 text-white/40 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Meine Aktionen */}
        <section>
          <div className="flex flex-col gap-4 mb-12">
            <h2 className="text-5xl font-serif font-bold text-white tracking-tighter leading-none">Deine <span className="text-white/30">Übersicht</span></h2>
            <div className="h-px w-24 bg-white/20" />
          </div>
          {responded.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {responded.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} 
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className="bg-surface-muted p-10 rounded-[3rem] border border-white/5 hover:border-white/10 hover:bg-surface-elevated transition-all flex flex-col group relative overflow-hidden gap-10 shadow-xl"
                  >
                    <div className="flex items-start justify-between relative z-10 w-full">
                      <div className="w-16 h-16 bg-surface-elevated rounded-[1.8rem] flex flex-col items-center justify-center text-white/30 shrink-0 border border-white/5 shadow-inner">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-1">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-2xl font-serif font-bold leading-none text-white/60">{format(parseISO(inv.date), 'dd')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.status === 'yes' && <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/10"><CheckCircle className="w-5 h-5" /></div>}
                        {inv.status === 'no' && <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/10"><XCircle className="w-5 h-5" /></div>}
                        {inv.status === 'maybe' && <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/10"><HelpCircle className="w-5 h-5" /></div>}
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10 w-full">
                      <h3 className="text-3xl font-serif font-bold text-white leading-tight tracking-tighter group-hover:text-white transition-colors">{inv.title}</h3>
                      <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                          <MapPin className="w-3.5 h-3.5" />
                          {inv.location}
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                          inv.status === 'yes' ? 'text-emerald-400/60' :
                          inv.status === 'no' ? 'text-rose-400/60' :
                          'text-amber-400/60'
                        }`}>
                          {inv.status === 'yes' && 'Ich bin dabei'}
                          {inv.status === 'no' && 'Leider nicht dabei'}
                          {inv.status === 'maybe' && 'Vielleicht dabei'}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <ChevronRight className="w-6 h-6 text-white/20" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-muted p-24 rounded-[4rem] border border-white/5 text-center flex flex-col items-center justify-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5">
                <Calendar className="w-10 h-10 text-white/5" />
              </div>
              <p className="text-white/20 font-serif text-3xl tracking-tighter">Bereit für dein nächstes Event.</p>
            </motion.div>
          )}
        </section>

        {/* Vergangene Aktionen */}
        {past.length > 0 && (
          <section className="opacity-40 hover:opacity-100 transition-opacity duration-1000">
            <div className="flex items-center gap-6 mb-12">
              <h2 className="text-3xl font-serif font-bold text-white tracking-tighter leading-none">Vergangenes</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} 
                  key={inv.id}
                >
                  <Link to={`/invite/${inv.token}`} className="bg-surface-muted p-8 rounded-[2rem] border border-white/5 flex flex-col gap-6 hover:bg-surface-elevated transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black text-white/10 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        {format(parseISO(inv.date), 'dd.MM.yy')}
                      </div>
                      <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${inv.status === 'yes' ? 'bg-emerald-500/10 text-emerald-400/40 border-emerald-500/10' : 'bg-white/5 text-white/20 border-white/5'}`}>
                        {inv.status === 'yes' ? 'Erlebt' : 'Verpasst'}
                      </div>
                    </div>
                    <div className="font-serif text-2xl text-white/40 group-hover:text-white transition-colors tracking-tighter font-bold">{inv.title}</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
