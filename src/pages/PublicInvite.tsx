import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, Users, Lock, Mail, ArrowRight, User, AlertCircle, Train, Repeat, MessageSquare, Trash2, Send, Compass, Trophy, Megaphone, Zap } from 'lucide-react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import MapComponent from '../components/MapComponent';
import TransitPlanner from '../components/TransitPlanner';
import { generateVCalendar } from '../lib/calendar';

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: timeLeft < 86400 ? [1, 1.01, 1] : 1
      }}
      transition={{ 
        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        default: { duration: 1, ease: [0.16, 1, 0.3, 1] }
      }}
      className="premium-card p-10 rounded-4xl flex flex-col items-center justify-center text-center shadow-none relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] to-transparent pointer-events-none" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        <span className="micro-label !text-red-400/60 uppercase tracking-[0.3em]">Rückmeldung offen</span>
      </div>
      <div className="flex gap-10 font-serif text-5xl font-black text-white tracking-widest leading-none">
        {days > 0 && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-white">{days}</span>
            <span className="micro-label !opacity-30">Tage</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-2">
          <span className="text-white">{hours.toString().padStart(2, '0')}</span>
          <span className="micro-label !opacity-30">Std</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-white">{minutes.toString().padStart(2, '0')}</span>
          <span className="micro-label !opacity-30">Min</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-red-400/60">
          <span className="text-red-400/80">{seconds.toString().padStart(2, '0')}</span>
          <span className="micro-label !opacity-30 !text-red-400/20">Sek</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PublicInvite() {
  const [token] = useState(useParams().token);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [guestsCount, setGuestsCount] = useState(0);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Profile setup & Login state
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    fetch('/api/public/check')
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.isAdmin);
        setCurrentUser(data.user);
      })
      .catch(() => {
        setIsAdmin(false);
        setCurrentUser(null);
      });

    fetch(`/api/public/invite/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Ungültiger Link');
        return res.json();
      })
      .then(d => {
        setData(d);
        setStatus(d.invitee.status === 'pending' ? '' : d.invitee.status);
        setComment(d.invitee.comment || '');
        setGuestsCount(d.invitee.guests_count || 0);
        setChecklist(d.checklist || []);
        setPolls(d.polls || []);
        setMessages(d.messages || []);
        
        // Suggest username if not set
        if (!d.invitee.has_profile) {
          const suggested = d.invitee.suggested_username || (d.invitee.name_snapshot || '').toLowerCase().replace(/\s+/g, '.');
          setSetupUsername(suggested);
        }
      })
      .catch(e => setError(e.message));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      toast.error('Bitte wähle eine Antwort aus.');
      return;
    }

    try {
      const res = await fetch(`/api/public/invite/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment, guests_count: guestsCount })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Fehler beim Speichern der Antwort. Bitte versuche es später erneut.');
      }
    } catch (e: any) {
      console.error('Submission Error:', e);
      toast.error(e.message || 'Ein Netzwerkfehler ist aufgetreten.');
    }
  };

  const fetchUpdatedData = async () => {
    try {
      const res = await fetch(`/api/public/invite/${token}`);
      if (res.ok) {
        const d = await res.json();
        setChecklist(d.checklist || []);
        setPolls(d.polls || []);
        setMessages(d.messages || []);
      }
    } catch (e) {}
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`/api/public/invite/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchUpdatedData();
      } else {
        throw new Error('Fehler beim Senden');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    try {
      const res = await fetch(`/api/public/invite/${token}/messages/${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUpdatedData();
      } else {
        throw new Error('Keine Berechtigung zum Löschen');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleClaimItem = async (itemId: number) => {
    try {
      const res = await fetch(`/api/public/invite/${token}/checklist/${itemId}/claim`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Gegenstand übernommen');
        fetchUpdatedData();
      }
    } catch (e) {
      toast.error('Fehler beim Übernehmen');
    }
  };

  const handleUnclaimItem = async (itemId: number) => {
    try {
      const res = await fetch(`/api/public/invite/${token}/checklist/${itemId}/unclaim`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Gegenstand freigegeben');
        fetchUpdatedData();
      }
    } catch (e) {
      toast.error('Fehler beim Freigeben');
    }
  };

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      const res = await fetch(`/api/public/invite/${token}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      });
      if (res.ok) {
        toast.success('Stimme gespeichert');
        fetchUpdatedData();
      }
    } catch (e) {
      toast.error('Fehler beim Abstimmen');
    }
  };

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUp(true);
    try {
      const res = await fetch(`/api/public/invite/${token}/setup-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: setupUsername, password: setupPassword })
      });

      if (res.ok) {
        toast.success('Profil erfolgreich erstellt!');
        // Refresh data to show profile is created
        const updatedData = { ...data };
        updatedData.invitee.has_profile = true;
        setData(updatedData);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Erstellen des Profils.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      // If the invitee is linked to an admin account, use the admin auth endpoint
      const endpoint = invitee.is_admin_account ? '/api/auth/login' : '/api/public/login';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: invitee.username || invitee.suggested_username || invitee.name_snapshot, password: loginPassword })
      });

      if (res.ok) {
        toast.success(invitee.is_admin_account ? 'Einsatzleitung verifiziert' : 'Willkommen zurück!');
        const checkRes = await fetch('/api/public/check');
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setCurrentUser(checkData.user);
          setIsAdmin(checkData.isAdmin);
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Login fehlgeschlagen');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (error) {
    return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_60%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-surface-muted p-8 rounded-[2.5rem] shadow-2xl border border-white/5 text-center max-w-md w-full relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/10">
            <XCircle className="w-10 h-10 text-red-400/60" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-4 tracking-tight">Link ungültig</h1>
          <p className="text-white/30 font-medium mb-10">{error}</p>
          <Link to="/login" className="inline-flex items-center gap-2 text-white/20 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px]">
            <ArrowRight className="w-4 h-4 rotate-180" /> Zurück zum Login
          </Link>
        </div>
      </motion.div>
    </div>
    );
  }

  if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Lade...</div>;

  const { aktion, invitee } = data;
  const isDeadlinePassed = aktion?.response_deadline && new Date() > new Date(aktion.response_deadline);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'wanderung': return <Compass className="w-10 h-10" />;
      case 'sport': return <Trophy className="w-10 h-10" />;
      case 'demo': return <Megaphone className="w-10 h-10" />;
      case 'spontan': return <Zap className="w-10 h-10" />;
      default: return <Calendar className="w-10 h-10" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'wanderung': return 'Wanderung';
      case 'sport': return 'Sport';
      case 'demo': return 'Demo';
      case 'spontan': return 'Spontanaktion';
      default: return 'Vertrauliche Einladung';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.05)_0%,transparent_50%)]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface-muted p-10 sm:p-16 rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/5 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }}
              className="w-24 h-24 bg-emerald-500/10 rounded-[2.2rem] flex items-center justify-center mx-auto mb-12 border border-emerald-500/10 shadow-[0_0_60px_rgba(16,185,129,0.1)]"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400/60" />
            </motion.div>
            
            <h1 className="text-5xl font-serif font-bold text-white mb-6 tracking-tighter">Done.</h1>
            <p className="text-white/30 mb-12 font-medium text-lg leading-relaxed">Deine Antwort wurde erfolgreich übermittelt.</p>
            
            <div className="bg-black/40 backdrop-blur-md p-10 rounded-[2.5rem] text-left border border-white/5 mb-12">
              <p className="font-black text-white/10 mb-6 uppercase tracking-[0.3em] text-[10px]">Dein Status</p>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'yes' ? 'bg-emerald-400' : status === 'no' ? 'bg-red-400' : 'bg-amber-400'
                } shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                <div className="font-serif text-3xl text-white font-bold tracking-tight">
                  {status === 'yes' && "Ich bin dabei"}
                  {status === 'no' && "Leider nicht"}
                  {status === 'maybe' && "Vielleicht"}
                </div>
              </div>
              {guestsCount > 0 && (
                <div className="mt-6 flex items-center gap-3 text-white/30 text-xs font-bold uppercase tracking-widest pl-7">
                  <Users className="w-4 h-4" /> + {guestsCount} Gäste
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-5">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  to="/dashboard"
                  className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-3 shadow-3xl text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-white/90"
                >
                  Zur App <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <button 
                onClick={() => setSuccess(false)}
                className="text-white/10 hover:text-white/30 text-[10px] font-black uppercase tracking-[0.2em] transition-all py-2"
              >
                Antwort ändern
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-16 sm:py-32 px-6 relative">
      {isAdmin && (
        <div className="fixed top-8 left-8 z-50">
          <Link 
            to="/"
            className="w-12 h-12 bg-surface-elevated text-text border border-border rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group"
            title="Zurück zur Admin-Übersicht"
          >
            <Calendar className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </Link>
        </div>
      )}
      <div className="max-w-2xl mx-auto space-y-24 pb-32">
        {/* Header / Aktion Info */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="premium-card rounded-4xl p-10 sm:p-20 text-center relative z-10 flex flex-col items-center shadow-none border-border">
            <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mb-12"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              <span className="micro-label !text-accent/80">{getEventLabel(aktion.type)}</span>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="w-24 h-24 bg-surface-elevated text-text rounded-3xl flex items-center justify-center mb-12 shadow-lg ring-1 ring-border active:scale-95 transition-transform"
            >
              {getEventIcon(aktion.type)}
            </motion.div>

            <h1 className="text-6xl sm:text-8xl font-serif font-black text-text tracking-tighter leading-[0.85] mb-12">
              {aktion?.title}
            </h1>

            <div className="h-px w-24 bg-border mb-12" />

            <div className="space-y-6">
              <h2 className="text-text/40 font-serif italic text-4xl sm:text-5xl tracking-[-0.04em] leading-none">
                Grüß dich {invitee?.name_snapshot || invitee?.name},
              </h2>
              <p className="text-text font-display font-medium text-2xl sm:text-3xl uppercase tracking-[0.2em] leading-[1.1] max-w-lg text-center">
                Es ist an der Zeit, gemeinsam <br />
                <span className="text-text/50 italic font-serif lowercase tracking-tighter pr-3 text-3xl sm:text-4xl">für</span> 
                unsere Ziele einzustehen.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-16 w-full text-left mt-24">
              <div className="space-y-6">
                <span className="micro-label !text-text/50">Zeitplan</span>
                <div className="space-y-2">
                  <div className="text-text font-serif text-3xl font-bold tracking-tight leading-none group-hover:text-text/80 transition-colors cursor-default">
                    {aktion?.date ? format(parseISO(aktion.date), 'EEEE, dd. MMM', { locale: de }) : '-'}
                  </div>
                  <div className="text-text/50 text-xl font-medium italic">{aktion?.date ? format(parseISO(aktion.date), 'HH:mm', { locale: de }) : '-'} Uhr</div>
                </div>
              </div>
              
              <div className="space-y-6">
                <span className="micro-label !text-text/50">Standort</span>
                <div className="space-y-3">
                  <div className="text-text font-serif text-3xl font-bold tracking-tight leading-tight group-hover:text-text/80 transition-colors cursor-default">
                    {aktion?.location}
                  </div>
                  {aktion?.meeting_point && (
                    <div className="inline-block px-4 py-2 bg-surface-elevated border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text/50">
                      Treffpunkt: {aktion.meeting_point}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {aktion?.location && (
              <div className="w-full mt-24 relative group">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="rounded-3xl overflow-hidden border border-border shadow-2xl h-80 relative"
                >
                  <MapComponent location={aktion.location} />
                  <div className="absolute inset-0 bg-surface/10 pointer-events-none group-hover:opacity-0 transition-opacity duration-700" />
                  <div className="absolute inset-x-0 bottom-0 p-8 flex flex-wrap justify-center sm:justify-end gap-3 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowTransit(true); }}
                      className="bg-surface-elevated/90 hover:bg-surface-elevated backdrop-blur-3xl border border-border px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-text transition-all active:scale-95 shadow-lg"
                    >
                      <Train className="w-4 h-4" /> Anfahrt
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); generateVCalendar(aktion, window.location.href); }}
                      className="bg-text text-surface px-8 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl hover:opacity-90"
                    >
                      <Calendar className="w-4 h-4" /> Kalender
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {aktion?.description && (
              <div className="w-full mt-24 text-left space-y-8 pt-20 border-t border-border relative">
                 <span className="micro-label absolute top-10 left-0">Hinweise</span>
                 <p className="text-text/60 text-2xl whitespace-pre-wrap leading-[1.4] font-medium tracking-tighter italic font-serif">
                   "{aktion.description}"
                 </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Response Section */}
        <div className="space-y-12">
          {aktion?.response_deadline && !isDeadlinePassed && !invitee.status && (
            <Countdown deadline={aktion.response_deadline} />
          )}

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 border border-border relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="relative z-10">
              <div className="flex items-center justify-between mb-16">
                <h2 className="text-4xl font-serif font-bold text-text tracking-tighter">Rückmeldung</h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                   <span className="micro-label !text-accent">Live Rückmeldung</span>
                </div>
              </div>
              
              {isDeadlinePassed && (
                <div className="bg-red-500/5 text-red-400/80 border border-red-500/10 p-8 rounded-3xl mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-center shadow-inner italic">
                  Abstimmungsfrist abgelaufen.
                </div>
              )}

              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 ${isDeadlinePassed ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
                {[
                  { id: 'yes', label: 'Bin dabei', icon: CheckCircle, color: 'accent' },
                  { id: 'no', label: 'Leider nein', icon: XCircle, color: 'surface' },
                  { id: 'maybe', label: 'Vielleicht', icon: HelpCircle, color: 'surface' }
                ].map((opt) => (
                  <motion.label 
                    key={opt.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      cursor-pointer border rounded-3xl p-8 text-center transition-all relative overflow-hidden group
                      ${status === opt.id 
                        ? `bg-accent text-surface border-accent shadow-[0_12px_32px_-12px_rgba(249,115,22,0.5)]` 
                        : 'bg-surface-elevated border-border hover:border-border/50 hover:bg-surface-elevated/80'}
                    `}
                  >
                    <input type="radio" name="status" value={opt.id} className="sr-only" checked={status === opt.id} onChange={() => setStatus(opt.id)} disabled={isDeadlinePassed} />
                    <div className="relative z-10 flex flex-col items-center">
                      <opt.icon className={`w-10 h-10 mb-4 transition-all duration-700 ${status === opt.id ? `text-surface scale-110` : 'text-text/30 group-hover:text-text/50'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors ${status === opt.id ? 'text-surface' : 'text-text/40'}`}>
                        {opt.label}
                      </span>
                    </div>
                  </motion.label>
                ))}
              </div>

              <AnimatePresence>
                {status === 'yes' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className={`mb-8 overflow-hidden ${isDeadlinePassed ? 'opacity-30' : ''}`}
                  >
                    <label className="flex items-center gap-3 text-[9px] font-black text-text/40 uppercase tracking-[0.2em] mb-4 pl-1">
                      <Users className="w-4 h-4" /> Gäste
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGuestsCount(num)}
                          disabled={isDeadlinePassed}
                          className={`py-4 rounded-xl font-black text-xs transition-all border ${
                            guestsCount === num 
                            ? 'bg-accent text-surface border-accent shadow-xl scale-105' 
                            : 'bg-surface-elevated text-text/50 border-border hover:border-border/50'
                          }`}
                        >
                          {num === 0 ? '0' : `+${num}`}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`mb-10 ${isDeadlinePassed ? 'opacity-30' : ''}`}>
                <label className="block text-[9px] font-black text-text/40 uppercase tracking-[0.2em] mb-4 pl-1">
                  Anmerkung
                </label>
                <textarea 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Hast du noch etwas mitzuteilen?..."
                  className="w-full bg-surface-elevated border border-border rounded-2xl p-5 text-text focus:outline-none focus:ring-1 focus:ring-accent transition-all font-medium placeholder:text-text/20 text-sm leading-relaxed min-h-[120px]"
                  disabled={isDeadlinePassed}
                />
              </div>

              {!isDeadlinePassed && (
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full bg-accent text-surface font-black py-5 rounded-2xl shadow-xl text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-accent/90 active:scale-[0.98]"
                >
                  Abstimmung senden
                </motion.button>
              )}
            </form>
          </motion.div>

          {/* Checklist Section */}
          <AnimatePresence>
            {checklist.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface-muted rounded-[3.5rem] border border-border p-10 sm:p-20 relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-4xl font-serif font-bold text-text mb-2 tracking-tighter">Mitbringliste</h2>
                      <p className="text-text/30 font-medium text-lg tracking-tight">Wer bringt was mit?</p>
                    </div>
                    <button 
                      onClick={fetchUpdatedData}
                      className="w-10 h-10 bg-surface-elevated border border-border rounded-2xl flex items-center justify-center text-text/40 hover:text-text transition-all active:rotate-180 duration-500"
                      title="Aktualisieren"
                    >
                      <Repeat className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {checklist.map(item => {
                      const isClaimedByMe = item.claimer_person_id === invitee.person_id;
                      const isClaimedByOther = item.claimer_person_id && !isClaimedByMe;
                      
                      return (
                        <motion.div 
                          key={item.id} 
                          layout
                          className={`flex items-center justify-between p-6 sm:p-8 rounded-[2.2rem] border transition-all duration-500 ${
                            isClaimedByMe ? 'bg-accent/10 border-accent/30' : 
                            isClaimedByOther ? 'bg-surface-elevated/40 border-border opacity-60' : 
                            'bg-surface-elevated border-border'
                          }`}
                        >
                          <div className="flex flex-col gap-1 pr-4">
                            <span className={`text-xl font-serif font-bold tracking-tight transition-all ${
                              item.claimer_person_id ? 'text-text/40' : 'text-text'
                            }`}>
                              {item.item_name}
                            </span>
                            {item.notes && <span className="text-xs text-text/40 font-medium">{item.notes}</span>}
                            
                            {isClaimedByOther && (
                              <div className="flex items-center gap-2 text-[9px] font-black text-text/30 uppercase tracking-[0.2em] mt-3">
                                <User className="w-3 h-3" /> {item.claimer_name}
                              </div>
                            )}
                            {isClaimedByMe && (
                              <div className="flex items-center gap-2 text-[9px] font-black text-accent uppercase tracking-[0.2em] mt-3">
                                <CheckCircle className="w-3 h-3" /> Von dir übernommen
                              </div>
                            )}
                          </div>
                          
                          <div className="shrink-0">
                            {!item.claimer_person_id ? (
                              <button 
                                onClick={() => handleClaimItem(item.id)}
                                className="bg-text text-surface px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-xl hover:opacity-90"
                              >
                                Ich!
                              </button>
                            ) : isClaimedByMe ? (
                              <button 
                                onClick={() => handleUnclaimItem(item.id)}
                                className="w-12 h-12 bg-accent text-surface rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 active:scale-90 transition-all hover:bg-rose-500 hover:text-white group"
                                title="Abgeben"
                              >
                                <CheckCircle className="w-6 h-6 group-hover:hidden" />
                                <XCircle className="w-6 h-6 hidden group-hover:block" />
                              </button>
                            ) : (
                              <div className="w-12 h-12 bg-surface-elevated rounded-2xl flex items-center justify-center border border-border">
                                <Lock className="w-5 h-5 text-text/20" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Polls Section */}
          {polls.length > 0 && (
            <div className="space-y-12">
              <div className="flex justify-between items-center px-10">
                <h2 className="text-4xl font-serif font-bold text-text tracking-tighter">Abstimmungen</h2>
                <button 
                  onClick={fetchUpdatedData}
                  className="w-10 h-10 bg-surface-elevated border border-border rounded-2xl flex items-center justify-center text-text/40 hover:text-text transition-all active:rotate-180 duration-500"
                  title="Aktualisieren"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-6">
                {polls.map(poll => (
                  <motion.div 
                    key={poll.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-surface-muted rounded-[3rem] border border-border p-10 relative overflow-hidden"
                  >
                    <h3 className="text-2xl font-serif font-bold text-text mb-8 tracking-tighter">{poll.question}</h3>
                    <div className="space-y-4">
                      {poll.options.map((opt: any) => {
                        const hasVoted = opt.votes.some((v: any) => v.id === invitee.person_id);
                        const totalVotes = poll.options.reduce((a: any, b: any) => a + b.vote_count, 0);
                        const percent = totalVotes > 0 ? (opt.vote_count / totalVotes) * 100 : 0;
                        
                        return (
                          <button 
                            key={opt.id}
                            onClick={() => handleVote(poll.id, opt.id)}
                            className={`w-full relative h-16 rounded-2xl overflow-hidden border transition-all text-left ${hasVoted ? 'border-accent bg-accent/5' : 'border-border bg-surface-elevated hover:bg-surface-elevated/80'}`}
                          >
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="absolute inset-y-0 left-0 bg-accent/10"
                            />
                            <div className="relative h-full flex items-center justify-between px-6">
                              <span className={`text-sm font-bold tracking-widest uppercase transition-colors ${hasVoted ? 'text-accent' : 'text-text/60'}`}>{opt.option_text}</span>
                              <div className="flex items-center gap-4">
                                {hasVoted && <CheckCircle className="w-4 h-4 text-accent" />}
                                <span className="text-[10px] font-black text-text/40">{opt.vote_count}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Message Board */}
          <div className="premium-card rounded-4xl p-10 sm:p-20 relative overflow-hidden mt-12 border-border shadow-none">
            <div className="flex justify-between items-center mb-16">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                   <span className="micro-label uppercase tracking-[0.3em]">Nachrichten & Austausch</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-serif font-black text-text tracking-tighter leading-none">Pinnwand</h2>
                <p className="text-text/30 font-medium text-lg leading-tight tracking-tight italic">Einfach mal Hallo sagen oder Details klären.</p>
              </div>
              <div className="w-16 h-16 bg-surface-elevated rounded-3xl flex items-center justify-center text-text/10 group-hover:text-text/20 transition-colors">
                 <MessageSquare className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-10 mb-16">
              {messages.length === 0 ? (
                <div className="text-center py-24 px-4 bg-surface-elevated/10 rounded-4xl border border-border border-dashed">
                   <p className="text-text/20 text-[10px] font-black uppercase tracking-[0.5em]">Noch keine Nachrichten vorhanden...</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-10 rounded-4xl border relative group transition-all duration-500 ${msg.is_admin ? 'bg-accent/10 border-accent/20' : 'bg-surface-elevated border-border hover:border-border/50'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className={`font-serif font-black text-2xl tracking-tighter leading-none ${msg.is_admin ? 'text-accent' : 'text-text'}`}>
                            {msg.is_admin ? (aktion?.title || 'Veranstalter') : msg.person_name}
                          </span>
                          {msg.is_admin && (
                            <div className="bg-accent/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-accent">
                               ADMIN
                            </div>
                          )}
                        </div>
                        <span className={`micro-label !text-[9px] ${msg.is_admin ? 'text-accent/50' : 'text-text/40'}`}>
                          {format(parseISO(msg.created_at), 'dd.MM • HH:mm')}
                        </span>
                      </div>
                      {msg.person_id === invitee.person_id && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)} 
                          className={`transition-colors p-2 rounded-xl h-10 w-10 flex items-center justify-center ${msg.is_admin ? 'hover:bg-accent/10 text-accent/50 hover:text-red-500' : 'hover:bg-surface-elevated/50 text-text/30 hover:text-red-400'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className={`text-xl font-medium leading-relaxed whitespace-pre-wrap tracking-tight italic font-serif ${msg.is_admin ? 'text-accent/80' : 'text-text/70'}`}>
                      "{msg.message}"
                    </p>
                  </motion.div>
                ))
              )}
            </div>

            {invitee.has_profile ? (
              <form onSubmit={handlePostMessage} className="relative group">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Schreib etwas..."
                  className="w-full bg-surface-elevated border border-border rounded-[2.5rem] p-10 pr-24 text-text text-xl font-serif italic placeholder:text-text/20 outline-none focus:border-border/80 transition-all resize-none h-48 focus:bg-surface-elevated/80 shadow-inner"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="absolute bottom-8 right-8 w-16 h-16 bg-text text-surface rounded-[1.8rem] flex items-center justify-center disabled:opacity-0 disabled:scale-90 transition-all shadow-xl"
                >
                  <Send className="w-6 h-6 -ml-0.5" />
                </motion.button>
              </form>
            ) : (
              <div className="bg-surface-elevated border-dashed border-2 border-border rounded-4xl p-10 text-center">
                <p className="text-text/30 text-sm font-medium leading-relaxed italic">Erstelle unten ein Profil, um Nachrichten zu schreiben.</p>
              </div>
            )}
          </div>

          {/* Participants List */}
          {data?.participants && data.participants.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-16"
            >
              <div className="flex items-center justify-between px-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-text/20 animate-pulse" />
                    <span className="micro-label">Teilnehmerliste</span>
                  </div>
                  <h2 className="text-5xl sm:text-7xl font-serif font-black text-text tracking-tighter leading-none">
                    Gästeliste
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="text-6xl font-serif font-black text-text/5 leading-none">{data.participants.length}</div>
                   <span className="micro-label !text-text/30 tracking-[0.4em]">Personen</span>
                </div>
              </div>
              
              <div className="grid gap-6">
                {data.participants.map((p: any, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-10 rounded-4xl premium-card border-border shadow-none hover:bg-surface-elevated transition-colors group"
                  >
                    <div className="flex items-center gap-10">
                      <Avatar 
                        name={p.name} 
                        avatarUrl={p.avatar_url}
                        size="xl"
                        className="rounded-3xl shadow-xl transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="space-y-2">
                        <div className="font-black text-text text-3xl font-serif tracking-tighter leading-none">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-3">
                          {p.status === 'yes' && <div className="micro-label !text-accent">Bin dabei</div>}
                          {p.status === 'maybe' && <div className="micro-label !text-amber-400">Vielleicht</div>}
                          {p.status === 'no' && <div className="micro-label !text-rose-400">Abgesagt</div>}
                          {p.guests_count > 0 && (
                            <div className="micro-label !text-text/30 ml-2 border-l border-border pl-4">
                              + {p.guests_count} Begleitung
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Profile Setup / Login */}
          {!invitee.has_profile ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="premium-card rounded-4xl p-10 sm:p-20 relative overflow-hidden shadow-none border-border"
            >
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                   <span className="micro-label uppercase tracking-[0.3em]">Dein Profil</span>
                </div>
                <h2 className="text-5xl sm:text-7xl font-serif font-black text-text mb-8 tracking-tighter leading-none">Profil <span className="text-text/30 italic">erstellen</span></h2>
                <p className="text-text/60 mb-16 font-medium leading-[1.3] text-xl tracking-tight max-w-sm italic">
                  Erstelle ein Profil, um Zusagen zu geben, Abzustimmen und auf dem Laufenden zu bleiben.
                </p>
                
                <form onSubmit={handleSetupProfile} className="space-y-10">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="micro-label !text-text/40 pl-1">Name</span>
                      <div className="relative group">
                        <User className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 group-focus-within:text-text transition-all" />
                        <input 
                          type="text" 
                          required 
                          value={setupUsername}
                          onChange={e => setSetupUsername(e.target.value)}
                          placeholder="z.B. agent.null"
                          className="w-full bg-surface-elevated border border-border rounded-3xl p-8 pl-16 text-text placeholder:text-text/20 focus:outline-none focus:border-border/80 transition-all text-lg font-serif italic"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <span className="micro-label !text-text/40 pl-1">Passwort</span>
                      <div className="relative group">
                        <Lock className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 group-focus-within:text-text transition-all" />
                        <input 
                          type="password" 
                          required 
                          minLength={8}
                          value={setupPassword}
                          onChange={e => setSetupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-surface-elevated border border-border rounded-3xl p-8 pl-16 text-text placeholder:text-text/20 focus:outline-none focus:border-border/80 transition-all text-lg font-serif italic"
                        />
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSettingUp}
                    className="w-full bg-accent text-surface font-black py-8 rounded-[2rem] hover:bg-accent/90 transition-all text-[11px] uppercase tracking-[0.4em] disabled:opacity-50 shadow-xl active:scale-95"
                  >
                    {isSettingUp ? 'Initialisiere...' : 'Profil Erstellen'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          ) : currentUser?.id === invitee.person_id ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="premium-card rounded-4xl p-12 flex flex-col sm:flex-row items-center justify-between gap-12 border-border shadow-none py-16"
            >
              <div className="flex items-center gap-10">
                <div className="w-24 h-24 bg-accent text-surface rounded-3xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <div className="text-left space-y-2">
                  <div className="font-serif text-4xl font-black text-text tracking-tighter leading-none">Eingeloggt</div>
                  <div className="text-text/50 font-medium text-lg leading-tight tracking-tight italic">Als {currentUser.username} verifiziert.</div>
                </div>
              </div>
              <Link 
                to="/dashboard"
                className="w-full sm:w-auto text-surface font-black text-[11px] bg-accent hover:bg-accent/90 px-16 py-8 rounded-[2rem] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.4em] shadow-xl"
              >
                Zum Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="premium-card rounded-4xl p-10 sm:p-20 relative overflow-hidden shadow-none border-border"
            >
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                   <span className="micro-label !text-amber-400/80 uppercase tracking-[0.3em]">Login erforderlich</span>
                </div>
                <h2 className="text-5xl sm:text-7xl font-serif font-black text-text mb-8 tracking-tighter leading-none">
                  {invitee.is_admin_account ? 'Admin-Bereich' : 'Anmeldung'} <span className="text-text/30 italic">{invitee.is_admin_account ? 'bestätigen' : 'erforderlich'}</span>
                </h2>
                <p className="text-text/60 mb-16 font-medium leading-[1.3] text-xl tracking-tight max-w-sm italic">
                  {invitee.is_admin_account 
                    ? `Melde dich mit deinem Administrator-Konto (@${invitee.username || invitee.suggested_username}) an, um Zugriff zu erhalten.` 
                    : `Du hast bereits ein Profil für ${invitee.username || 'deinen Account'} erstellt. Melde dich an, um fortzufahren.`}
                </p>
                
                <form onSubmit={handleLogin} className="space-y-10">
                  <div className="space-y-4">
                    <span className="micro-label !text-text/40 pl-1">Passwort</span>
                    <div className="relative group">
                      <Lock className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 group-focus-within:text-text transition-all" />
                      <input 
                        type="password" 
                        required 
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-surface-elevated border border-border rounded-3xl p-8 pl-16 text-text placeholder:text-text/20 focus:outline-none focus:border-border/80 transition-all text-lg font-serif italic"
                      />
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-text text-surface font-black py-8 rounded-[2rem] hover:opacity-90 transition-all text-[11px] uppercase tracking-[0.4em] disabled:opacity-50 shadow-xl active:scale-95"
                  >
                    {isLoggingIn ? 'Verifiziere...' : 'Einloggen'}
                  </motion.button>
                  <div className="text-center">
                    <Link to="/login" className="text-[9px] font-black uppercase tracking-[0.2em] text-text/40 hover:text-text transition-colors">Anderer Account?</Link>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {/* Bottom Sheet for Transit */}
      <TransitPlanner 
        isOpen={showTransit}
        onClose={() => setShowTransit(false)}
        destination={aktion?.location}
        destinationName={aktion?.location}
        eventStartTime={aktion?.date}
      />
    </div>
  );
}
