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
    <div className="min-h-screen bg-[#050505] pb-24">
      <header className="bg-[#050505]/80 border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="font-serif text-lg font-semibold text-white hidden sm:inline">Hallo, {user?.name}</span>
          </div>
          <div className="flex items-center gap-6">
            {isAdmin && (
              <Link 
                to="/" 
                className="hidden sm:flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors font-bold bg-white/5 px-5 py-2.5 rounded-full border border-white/5 hover:bg-white/10"
              >
                Verwaltung
              </Link>
            )}
            <NotificationsMenu apiPrefix="/api/public" />
            <div className="h-6 w-px bg-white/10" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors font-bold bg-white/5 px-5 py-2.5 rounded-full border border-white/5 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* Offene Einladungen */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-4xl font-serif font-bold text-white tracking-tight">Offene Einladungen</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-6">
              {pending.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} 
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className={`bg-white/[0.02] p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group relative overflow-hidden ${
                      inv.response_deadline && differenceInSeconds(parseISO(inv.response_deadline), new Date()) < 86400 
                      ? 'border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]' 
                      : 'border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                  >
                    {inv.response_deadline && differenceInSeconds(parseISO(inv.response_deadline), new Date()) < 86400 && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-[0.2em] z-20 animate-pulse">
                        Dringend
                      </div>
                    )}
                    <div className="flex items-start gap-8 relative z-10">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-white/40 shrink-0 border border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-2xl font-serif font-bold leading-none text-white">{format(parseISO(inv.date), 'dd')}</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl text-white group-hover:text-white/90 transition-colors mb-3">{inv.title}</h3>
                        <div className="flex items-center gap-6 text-sm text-white/30 font-medium tracking-wide">
                          <span className="flex items-center gap-2"><Calendar className="w-4 h-4 opacity-50" /> {format(parseISO(inv.date), 'HH:mm')} Uhr</span>
                          <span className="flex items-center gap-2"><MapPin className="w-4 h-4 opacity-50" /> {inv.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 relative z-10">
                      {inv.response_deadline && (
                        <div className="hidden md:block">
                          <Countdown deadline={inv.response_deadline} />
                        </div>
                      )}
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5">
                        <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
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
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-4xl font-serif font-bold text-white tracking-tight">Kommende Aktionen</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          {responded.length > 0 ? (
            <div className="grid gap-6">
              {responded.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} 
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all flex items-center justify-between group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-8 relative z-10">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-white/20 shrink-0 border border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-2xl font-serif font-bold leading-none text-white/60">{format(parseISO(inv.date), 'dd')}</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl text-white group-hover:text-white/90 transition-colors mb-3">{inv.title}</h3>
                        <div className="flex items-center gap-6 text-sm text-white/30 font-medium tracking-wide">
                          <span className="flex items-center gap-2"><MapPin className="w-4 h-4 opacity-50" /> {inv.location}</span>
                          <span className="flex items-center gap-2">
                            {inv.status === 'yes' && <span className="text-green-400/80 flex items-center gap-1.5 font-bold bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10"><CheckCircle className="w-3.5 h-3.5" /> Zugesagt</span>}
                            {inv.status === 'no' && <span className="text-red-400/80 flex items-center gap-1.5 font-bold bg-red-500/5 px-3 py-1 rounded-full border border-red-500/10"><XCircle className="w-3.5 h-3.5" /> Abgesagt</span>}
                            {inv.status === 'maybe' && <span className="text-amber-400/80 flex items-center gap-1.5 font-bold bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10"><HelpCircle className="w-3.5 h-3.5" /> Vielleicht</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5">
                      <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] p-20 rounded-[3rem] border border-white/5 text-center flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
                <Calendar className="w-10 h-10 text-white/10" />
              </div>
              <p className="text-white/30 font-serif text-xl">Du hast noch keine kommenden Aktionen mit Antwort.</p>
            </motion.div>
          )}
        </section>

        {/* Vergangene Aktionen */}
        {past.length > 0 && (
          <section className="opacity-40 hover:opacity-100 transition-opacity duration-700">
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Vergangene Aktionen</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-4">
              {past.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} 
                  key={inv.id}
                >
                  <Link to={`/invite/${inv.token}`} className="bg-white/[0.01] p-6 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-all group">
                    <div className="flex items-center gap-8">
                      <div className="text-xs font-bold text-white/20 w-16 text-center bg-white/5 py-1.5 rounded-full border border-white/5">
                        {format(parseISO(inv.date), 'dd.MM.')}
                      </div>
                      <div className="font-serif text-xl text-white/60 group-hover:text-white transition-colors">{inv.title}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border ${inv.status === 'yes' ? 'bg-green-500/5 text-green-400/50 border-green-500/10' : 'bg-white/5 text-white/20 border-white/5'}`}>
                        {inv.status === 'yes' ? 'Teilgenommen' : 'Nicht dabei'}
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-colors" />
                    </div>
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
