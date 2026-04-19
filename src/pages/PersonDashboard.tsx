import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, LogOut, User, Clock, ChevronRight, AlertCircle, Train, Settings, ChevronDown, Upload, Sun, Moon, Cloud, CloudRain, TrendingUp, BarChart3, Award, Target, Sparkles, Zap, Compass, Trophy, Megaphone } from 'lucide-react';
import { format, parseISO, differenceInSeconds, getHours, isAfter, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import NotificationsMenu from '../components/NotificationsMenu';
import TransitPlanner from '../components/TransitPlanner';
import Avatar from '../components/Avatar';
import { useTheme } from '../lib/theme';

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
      <div className="flex gap-1.5 font-mono text-sm font-black text-text">
        {days > 0 && (
          <div className="flex flex-col items-center">
            <span>{days}T</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span>{hours.toString().padStart(2, '0')}S</span>
        </div>
        <div className="flex flex-col items-center">
          <span>{minutes.toString().padStart(2, '0')}M</span>
        </div>
        <div className="flex flex-col items-center text-red-400">
          <span>{seconds.toString().padStart(2, '0')}S</span>
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
  const [transitAktion, setTransitAktion] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast.error('Bild ist zu groß (max 500KB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/public/check');
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        setUser(data.user);
        setIsAdmin(data.isAdmin);
        
        const profileRes = await fetch('/api/public/profile');
        if (profileRes.ok) {
          const pData = await profileRes.json();
          setAvatarUrl(pData.avatar_url || '');
        }

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

  // Personal stats calculation
  const totalInvited = invitations.length;
  const totalYes = invitations.filter(i => i.status === 'yes').length;
  const totalNo = invitations.filter(i => i.status === 'no').length;
  const totalMaybe = invitations.filter(i => i.status === 'maybe').length;
  const participationRate = totalInvited > 0 ? Math.round((totalYes / totalInvited) * 100) : 0;
  const pastYes = past.filter(i => i.status === 'yes').length;
  const pastTotal = past.length;
  const pastParticipationRate = pastTotal > 0 ? Math.round((pastYes / pastTotal) * 100) : 0;

  // Event type breakdown
  const eventTypeBreakdown: Record<string, number> = {};
  invitations.forEach(inv => {
    const type = inv.event_type || 'Event';
    eventTypeBreakdown[type] = (eventTypeBreakdown[type] || 0) + (inv.status === 'yes' ? 1 : 0);
  });
  const favoriteType = Object.entries(eventTypeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  // Streak calculation (consecutive events attended)
  const sortedPast = [...past].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  for (const inv of sortedPast) {
    if (inv.status === 'yes') streak++;
    else break;
  }

  // Smart suggestions logic
  const suggestions: { icon: React.ElementType; title: string; message: string; action?: string; link?: string; variant: 'default' | 'highlight' }[] = [];

  // Suggestion 1: Pending invitations urgency
  if (pending.length > 0) {
    const urgent = pending.filter(p => p.response_deadline && isAfter(new Date(), addDays(parseISO(p.response_deadline), -1)));
    if (urgent.length > 0) {
      suggestions.push({
        icon: AlertCircle,
        title: 'Rückmeldung erforderlich',
        message: `${urgent.length} Einladung${urgent.length > 1 ? 'en' : ''} laufen bald ab.`,
        action: 'Ansehen',
        link: `/invite/${urgent[0].token}`,
        variant: 'highlight'
      });
    } else {
      suggestions.push({
        icon: Sparkles,
        title: 'Deine Einladung',
        message: `Du hast ${pending.length} neu${pending.length > 1 ? 'e' : 'a'} Einladung${pending.length > 1 ? 'en' : ''}.`,
        action: 'Ansehen',
        link: `/invite/${pending[0].token}`,
        variant: 'default'
      });
    }
  }

  // Suggestion 2: Based on favorite event type
  if (favoriteType && favoriteType !== '-') {
    const typeIcons: Record<string, React.ElementType> = {
      wanderung: Compass,
      sport: Trophy,
      demo: Megaphone,
      event: Calendar,
    };
    const TypeIcon = typeIcons[favoriteType.toLowerCase()] || Calendar;
    const upcomingOfType = upcoming.filter(u => (u.event_type || 'Event').toLowerCase() === favoriteType.toLowerCase());
    if (upcomingOfType.length > 0) {
      suggestions.push({
        icon: TypeIcon,
        title: `${favoriteType} Fan?`,
        message: `${upcomingOfType.length} weitere${upcomingOfType.length > 1 ? '' : 'r'} ${favoriteType} Termin${upcomingOfType.length > 1 ? 'e' : ''} verfügbar.`,
        action: 'Details',
        variant: 'default'
      });
    }
  }

  // Suggestion 3: Low participation encouragement
  if (participationRate < 50 && totalInvited >= 3) {
    suggestions.push({
      icon: Zap,
      title: 'Dabei sein ist alles!',
      message: `Bisher hast du bei ${participationRate}% zugesagt. Wir freuen uns auf dich!`,
      variant: 'default'
    });
  }

  // Suggestion 4: Streak celebration
  if (streak >= 3) {
    suggestions.push({
      icon: Award,
      title: 'Beeindruckend! 🔥',
      message: `${streak} Events in Folge – danke für dein Engagement!`,
      variant: 'highlight'
    });
  }

  // Suggestion 5: Upcoming event with transport
  const nextEvent = upcoming.find(u => u.status === 'yes' && u.location);
  if (nextEvent) {
    suggestions.push({
      icon: Train,
      title: 'Route planen?',
      message: `"${nextEvent.title}" – plane jetzt deine Anreise.`,
      action: 'Route planen',
      variant: 'default'
    });
  }

  const getGreeting = () => {
    const hour = getHours(new Date());
    if (hour < 6) return 'Gute Nacht';
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const getGreetingIcon = () => {
    const hour = getHours(new Date());
    if (hour < 6) return Moon;
    if (hour < 12) return Sun;
    if (hour < 18) return Sun;
    return Cloud;
  };

  const GreetingIcon = getGreetingIcon();

  return (
    <div className="min-h-screen bg-surface selection:bg-accent-muted/30">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-2xl border-b border-border pt-safe">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-16">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 sm:gap-4 text-text font-serif tracking-tighter group active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent text-surface rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-2xl shadow-accent/10 ring-1 ring-border shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-black tracking-tighter italic text-xl sm:text-2xl">
                  MEMBER
                </span>
                <span className="micro-label !text-[7px] sm:!text-[8px] opacity-40 italic">
                  Übersicht
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
              {user && (
                <div className="flex items-center border-r border-border pr-2 sm:pr-4 sm:mr-2">
                  <Avatar
                    name={user.username}
                    avatarUrl={avatarUrl}
                    size="sm"
                    className="w-8 h-8 sm:w-10 sm:h-10 text-[10px] sm:text-xs"
                  />
                </div>
              )}
            <NotificationsMenu apiPrefix="/api/public" />
            <div className="h-6 w-px bg-border shrink-0 hidden sm:block" />
            <div className="flex items-center gap-1 bg-surface-elevated/50 p-1 border border-border rounded-[1.25rem] shrink-0">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-text-dim hover:text-text hover:bg-surface-elevated transition-all active:scale-95 shrink-0"
                title="Theme wechseln"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleLogout}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-text-dim hover:text-danger hover:bg-danger/10 transition-all active:scale-95 shrink-0"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-8 xl:px-12 py-8 sm:py-12 pb-32 max-w-[1920px] mx-auto space-y-12 overflow-x-hidden">
        {/* Personalized Greeting */}
        <section className="pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-6"
          >
            <div className="w-14 h-14 bg-surface-elevated rounded-2xl flex items-center justify-center text-text-muted border border-border">
              <GreetingIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-text tracking-tighter">
                {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-text-dim text-sm mt-1">Willkommen zurück auf deinem Dashboard.</p>
            </div>
          </motion.div>
        </section>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="w-8 h-8 bg-surface-elevated rounded-lg flex items-center justify-center text-accent border border-border">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-serif font-bold text-text tracking-tighter">Deine Highlights</h2>
            </motion.div>

            <div className="space-y-3">
              {suggestions.slice(0, 3).map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  >
                    {s.link ? (
                      <Link
                        to={s.link}
                        className={`flex items-center gap-5 p-5 rounded-2xl border transition-all group active:scale-[0.98] ${
                          s.variant === 'highlight'
                            ? 'bg-accent/5 border-accent/20 hover:bg-accent/10'
                            : 'bg-surface-elevated border-border hover:bg-surface-muted'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          s.variant === 'highlight'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-surface-muted text-text-dim group-hover:text-accent transition-colors'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-text mb-0.5">{s.title}</div>
                          <div className="text-xs text-text-muted">{s.message}</div>
                        </div>
                        {s.action && (
                          <div className="text-[10px] font-black text-text-dim uppercase tracking-widest group-hover:text-accent transition-colors shrink-0">
                            {s.action}
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div
                        className={`flex items-center gap-5 p-5 rounded-2xl border ${
                          s.variant === 'highlight'
                            ? 'bg-accent/5 border-accent/20'
                            : 'bg-surface-elevated border-border'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          s.variant === 'highlight'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-surface-muted text-text-dim'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-text mb-0.5">{s.title}</div>
                          <div className="text-xs text-text-muted">{s.message}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Personal Stats Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-10 h-10 bg-surface-elevated rounded-xl flex items-center justify-center text-text-dim">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-text tracking-tighter">Deine Übersicht</h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Participation Rate */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-surface-muted p-6 rounded-[2rem] border border-border shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">Beteiligung</span>
                <Target className="w-4 h-4 text-text-dim/20" />
              </div>
              <div className="text-4xl font-serif font-bold text-text tracking-tighter">{participationRate}%</div>
              <div className="h-1.5 w-full bg-surface-elevated rounded-full mt-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${participationRate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
              <div className="text-[9px] text-text-dim mt-2 font-bold uppercase tracking-widest">
                {totalYes} von {totalInvited} Events
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-surface-muted p-6 rounded-[2rem] border border-border shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">Serie</span>
                <Award className="w-4 h-4 text-text-dim/50" />
              </div>
              <div className="text-4xl font-serif font-bold text-text tracking-tighter">{streak}</div>
              <div className="text-[9px] text-text-dim/80 mt-2 font-bold uppercase tracking-widest">
                {streak === 0 ? 'Keine Serie' : streak === 1 ? 'Event in Folge' : 'Events in Folge'}
              </div>
            </motion.div>

            {/* Favorite Type */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-surface-muted p-6 rounded-[2rem] border border-border shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">Interesse</span>
                <TrendingUp className="w-4 h-4 text-text-dim/50" />
              </div>
              <div className="text-2xl font-serif font-bold text-text tracking-tighter capitalize">{favoriteType}</div>
              <div className="text-[9px] text-text-dim/80 mt-2 font-bold uppercase tracking-widest">
                Am häufigsten dabei
              </div>
            </motion.div>

            {/* Past Participation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-surface-muted p-6 rounded-[2rem] border border-border shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">Vergangen</span>
                <Calendar className="w-4 h-4 text-text-dim/50" />
              </div>
              <div className="text-4xl font-serif font-bold text-text tracking-tighter">{pastParticipationRate}%</div>
              <div className="text-[9px] text-text-dim/80 mt-2 font-bold uppercase tracking-widest">
                {pastYes} von {pastTotal} besucht
              </div>
            </motion.div>
          </div>
        </section>

        {/* Offene Einladungen */}
        {pending.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-display font-medium text-text tracking-tighter leading-none">Neu für <span className="text-text-muted font-serif italic">dich</span></h2>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <p className="text-text-muted text-xs font-black uppercase tracking-widest">{pending.length} offene {pending.length === 1 ? 'Einladung' : 'Einladungen'}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-8 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
              {pending.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} 
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className={`bg-surface-elevated p-8 sm:p-10 rounded-3xl border border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between group relative overflow-hidden gap-8 hover:-translate-y-1 hover:border-accent/30 active:scale-[0.98] ${
                      inv.response_deadline && differenceInSeconds(parseISO(inv.response_deadline), new Date()) < 86400 
                      ? 'border-danger/20 shadow-[0_0_80px_rgba(239,68,68,0.05)] bg-danger/[0.02]' 
                      : 'hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-start gap-8 relative z-10 font-serif">
                      <div className="w-20 h-20 bg-surface-muted rounded-2xl flex flex-col items-center justify-center text-text-muted shrink-0 border border-border shadow-inner group-hover:scale-105 transition-transform duration-700 relative overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 z-10 text-accent">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-3xl font-bold leading-none text-text z-10">{format(parseISO(inv.date), 'dd')}</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-3xl sm:text-4xl text-text tracking-tighter font-bold leading-tight group-hover:text-accent transition-colors">{inv.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                          <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-text-dim" /> {format(parseISO(inv.date), 'HH:mm')} Uhr</span>
                          <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-text-dim" /> {inv.location}</span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTransitAktion(inv);
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-surface-muted hover:bg-accent hover:text-white border border-border rounded-lg text-text-dim transition-all active:scale-95"
                          >
                            <Train className="w-3 h-3" /> Route
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 relative z-10 mt-4 sm:mt-0 justify-between sm:justify-end">
                      {inv.response_deadline && (
                        <Countdown deadline={inv.response_deadline} />
                      )}
                      <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all border border-border shadow-inner">
                        <ChevronRight className="w-5 h-5 text-text-dim group-hover:text-white transition-all transform group-hover:translate-x-1" />
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
          <div className="flex flex-col gap-4 mb-8">
            <h2 className="text-5xl font-display font-medium text-text tracking-tighter leading-none">Deine <span className="text-text-muted font-serif italic">Übersicht</span></h2>
            <div className="h-px w-24 bg-border" />
          </div>
          {responded.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {responded.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} 
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className="bg-surface-muted p-10 rounded-[3rem] border border-border hover:border-accent/30 hover:bg-surface-elevated transition-all flex flex-col group relative overflow-hidden gap-10 shadow-xl"
                  >
                    <div className="flex items-start justify-between relative z-10 w-full">
                      <div className="w-16 h-16 bg-surface-elevated rounded-[1.8rem] flex flex-col items-center justify-center text-text-dim shrink-0 border border-border shadow-inner">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-1">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-2xl font-serif font-bold leading-none text-text-muted">{format(parseISO(inv.date), 'dd')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.status === 'yes' && <div className="p-3 bg-success/10 text-success rounded-2xl border border-success/20"><CheckCircle className="w-5 h-5" /></div>}
                        {inv.status === 'no' && <div className="p-3 bg-danger/10 text-danger rounded-2xl border border-danger/20"><XCircle className="w-5 h-5" /></div>}
                        {inv.status === 'maybe' && <div className="p-3 bg-warning/10 text-warning rounded-2xl border border-warning/20"><HelpCircle className="w-5 h-5" /></div>}
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10 w-full">
                      <h3 className="text-3xl font-serif font-bold text-text leading-tight tracking-tighter group-hover:text-accent transition-colors">{inv.title}</h3>
                      <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2 italic">
                          <MapPin className="w-3.5 h-3.5" />
                          {inv.location}
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                          inv.status === 'yes' ? 'text-success' :
                          inv.status === 'no' ? 'text-danger' :
                          'text-warning'
                        }`}>
                          {inv.status === 'yes' && 'Ich bin dabei'}
                          {inv.status === 'no' && 'Leider nicht dabei'}
                          {inv.status === 'maybe' && 'Vielleicht dabei'}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTransitAktion(inv);
                          }}
                          className="mt-4 flex items-center justify-center gap-3 w-full py-4 bg-surface-elevated hover:bg-accent hover:border-accent border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-text-dim hover:text-white transition-all active:scale-95"
                        >
                          <Train className="w-4 h-4" /> Route planen
                        </button>
                      </div>
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <ChevronRight className="w-6 h-6 text-accent" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-muted p-24 rounded-[4rem] border border-border text-center flex flex-col items-center justify-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-surface-elevated rounded-[2.5rem] flex items-center justify-center mb-10 border border-border">
                <Calendar className="w-10 h-10 text-text-dim" />
              </div>
              <p className="text-text-muted font-serif text-3xl tracking-tighter">Bereit für dein nächstes Event.</p>
            </motion.div>
          )}
        </section>

        {/* Vergangene Aktionen */}
        {past.length > 0 && (
          <section className="opacity-90">
            <div className="flex items-center gap-6 mb-8">
              <button 
                onClick={() => setShowPast(!showPast)}
                className="text-[10px] font-black text-text-dim hover:text-text uppercase tracking-[0.4em] flex items-center gap-6 transition-colors group"
              >
                Chronik ({past.length})
                <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${showPast ? 'rotate-90' : ''}`} />
              </button>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            <AnimatePresence>
              {showPast && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
                >
                  {past.map((inv, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} 
                      key={inv.id}
                    >
                      <Link to={`/invite/${inv.token}`} className="bg-surface-muted p-8 rounded-[2rem] border border-border flex flex-col gap-6 hover:bg-surface-elevated transition-all group shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black text-text-dim uppercase tracking-widest bg-surface-elevated px-4 py-2 rounded-xl border border-border">
                            {format(parseISO(inv.date), 'dd.MM.yy')}
                          </div>
                          <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-border ${inv.status === 'yes' ? 'bg-success/10 text-success' : 'bg-surface-elevated text-text-dim'}`}>
                            {inv.status === 'yes' ? 'Teilgenommen' : 'Inaktiv'}
                          </div>
                        </div>
                        <div className="font-serif text-2xl text-text-muted group-hover:text-accent transition-colors tracking-tighter font-black italic">{inv.title}</div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      <TransitPlanner 
        isOpen={transitAktion !== null}
        onClose={() => setTransitAktion(null)}
        destination={transitAktion?.location}
        destinationName={transitAktion?.location}
        eventStartTime={transitAktion?.date}
      />
      </main>
    </div>
  );
}
