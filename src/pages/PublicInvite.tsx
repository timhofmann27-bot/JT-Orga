import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, Users, Lock, Mail, ArrowRight, User, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] p-8 rounded-[2rem] shadow-2xl border border-white/10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Link ungültig</h1>
          <p className="text-white/50 font-medium">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Lade...</div>;

  const { aktion, invitee } = data;
  const isDeadlinePassed = aktion?.response_deadline && new Date() > new Date(aktion.response_deadline);

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/[0.02] p-12 rounded-[3rem] shadow-2xl border border-white/5 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, delay: 0.2 }}
              className="w-24 h-24 bg-green-500/5 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-green-500/10 shadow-2xl"
            >
              <CheckCircle className="w-12 h-12 text-green-400/50" />
            </motion.div>
            <h1 className="text-4xl font-serif font-bold text-white mb-4 tracking-tight">Vielen Dank!</h1>
            <p className="text-white/40 mb-10 font-medium text-lg">Deine Antwort wurde erfolgreich gespeichert.</p>
            
            <div className="bg-white/5 p-8 rounded-3xl text-left border border-white/5 mb-10">
              <p className="font-bold text-white/20 mb-4 uppercase tracking-[0.2em] text-[10px]">Deine Antwort:</p>
              <div className="font-serif text-2xl text-white mb-2">
                {status === 'yes' && <span className="text-green-400/80">Ich bin dabei</span>}
                {status === 'no' && <span className="text-red-400/80">Ich kann leider nicht</span>}
                {status === 'maybe' && <span className="text-amber-400/80">Ich weiß es noch nicht</span>}
              </div>
              {guestsCount > 0 && <p className="text-white/30 font-bold text-sm">👥 + {guestsCount} Begleitperson(en)</p>}
            </div>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/dashboard"
                className="bg-white text-black font-bold py-5 px-8 rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-white/5 text-lg"
              >
                Zum Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setSuccess(false)}
                className="text-white/20 hover:text-white/40 text-sm font-bold transition-colors mt-2"
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
    <div className="min-h-screen bg-[#050505] py-24 px-6">
      <div className="max-w-2xl mx-auto space-y-12">
        {/* Header / Aktion Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden relative"
        >
          <div className="bg-white/5 p-12 text-center border-b border-white/5 relative z-10">
            <h1 className="text-5xl font-serif font-bold mb-4 text-white tracking-tight leading-tight">{aktion?.title}</h1>
            <p className="text-white/40 font-medium text-xl">Hallo {invitee?.name_snapshot || invitee?.name}, du bist eingeladen!</p>
          </div>
          
          <div className="p-12 space-y-10 relative z-10">
            <div className="grid sm:grid-cols-2 gap-10">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                  <Calendar className="w-6 h-6 text-white/40" />
                </div>
                <div>
                  <div className="font-bold text-white/30 text-[10px] uppercase tracking-[0.2em] mb-2">Wann?</div>
                  <div className="text-white font-serif text-xl leading-snug">
                    {aktion?.date ? format(parseISO(aktion.date), 'EEEE, dd. MMMM yyyy', { locale: de }) : '-'}
                  </div>
                  <div className="text-white/40 font-medium mt-1">{aktion?.date ? format(parseISO(aktion.date), 'HH:mm', { locale: de }) : '-'} Uhr</div>
                </div>
              </div>
              
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                  <MapPin className="w-6 h-6 text-white/40" />
                </div>
                <div>
                  <div className="font-bold text-white/30 text-[10px] uppercase tracking-[0.2em] mb-2">Wo?</div>
                  <div className="text-white font-serif text-xl leading-snug">{aktion?.location}</div>
                  {aktion?.meeting_point && (
                    <div className="text-sm text-white/30 mt-2 font-medium">Treffpunkt: {aktion.meeting_point}</div>
                  )}
                </div>
              </div>
            </div>

            {aktion?.description && (
              <div className="pt-10 border-t border-white/5">
                <div className="font-bold text-white/30 text-[10px] uppercase tracking-[0.2em] mb-4">Details</div>
                <p className="text-white/60 text-lg whitespace-pre-wrap leading-relaxed font-medium">{aktion.description}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Response Form */}
        {aktion?.response_deadline && !isDeadlinePassed && !invitee.status && (
          <Countdown deadline={aktion.response_deadline} />
        )}

        <motion.form 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} 
          onSubmit={handleSubmit} 
          className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/5 p-12"
        >
          <h2 className="text-3xl font-serif font-bold text-white mb-10 tracking-tight">Deine Antwort</h2>
          
          {isDeadlinePassed && (
            <div className="bg-red-500/5 text-red-400/80 border border-red-500/10 p-6 rounded-2xl mb-10 text-sm font-bold text-center">
              Die Antwortfrist für diese Aktion ist leider abgelaufen.
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
            {[
              { id: 'yes', label: 'Bin dabei', icon: CheckCircle, color: 'green' },
              { id: 'no', label: 'Kann nicht', icon: XCircle, color: 'red' },
              { id: 'maybe', label: 'Vielleicht', icon: HelpCircle, color: 'amber' }
            ].map((opt) => (
              <motion.label 
                key={opt.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  cursor-pointer border-2 rounded-3xl p-8 text-center transition-all relative overflow-hidden
                  ${status === opt.id 
                    ? `border-${opt.color}-500/50 bg-${opt.color}-500/5 text-${opt.color}-400 shadow-[0_0_30px_rgba(0,0,0,0.3)]` 
                    : 'border-white/5 hover:border-white/10 bg-white/5 text-white/30'}
                `}
              >
                <input type="radio" name="status" value={opt.id} className="sr-only" checked={status === opt.id} onChange={() => setStatus(opt.id)} disabled={isDeadlinePassed} />
                <opt.icon className={`w-10 h-10 mx-auto mb-4 ${status === opt.id ? `text-${opt.color}-400` : 'text-white/10'}`} />
                <span className="font-bold block text-sm uppercase tracking-widest">{opt.label}</span>
              </motion.label>
            ))}
          </div>

          {status === 'yes' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mb-10 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">
                <Users className="w-4 h-4" />
                Begleitpersonen
              </label>
              <select 
                value={guestsCount} 
                onChange={e => setGuestsCount(Number(e.target.value))}
                className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all font-medium appearance-none cursor-pointer"
                disabled={isDeadlinePassed}
              >
                <option value={0}>Ich komme alleine</option>
                <option value={1}>+ 1 Begleitperson</option>
                <option value={2}>+ 2 Begleitpersonen</option>
                <option value={3}>+ 3 Begleitpersonen</option>
                <option value={4}>+ 4 Begleitpersonen</option>
              </select>
            </motion.div>
          )}

          <div className={`mb-12 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">
              Kommentar (optional)
            </label>
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Deine Nachricht an den Organisator..."
              className="w-full bg-black border border-white/5 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all font-medium placeholder:text-white/10"
              rows={4}
              disabled={isDeadlinePassed}
            />
          </div>

          {!isDeadlinePassed && (
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full bg-white text-black font-bold py-5 px-8 rounded-2xl hover:bg-white/90 transition-all shadow-2xl shadow-white/5 text-xl"
            >
              Antwort senden
            </motion.button>
          )}
        </motion.form>

        {/* Profile Setup / Dashboard Link */}
        {!invitee.has_profile ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} 
            className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/5 p-12 relative overflow-hidden"
          >
            <h2 className="text-3xl font-serif font-bold text-white mb-4 tracking-tight relative z-10">
              Profil erstellen
            </h2>
            <p className="text-white/40 mb-10 font-medium leading-relaxed text-lg">
              Erstelle ein Profil, um alle deine Einladungen an einem Ort zu sehen und deine Antworten jederzeit zu ändern.
            </p>
            
            <form onSubmit={handleSetupProfile} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Benutzername</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text" 
                      required 
                      value={setupUsername}
                      onChange={e => setSetupUsername(e.target.value)}
                      placeholder="Benutzername"
                      className="w-full bg-black border border-white/5 rounded-2xl p-5 pl-14 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="password" 
                      required 
                      minLength={8}
                      value={setupPassword}
                      onChange={e => setSetupPassword(e.target.value)}
                      placeholder="Mind. 8 Zeichen"
                      className="w-full bg-black border border-white/5 rounded-2xl p-5 pl-14 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSettingUp}
                className="w-full bg-white/5 text-white font-bold py-5 px-8 rounded-2xl hover:bg-white/10 transition-all disabled:opacity-50 border border-white/5 mt-4 text-lg"
              >
                {isSettingUp ? 'Wird erstellt...' : 'Profil jetzt erstellen'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.02] rounded-[2.5rem] shadow-2xl border border-white/5 p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-green-500/5 rounded-2xl flex items-center justify-center border border-green-500/10">
                <CheckCircle className="w-8 h-8 text-green-400/50" />
              </div>
              <div>
                <div className="font-serif text-2xl text-white">Profil aktiv</div>
                <div className="text-white/30 font-medium">Du hast bereits ein Profil.</div>
              </div>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <Link 
                to="/dashboard"
                className="flex-1 sm:flex-none text-black font-bold text-sm bg-white hover:bg-white/90 px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
