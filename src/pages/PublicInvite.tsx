import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, XCircle, ArrowRight, Users, Compass, Trophy, Megaphone, Zap, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import InviteHeader from '../components/public-invite/InviteHeader';
import InviteResponse from '../components/public-invite/InviteResponse';
import InviteChecklist from '../components/public-invite/InviteChecklist';
import InvitePolls from '../components/public-invite/InvitePolls';
import InviteMessages from '../components/public-invite/InviteMessages';
import InviteProfile from '../components/public-invite/InviteProfile';
import TransitPlanner from '../components/TransitPlanner';

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
        throw new Error(errorData.error || 'Fehler beim Speichern der Antwort. Bitte versuche es später erneut.');
      }
    } catch (e: any) {
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
    <div className="min-h-screen bg-black py-16 sm:py-32 px-6 relative">
      {isAdmin && (
        <div className="fixed top-8 left-8 z-50">
          <Link 
            to="/"
            className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all group"
            title="Zurück zur Admin-Übersicht"
          >
            <Calendar className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </Link>
        </div>
      )}
      <div className="max-w-2xl mx-auto space-y-24 pb-32">
        <InviteHeader 
          aktion={aktion}
          invitee={invitee}
          isAdmin={isAdmin}
          onTransit={() => setShowTransit(true)}
          getEventIcon={getEventIcon}
          getEventLabel={getEventLabel}
        />

        <InviteResponse 
          aktion={aktion}
          invitee={invitee}
          status={status}
          setStatus={setStatus}
          comment={comment}
          setComment={setComment}
          guestsCount={guestsCount}
          setGuestsCount={setGuestsCount}
          handleSubmit={handleSubmit}
          isDeadlinePassed={isDeadlinePassed}
        />

        <InviteChecklist 
          checklist={checklist}
          invitee={invitee}
          onRefresh={fetchUpdatedData}
          handleClaimItem={handleClaimItem}
          handleUnclaimItem={handleUnclaimItem}
        />

        <InvitePolls 
          polls={polls}
          invitee={invitee}
          onRefresh={fetchUpdatedData}
          handleVote={handleVote}
        />

        <InviteMessages 
          messages={messages}
          invitee={invitee}
          aktion={aktion}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handlePostMessage={handlePostMessage}
          handleDeleteMessage={handleDeleteMessage}
        />

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
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                  <span className="micro-label">Teilnehmerliste</span>
                </div>
                <h2 className="text-5xl sm:text-7xl font-serif font-black text-white tracking-tighter leading-none">
                  Dabei
                </h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="text-6xl font-serif font-black text-white/5 leading-none">/0{data.participants.length}</div>
                 <span className="micro-label !text-white/30 tracking-[0.4em]">Teilnehmer</span>
              </div>
            </div>
            
            <div className="grid gap-6">
              {data.participants.map((p: any, i: number) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-10 rounded-4xl premium-card border-white/[0.04] shadow-none hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-10">
                    <div className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center font-serif font-black text-4xl shadow-2xl group-hover:scale-105 transition-transform duration-500">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-2">
                      <div className="font-black text-white text-3xl font-serif tracking-tighter leading-none">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-3">
                        {p.status === 'yes' && <div className="micro-label !text-emerald-400">Einsatzbereit</div>}
                        {p.status === 'maybe' && <div className="micro-label !text-amber-400">Unklar</div>}
                        {p.status === 'no' && <div className="micro-label !text-rose-400">Abgewiesen</div>}
                        {p.guests_count > 0 && (
                          <div className="micro-label !text-white/20 ml-2 border-l border-white/5 pl-4">
                            +{p.guests_count} Gäste
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      p.status === 'yes' ? 'bg-emerald-400' : p.status === 'maybe' ? 'bg-amber-400' : 'bg-rose-400'
                    } shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:scale-150`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <InviteProfile 
          invitee={invitee}
          currentUser={currentUser}
          setupUsername={setupUsername}
          setSetupUsername={setSetupUsername}
          setupPassword={setupPassword}
          setSetupPassword={setSetupPassword}
          isSettingUp={isSettingUp}
          handleSetupProfile={handleSetupProfile}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          isLoggingIn={isLoggingIn}
          handleLogin={handleLogin}
        />
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
