import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, Users, Lock, Mail, ArrowRight, User, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import MapComponent from '../components/MapComponent';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: timeLeft < 86400 ? [1, 1.02, 1] : 1
      }}
      transition={{ 
        scale: { duration: 2, repeat: Infinity },
        default: { duration: 0.5 }
      }}
      className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
      >
        <AlertCircle className="w-4 h-4" /> Frist läuft ab
      </motion.div>
      <div className="flex gap-4 font-mono text-3xl font-black text-white">
        {days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-white">{days}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Tage</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-white">{hours.toString().padStart(2, '0')}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Std</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white">{minutes.toString().padStart(2, '0')}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Min</span>
        </div>
        <div className="flex flex-col items-center text-red-400">
          <span className="text-red-400">{seconds.toString().padStart(2, '0')}</span>
          <span className="text-[10px] text-red-400/30 uppercase tracking-widest mt-1">Sek</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PublicInvite() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [guestsCount, setGuestsCount] = useState(0);

  // Profile setup state
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
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
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern.');
      }
    } catch (e: any) {
      toast.error(e.message);
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
              <p className="font-black text-white/10 mb-6 uppercase tracking-[0.3em] text-[10px]">Your Status</p>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'yes' ? 'bg-emerald-400' : status === 'no' ? 'bg-red-400' : 'bg-amber-400'
                } shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                <div className="font-serif text-3xl text-white font-bold tracking-tight">
                  {status === 'yes' && "I'm in"}
                  {status === 'no' && "Sadly not"}
                  {status === 'maybe' && "Maybe"}
                </div>
              </div>
              {guestsCount > 0 && (
                <div className="mt-6 flex items-center gap-3 text-white/30 text-xs font-bold uppercase tracking-widest pl-7">
                  <Users className="w-4 h-4" /> + {guestsCount} Guests
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-5">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  to="/dashboard"
                  className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-3 shadow-3xl text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-white/90"
                >
                  Go to App <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <button 
                onClick={() => setSuccess(false)}
                className="text-white/10 hover:text-white/30 text-[10px] font-black uppercase tracking-[0.2em] transition-all py-2"
              >
                Change Response
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-16 sm:py-32 px-6">
      <div className="max-w-xl mx-auto space-y-20 pb-20">
        {/* Header / Aktion Info */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="bg-surface-muted rounded-[4rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
            
            <div className="p-10 sm:p-20 text-center relative z-10 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-20 h-20 bg-white/5 rounded-[1.8rem] flex items-center justify-center mb-10 border border-white/5"
              >
                <Calendar className="w-10 h-10 text-white/20" />
              </motion.div>
              <h1 className="text-5xl sm:text-7xl font-serif font-bold text-white tracking-tighter leading-[0.9] mb-8">
                {aktion?.title}
              </h1>
              <p className="text-white/20 font-medium text-lg sm:text-xl tracking-tight max-w-sm">
                Hey {invitee?.name_snapshot || invitee?.name}, you're invited.
              </p>
            </div>
            
            <div className="p-10 sm:p-20 pt-0 space-y-16 relative z-10">
              <div className="grid sm:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">When</div>
                  <div className="space-y-1">
                    <div className="text-white font-serif text-3xl font-bold tracking-tight">
                      {aktion?.date ? format(parseISO(aktion.date), 'EEEE, dd. MMM', { locale: de }) : '-'}
                    </div>
                    <div className="text-white/30 text-lg font-medium">{aktion?.date ? format(parseISO(aktion.date), 'HH:mm', { locale: de }) : '-'} Uhr</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">Where</div>
                  <div className="space-y-1">
                    <div className="text-white font-serif text-3xl font-bold tracking-tight leading-tight">{aktion?.location}</div>
                    {aktion?.meeting_point && (
                      <div className="text-white/20 text-sm font-medium pt-2 border-t border-white/5 inline-block">
                        Treffpunkt: {aktion.meeting_point}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {aktion?.location && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-[2.5rem] overflow-hidden border border-white/5 brightness-75 grayscale hover:grayscale-0 transition-all duration-700 h-64 shadow-2xl"
                >
                  <MapComponent location={aktion.location} />
                </motion.div>
              )}

              {aktion?.description && (
                <div className="space-y-6 pt-12 border-t border-white/5">
                  <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">Details</div>
                  <p className="text-white/40 text-xl whitespace-pre-wrap leading-relaxed font-medium tracking-tight">
                    {aktion.description}
                  </p>
                </div>
              )}
            </div>
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
            className="bg-surface-muted rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/5 p-10 sm:p-20 relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="relative z-10">
              <h2 className="text-5xl font-serif font-bold text-white mb-16 tracking-tighter">RSVP</h2>
              
              {isDeadlinePassed && (
                <div className="bg-red-500/5 text-red-400/60 border border-red-500/10 p-8 rounded-3xl mb-12 text-sm font-black uppercase tracking-widest text-center shadow-inner">
                  Die Frist ist leider abgelaufen.
                </div>
              )}

              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 ${isDeadlinePassed ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                {[
                  { id: 'yes', label: 'In', icon: CheckCircle, color: 'emerald' },
                  { id: 'no', label: 'Out', icon: XCircle, color: 'rose' },
                  { id: 'maybe', label: '?', icon: HelpCircle, color: 'amber' }
                ].map((opt) => (
                  <motion.label 
                    key={opt.id}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.96 }}
                    className={`
                      cursor-pointer border border-white/5 rounded-[2.5rem] p-10 text-center transition-all relative overflow-hidden group
                      ${status === opt.id 
                        ? `bg-white/[0.05] border-white/20 shadow-[0_0_80px_rgba(255,255,255,0.05)]` 
                        : 'bg-black/20 hover:bg-black/40'}
                    `}
                  >
                    <input type="radio" name="status" value={opt.id} className="sr-only" checked={status === opt.id} onChange={() => setStatus(opt.id)} disabled={isDeadlinePassed} />
                    <div className="relative z-10 flex flex-col items-center">
                      <opt.icon className={`w-12 h-12 mb-6 transition-all duration-500 ${status === opt.id ? `text-white scale-110 shadow-3xl` : 'text-white/10 group-hover:text-white/20'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${status === opt.id ? 'text-white' : 'text-white/20'}`}>
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
                    className={`mb-12 overflow-hidden ${isDeadlinePassed ? 'opacity-30' : ''}`}
                  >
                    <label className="flex items-center gap-4 text-[10px] font-black text-white/10 uppercase tracking-[0.3em] mb-6 ml-4">
                      <Users className="w-5 h-5" /> Guests
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {[0, 1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGuestsCount(num)}
                          disabled={isDeadlinePassed}
                          className={`py-6 rounded-3xl font-black text-xs transition-all border ${
                            guestsCount === num 
                            ? 'bg-white text-black border-white shadow-xl scale-105' 
                            : 'bg-black/20 text-white/20 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {num === 0 ? '0' : `+${num}`}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`mb-16 ${isDeadlinePassed ? 'opacity-30' : ''}`}>
                <label className="block text-[10px] font-black text-white/10 uppercase tracking-[0.3em] mb-6 ml-4">
                  Note
                </label>
                <textarea 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Anything on your mind?..."
                  className="w-full bg-black/40 border border-white/5 rounded-[2.5rem] p-10 text-white focus:outline-none focus:ring-4 focus:ring-white/5 transition-all font-medium placeholder:text-white/5 text-xl tracking-tight leading-relaxed min-h-[200px]"
                  disabled={isDeadlinePassed}
                />
              </div>

              {!isDeadlinePassed && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-white text-black font-black py-8 px-12 rounded-[2.5rem] shadow-[0_32px_64px_rgba(255,255,255,0.1)] text-[12px] uppercase tracking-[0.4em] transition-all hover:bg-white/90 active:scale-[0.97]"
                >
                  Send RSVP
                </motion.button>
              )}
            </form>
          </motion.div>

          {/* Participants List */}
          {data?.participants && data.participants.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between px-10">
                <h2 className="text-4xl font-serif font-bold text-white tracking-tighter flex items-center gap-6">
                  The List
                </h2>
                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30">
                  {data.participants.length} Joining
                </div>
              </div>
              
              <div className="grid gap-4">
                {data.participants.map((p: any, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-8 rounded-[2.5rem] bg-surface-muted border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.2rem] bg-white/[0.02] flex items-center justify-center font-serif font-black text-2xl text-white/20 group-hover:text-white/40 transition-colors">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white text-2xl font-serif tracking-tight">{p.name}</div>
                        {p.guests_count > 0 && <div className="text-[10px] font-black text-white/10 uppercase tracking-widest mt-1">+ {p.guests_count} Guests</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.status === 'yes' && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />}
                      {p.status === 'maybe' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                      {p.status === 'no' && <div className="w-2 h-2 rounded-full bg-rose-400" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Profile Setup */}
          {!invitee.has_profile && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-surface-muted rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/5 p-10 sm:p-20 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-5xl font-serif font-bold text-white mb-8 tracking-tighter">Stay Connected.</h2>
                <p className="text-white/30 mb-16 font-medium leading-relaxed text-xl tracking-tight max-w-sm">
                  Create a profile to manage all your invitations and access live updates.
                </p>
                
                <form onSubmit={handleSetupProfile} className="space-y-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em] ml-4">Account Details</div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="relative group">
                        <User className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-white transition-all" />
                        <input 
                          type="text" 
                          required 
                          value={setupUsername}
                          onChange={e => setSetupUsername(e.target.value)}
                          placeholder="Username"
                          className="w-full bg-black/40 border border-white/5 rounded-3xl p-7 pl-16 text-white focus:outline-none focus:ring-4 focus:ring-white/5 transition-all text-lg font-medium"
                        />
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-white transition-all" />
                        <input 
                          type="password" 
                          required 
                          minLength={8}
                          value={setupPassword}
                          onChange={e => setSetupPassword(e.target.value)}
                          placeholder="Password (8+ chars)"
                          className="w-full bg-black/40 border border-white/5 rounded-3xl p-7 pl-16 text-white focus:outline-none focus:ring-4 focus:ring-white/5 transition-all text-lg font-medium"
                        />
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSettingUp}
                    className="w-full bg-white/5 text-white font-black py-7 rounded-3xl hover:bg-white/10 transition-all border border-white/5 text-[11px] uppercase tracking-[0.3em] disabled:opacity-50"
                  >
                    {isSettingUp ? 'Creating Account...' : 'Join the Community'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {invitee.has_profile && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="bg-white/[0.02] rounded-[3.5rem] border border-white/5 p-12 flex flex-col sm:flex-row items-center justify-between gap-12"
            >
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-emerald-500/5 rounded-[1.8rem] flex items-center justify-center border border-emerald-500/10">
                  <CheckCircle className="w-10 h-10 text-emerald-400/30" />
                </div>
                <div className="text-left">
                  <div className="font-serif text-3xl font-bold text-white tracking-tight leading-none mb-3">Profile Active</div>
                  <div className="text-white/20 font-medium text-lg leading-tight">Everything is set up.</div>
                </div>
              </div>
              <Link 
                to="/dashboard"
                className="w-full sm:w-auto text-black font-black text-[10px] bg-white hover:bg-white/90 px-12 py-6 rounded-[1.8rem] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.3em]"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
