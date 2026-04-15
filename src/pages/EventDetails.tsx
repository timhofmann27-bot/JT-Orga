import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, HelpCircle, Clock, Copy, Trash2, Plus, MapPin, Calendar, MessageSquare, UserPlus, Send, Edit2, Hourglass } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function EventDetails() {
  const { id } = useParams();
  if (!id) return <div className="p-8 text-center">Event nicht gefunden</div>;
  const [aktion, setAktion] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [invitationSteps, setInvitationSteps] = useState<any[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [deleteInviteeId, setDeleteInviteeId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [stepFormData, setStepFormData] = useState({ name: '', message: '', scheduled_at: '' });
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });

  useEffect(() => {
    fetchAktion();
    fetchInvites();
    fetchPersons();
    fetchInvitationSteps();
  }, [id]);

  const fetchAktion = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (res.ok) setAktion(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Aktion');
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}/invites`);
      if (res.ok) setInvites(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Einladungen');
    }
  };

  const fetchPersons = async () => {
    try {
      const res = await fetch('/api/admin/persons');
      if (res.ok) setPersons(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Personen');
    }
  };

  const fetchInvitationSteps = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}/invitation-steps`);
      if (res.ok) setInvitationSteps(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Einladungsschritte');
    }
  };

  const handleSaveStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingStep ? `/api/admin/events/${id}/invitation-steps/${editingStep.id}` : `/api/admin/events/${id}/invitation-steps`;
    const method = editingStep ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepFormData)
      });
      if (!res.ok) throw new Error('Fehler beim Speichern');
      toast.success('Schritt gespeichert');
      setShowStepModal(false);
      setEditingStep(null);
      setStepFormData({ name: '', message: '', scheduled_at: '' });
      fetchInvitationSteps();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTriggerStep = async (stepId: number) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/invitation-steps/${stepId}/trigger`, { method: 'POST' });
      if (!res.ok) throw new Error('Fehler beim Auslösen');
      toast.success('Schritt ausgelöst');
      fetchInvitationSteps();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/invitation-steps/${stepId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Schritt gelöscht');
      fetchInvitationSteps();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkInvite = async () => {
    if (selectedPersonIds.length === 0) return;
    
    try {
      const res = await fetch(`/api/admin/events/${id}/invites/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_ids: selectedPersonIds })
      });
      
      if (res.ok) {
        const data = await res.json();
        setShowBulkInviteModal(false);
        setSelectedPersonIds([]);
        
        if (data.no_profile_names && data.no_profile_names.length > 0) {
          toast.success(`${data.count} Personen eingeladen.`);
          toast.error(`${data.no_profile_names.length} Person(en) ohne Profil: ${data.no_profile_names.join(', ')}. Bitte Link manuell senden.`, { duration: 8000, icon: '⚠️' });
        } else {
          toast.success(`${data.count} Personen eingeladen`);
        }
        fetchInvites();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Hinzufügen');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteInvitee = async () => {
    if (!deleteInviteeId) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/invites/${deleteInviteeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Einladung gelöscht');
      fetchInvites();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteInviteeId(null);
    }
  };

  const handleResendInvite = async (inviteId: number) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/invites/${inviteId}/resend`, { method: 'POST' });
      if (!res.ok) throw new Error('Fehler beim erneuten Senden');
      toast.success('Einladung erneut gesendet');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = () => {
    setFormData({ 
      title: aktion.title, 
      date: aktion.date, 
      location: aktion.location, 
      meeting_point: aktion.meeting_point || '',
      description: aktion.description || '', 
      response_deadline: aktion.response_deadline || '' 
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern');
      }

      toast.success('Aktion aktualisiert');
      setShowEditModal(false);
      fetchAktion();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link kopiert!');
  };

  if (!aktion) return <div className="p-8 text-center">Lade...</div>;

  const stats = {
    yes: invites.filter((i: any) => i.status === 'yes').length,
    no: invites.filter((i: any) => i.status === 'no').length,
    maybe: invites.filter((i: any) => i.status === 'maybe').length,
    pending: invites.filter((i: any) => i.status === 'pending').length,
    total: invites.length
  };

  const filteredInvitees = invites.filter((i: any) => filter === 'all' || i.status === filter);

  // Filter out persons that are already invited
  const availablePersons = persons.filter(p => !invites.some(i => i.person_id === p.id));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 text-sm font-bold uppercase tracking-widest transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Übersicht
      </Link>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#111] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden mb-10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="h-40 bg-gradient-to-r from-blue-900/40 to-purple-900/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        </div>
        <div className="px-4 pb-6 -mt-16 relative z-10">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="w-20 h-20 bg-black rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center mb-4 overflow-hidden backdrop-blur-xl">
                <div className="bg-white/5 w-full h-full flex flex-col items-center justify-center text-white">
                  <span className="text-[10px] font-bold uppercase text-blue-400 tracking-widest">{aktion?.date ? format(parseISO(aktion.date), 'MMM', { locale: de }) : '-'}</span>
                  <span className="text-2xl font-black leading-none">{aktion?.date ? format(parseISO(aktion.date), 'dd') : '-'}</span>
                </div>
              </div>
              <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{aktion?.title || '-'}</h1>
              <div className="flex flex-col gap-2 text-white/60 text-xs">
                <span className="flex items-center gap-2 font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/10"><Clock className="w-3.5 h-3.5 text-blue-400" /> {aktion?.date ? format(parseISO(aktion.date), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'} Uhr</span>
                <span className="flex items-center gap-2 font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/10"><MapPin className="w-3.5 h-3.5 text-purple-400" /> {aktion?.location || '-'}</span>
                {aktion?.meeting_point && (
                  <span className="flex items-center gap-2 font-medium text-white bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                    <span className="text-white/50 font-normal">Treffpunkt:</span> {aktion.meeting_point}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={openEdit}
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 shadow-lg backdrop-blur-md"
              >
                Bearbeiten
              </button>
            </div>
          </div>
          {aktion.description && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 text-white/80 text-xs leading-relaxed backdrop-blur-sm">
              {aktion.description}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Visualization */}
      <div className="bg-[#111] p-6 rounded-2xl border border-white/10 shadow-xl mb-8">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Teilnehmer-Status</h3>
          <span className="text-xs font-bold text-white">{stats.yes + stats.no + stats.maybe} / {stats.total} Antworten</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex mb-4">
          {stats.total > 0 && (
            <>
              <div style={{ width: `${(stats.yes / stats.total) * 100}%` }} className="bg-green-500 h-full" title="Zusagen" />
              <div style={{ width: `${(stats.no / stats.total) * 100}%` }} className="bg-red-500 h-full" title="Absagen" />
              <div style={{ width: `${(stats.maybe / stats.total) * 100}%` }} className="bg-amber-500 h-full" title="Vielleicht" />
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-900/20 p-2 rounded-lg border border-green-500/20">
            <div className="text-[9px] font-black text-green-400/60 uppercase">Ja</div>
            <div className="text-sm font-black text-green-400">{stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0}%</div>
          </div>
          <div className="bg-red-900/20 p-2 rounded-lg border border-red-500/20">
            <div className="text-[9px] font-black text-red-400/60 uppercase">Nein</div>
            <div className="text-sm font-black text-red-400">{stats.total > 0 ? Math.round((stats.no / stats.total) * 100) : 0}%</div>
          </div>
          <div className="bg-amber-900/20 p-2 rounded-lg border border-amber-500/20">
            <div className="text-[9px] font-black text-amber-400/60 uppercase">Vielleicht</div>
            <div className="text-sm font-black text-amber-400">{stats.total > 0 ? Math.round((stats.maybe / stats.total) * 100) : 0}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Invites List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111] rounded-2xl shadow-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Teilnehmer
              </h2>
              <select 
                value={filter} 
                onChange={e => setFilter(e.target.value)}
                className="border border-white/20 rounded-lg text-[10px] font-bold p-2 bg-black text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              >
                <option value="all">Alle ({invites.length})</option>
                <option value="yes">Zusagen ({stats.yes})</option>
                <option value="no">Absagen ({stats.no})</option>
                <option value="maybe">Vielleicht ({stats.maybe})</option>
                <option value="pending">Offen ({stats.pending})</option>
              </select>
            </div>

            <div className="divide-y divide-white/5">
              {filteredInvitees.length > 0 ? (
                filteredInvitees.map((invitee: any) => (
                  <div key={invitee.id} className="p-4 hover:bg-white/5 transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-inner ${
                          invitee.status === 'yes' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          invitee.status === 'no' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          invitee.status === 'maybe' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-white/10 text-white/50 border border-white/10'
                        }`}>
                          {(invitee.name_snapshot || invitee.current_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            {invitee.name_snapshot || invitee.current_name}
                            {invitee.guests_count > 0 && (
                              <span className="text-[9px] bg-white text-black px-1.5 py-0 rounded-full font-black">
                                +{invitee.guests_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {invitee.status === 'yes' && <span className="text-[10px] font-black uppercase text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Zugesagt</span>}
                            {invitee.status === 'no' && <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3"/> Abgesagt</span>}
                            {invitee.status === 'maybe' && <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1"><HelpCircle className="w-3 h-3"/> Vielleicht</span>}
                            {invitee.status === 'pending' && <span className="text-[10px] font-black uppercase text-white/40 flex items-center gap-1"><Clock className="w-3 h-3"/> Offen</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-60">
                        <button 
                          onClick={() => handleResendInvite(invitee.id)}
                          className="p-2 text-white/60 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          title="Erinnern"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteInviteeId(invitee.id)}
                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-white/50 text-sm font-medium">Keine Teilnehmer.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Actions & Info */}
        <div className="space-y-4">
          {/* Add Person Card */}
          <div className="bg-white rounded-2xl p-6 text-black shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-black mb-3 flex items-center gap-2 relative z-10">
              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              Einladen
            </h3>
            <p className="text-xs text-gray-600 mb-4 font-medium relative z-10">Wähle Mitglieder für dieses Event aus.</p>
            <button 
              onClick={() => {
                setSelectedPersonIds([]);
                setShowBulkInviteModal(true);
              }}
              className="w-full bg-black text-white py-3 rounded-lg text-xs font-black hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 flex items-center justify-center gap-2 shadow-lg relative z-10"
            >
              <Users className="w-3.5 h-3.5" />
              Auswählen
            </button>
          </div>

          {/* Quick Info Card */}
          <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Event Info</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                  <Calendar className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <div className="text-[9px] font-black text-white/40 uppercase tracking-wider">Erstellt</div>
                  <div className="text-xs font-bold text-white">{aktion.created_at ? format(parseISO(aktion.created_at), 'dd.MM.yyyy') : '-'}</div>
                </div>
              </div>
              {aktion?.response_deadline && (
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0 border border-red-500/20">
                    <Clock className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-red-400 uppercase tracking-wider">Frist</div>
                    <div className="text-xs font-bold text-white">{aktion?.response_deadline ? format(parseISO(aktion.response_deadline), 'dd.MM. HH:mm') : '-'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Steps Card */}
          <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Einladungsschritte</h3>
              <button onClick={() => { setEditingStep(null); setStepFormData({ name: '', message: '', scheduled_at: '' }); setShowStepModal(true); }} className="text-white/60 hover:text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {invitationSteps.map(step => (
                <div key={step.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-white text-xs">{step.name}</div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingStep(step); setStepFormData({ name: step.name, message: step.message, scheduled_at: step.scheduled_at || '' }); setShowStepModal(true); }} className="text-white/40 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteStep(step.id)} className="text-white/40 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/50 mb-1 line-clamp-2">{step.message}</div>
                  <div className="flex justify-between items-center">
                    <div className="text-[9px] text-white/30 font-mono">{step.scheduled_at ? format(parseISO(step.scheduled_at), 'dd.MM. HH:mm') : 'Sofort'}</div>
                    {!step.sent_at && <button onClick={() => handleTriggerStep(step.id)} className="text-[10px] font-bold text-blue-400 hover:text-blue-300">Senden</button>}
                    {step.sent_at && <span className="text-[10px] text-green-400">Gesendet</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteInviteeId !== null}
        title="Einladung löschen"
        message="Möchtest du diese Einladung wirklich löschen? Der Link wird ungültig und die Antwort der Person geht verloren."
        onConfirm={handleDeleteInvitee}
        onCancel={() => setDeleteInviteeId(null)}
      />

      {showStepModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xl">
          <motion.div className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
            <h2 className="text-2xl font-bold mb-6 text-white">{editingStep ? 'Schritt bearbeiten' : 'Neuer Schritt'}</h2>
            <form onSubmit={handleSaveStep} className="space-y-4">
              <input required type="text" placeholder="Name (z.B. Ankündigung)" value={stepFormData.name} onChange={e => setStepFormData({...stepFormData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              <textarea required placeholder="Nachricht" value={stepFormData.message} onChange={e => setStepFormData({...stepFormData, message: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" rows={3} />
              <input type="datetime-local" value={stepFormData.scheduled_at} onChange={e => setStepFormData({...stepFormData, scheduled_at: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white [color-scheme:dark]" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowStepModal(false)} className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl">Abbrechen</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-white text-black rounded-xl font-bold">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-bold mb-8 text-white tracking-tight relative z-10">Aktion bearbeiten</h2>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Titel</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" placeholder="z.B. Wanderung im Taunus" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Datum & Uhrzeit</label>
                <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Ort</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Treffpunkt (optional)</label>
                <input type="text" value={formData.meeting_point} onChange={e => setFormData({...formData, meeting_point: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" placeholder="z.B. Parkplatz am Zoo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Beschreibung (optional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Antwortfrist (optional)</label>
                <input type="datetime-local" value={formData.response_deadline} onChange={e => setFormData({...formData, response_deadline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all [color-scheme:dark]" />
                <p className="text-xs text-white/40 mt-2">Nach diesem Datum können Teilnehmer nicht mehr antworten.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="w-full sm:flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-bold transition-colors">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showBulkInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 max-h-[90vh] flex flex-col relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-bold mb-8 text-white tracking-tight relative z-10">Personen auswählen</h2>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-white/50">{selectedPersonIds.length} ausgewählt</span>
              <button 
                onClick={() => setSelectedPersonIds(selectedPersonIds.length === availablePersons.length ? [] : availablePersons.map(p => p.id))}
                className="text-sm text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                {selectedPersonIds.length === availablePersons.length ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-white/10 rounded-2xl divide-y divide-white/5 mb-6 max-h-64 bg-white/5">
              {availablePersons.map(p => (
                <label key={p.id} className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedPersonIds.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPersonIds([...selectedPersonIds, p.id]);
                      else setSelectedPersonIds(selectedPersonIds.filter(id => id !== p.id));
                    }}
                    className="w-5 h-5 text-blue-500 rounded border-white/20 bg-black/50 focus:ring-blue-500 focus:ring-offset-black"
                  />
                  <span className="font-bold text-white">{p.name}</span>
                </label>
              ))}
              {availablePersons.length === 0 && (
                <div className="p-6 text-center text-white/50 text-sm font-medium">Alle Personen wurden bereits eingeladen.</div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={() => setShowBulkInviteModal(false)} className="w-full sm:flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors">Abbrechen</button>
              <button 
                onClick={handleBulkInvite} 
                disabled={selectedPersonIds.length === 0}
                className="w-full sm:flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPersonIds.length} Personen einladen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
