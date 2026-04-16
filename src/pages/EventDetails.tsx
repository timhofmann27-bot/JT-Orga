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

  const handleUpdateStatus = async (inviteeId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/invites/${inviteeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Fehler beim Aktualisieren');
      toast.success('Status aktualisiert');
      fetchInvites();
    } catch (e: any) {
      toast.error(e.message);
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
    <div className="pb-24">
      <Link to="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white mb-12 text-sm font-bold uppercase tracking-[0.2em] transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Zurück zur Übersicht
      </Link>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden mb-16 relative"
      >
        <div className="h-64 bg-gradient-to-br from-white/[0.05] to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
        </div>
        <div className="px-12 pb-12 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="flex-1">
              <div className="w-32 h-32 bg-[#050505] rounded-3xl shadow-2xl border border-white/10 flex items-center justify-center mb-8 overflow-hidden backdrop-blur-xl">
                <div className="bg-white/5 w-full h-full flex flex-col items-center justify-center text-white">
                  <span className="text-xs font-bold uppercase text-white/30 tracking-[0.2em] mb-1">{aktion?.date ? format(parseISO(aktion.date), 'MMM', { locale: de }) : '-'}</span>
                  <span className="text-5xl font-serif font-bold leading-none">{aktion?.date ? format(parseISO(aktion.date), 'dd') : '-'}</span>
                </div>
              </div>
              <h1 className="text-5xl font-serif font-bold text-white mb-6 tracking-tight">{aktion?.title || '-'}</h1>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-3 font-medium bg-white/5 px-5 py-3 rounded-2xl border border-white/5 text-white/60">
                  <Clock className="w-4 h-4 text-white/20" /> 
                  {aktion?.date ? format(parseISO(aktion.date), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'} Uhr
                </span>
                <span className="flex items-center gap-3 font-medium bg-white/5 px-5 py-3 rounded-2xl border border-white/5 text-white/60">
                  <MapPin className="w-4 h-4 text-white/20" /> 
                  {aktion?.location || '-'}
                </span>
                {aktion?.meeting_point && (
                  <span className="flex items-center gap-3 font-medium bg-white/10 px-5 py-3 rounded-2xl border border-white/10 text-white">
                    <span className="text-white/30 font-normal">Treffpunkt:</span> {aktion.meeting_point}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={openEdit}
              className="px-8 py-4 bg-white text-black rounded-2xl text-sm font-bold hover:bg-white/90 transition-all shadow-2xl shadow-white/5"
            >
              Aktion bearbeiten
            </button>
          </div>
          {aktion.description && (
            <div className="mt-12 p-8 bg-white/5 rounded-[2rem] border border-white/5 text-white/60 text-lg leading-relaxed font-medium">
              {aktion.description}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Visualization */}
      <div className="bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 shadow-2xl mb-16">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Teilnehmer-Status</h3>
          <span className="text-sm font-bold text-white/40">{stats.yes + stats.no + stats.maybe} / {stats.total} Antworten</span>
        </div>
        
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex mb-10">
          {stats.total > 0 && (
            <>
              <div style={{ width: `${(stats.yes / stats.total) * 100}%` }} className="bg-green-500/60 h-full transition-all duration-1000" />
              <div style={{ width: `${(stats.no / stats.total) * 100}%` }} className="bg-red-500/60 h-full transition-all duration-1000" />
              <div style={{ width: `${(stats.maybe / stats.total) * 100}%` }} className="bg-amber-500/60 h-full transition-all duration-1000" />
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Zusagen', count: stats.yes, total: stats.total, color: 'green' },
            { label: 'Absagen', count: stats.no, total: stats.total, color: 'red' },
            { label: 'Vielleicht', count: stats.maybe, total: stats.total, color: 'amber' }
          ].map((s) => (
            <div key={s.label} className={`bg-${s.color}-500/5 p-6 rounded-3xl border border-${s.color}-500/10`}>
              <div className={`text-[10px] font-bold text-${s.color}-400/60 uppercase tracking-widest mb-2`}>{s.label}</div>
              <div className="flex items-baseline gap-2">
                <div className={`text-3xl font-serif font-bold text-${s.color}-400`}>{s.count}</div>
                <div className={`text-sm font-bold text-${s.color}-400/30`}>
                  {s.total > 0 ? Math.round((s.count / s.total) * 100) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Invites List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-4">
                Teilnehmer
                <span className="text-sm font-sans font-bold text-white/20 bg-white/5 px-3 py-1 rounded-full">{invites.length}</span>
              </h2>
              <select 
                value={filter} 
                onChange={e => setFilter(e.target.value)}
                className="border border-white/10 rounded-xl text-[10px] font-bold px-4 py-2 bg-black text-white outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer uppercase tracking-widest"
              >
                <option value="all">Alle</option>
                <option value="yes">Zusagen</option>
                <option value="no">Absagen</option>
                <option value="maybe">Vielleicht</option>
                <option value="pending">Offen</option>
              </select>
            </div>

            <div className="divide-y divide-white/5">
              {filteredInvitees.length > 0 ? (
                filteredInvitees.map((invitee: any) => (
                  <div key={invitee.id} className="p-6 hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-serif text-xl font-bold ${
                          invitee.status === 'yes' ? 'bg-green-500/10 text-green-400 border border-green-500/10' :
                          invitee.status === 'no' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                          invitee.status === 'maybe' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                          'bg-white/5 text-white/20 border border-white/5'
                        }`}>
                          {(invitee.name_snapshot || invitee.current_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-serif text-xl text-white flex items-center gap-3">
                            {invitee.name_snapshot || invitee.current_name}
                            {invitee.guests_count > 0 && (
                              <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded-full font-bold">
                                +{invitee.guests_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <select 
                              value={invitee.status} 
                              onChange={(e) => handleUpdateStatus(invitee.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-black/40 border transition-all cursor-pointer outline-none ${
                                invitee.status === 'yes' ? 'text-green-400 border-green-500/20' :
                                invitee.status === 'no' ? 'text-red-400 border-red-500/20' :
                                invitee.status === 'maybe' ? 'text-amber-400 border-amber-500/20' :
                                'text-white/20 border-white/5'
                              }`}
                            >
                              <option value="pending">Offen</option>
                              <option value="yes">Zugesagt</option>
                              <option value="no">Abgesagt</option>
                              <option value="maybe">Vielleicht</option>
                            </select>
                            {invitee.responded_at && (
                              <span className="text-[10px] text-white/10 font-medium">
                                {format(parseISO(invitee.responded_at), 'dd.MM. HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleResendInvite(invitee.id)}
                          className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                          title="Erinnern"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setDeleteInviteeId(invitee.id)}
                          className="p-3 text-white/20 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
                          title="Löschen"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-white/10 text-lg font-serif">Keine Teilnehmer gefunden.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Actions & Info */}
        <div className="space-y-8">
          {/* Add Person Card */}
          <div className="bg-white rounded-[2.5rem] p-10 text-black shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-2xl font-serif font-bold mb-3">Einladen</h3>
              <p className="text-sm text-black/40 mb-8 font-medium leading-relaxed">Wähle Mitglieder aus deinem Netzwerk für dieses Event aus.</p>
              <button 
                onClick={() => {
                  setSelectedPersonIds([]);
                  setShowBulkInviteModal(true);
                }}
                className="w-full bg-black text-white py-5 rounded-2xl text-sm font-bold hover:bg-black/90 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                <UserPlus className="w-4 h-4" />
                Personen wählen
              </button>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white/[0.02] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-8">Event Info</h3>
            <div className="space-y-8">
              <div className="flex gap-5 items-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                  <Calendar className="w-5 h-5 text-white/20" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Erstellt</div>
                  <div className="text-lg font-serif font-bold text-white">{aktion?.created_at ? format(parseISO(aktion.created_at), 'dd.MM.yyyy') : '-'}</div>
                </div>
              </div>
              {aktion?.response_deadline && (
                <div className="flex gap-5 items-center">
                  <div className="w-12 h-12 bg-red-500/5 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/10">
                    <Clock className="w-5 h-5 text-red-400/40" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-red-400/40 uppercase tracking-widest mb-1">Frist</div>
                    <div className="text-lg font-serif font-bold text-white">{format(parseISO(aktion.response_deadline), 'dd.MM. HH:mm')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Steps Card */}
          <div className="bg-white/[0.02] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Workflows</h3>
              <button 
                onClick={() => { setEditingStep(null); setStepFormData({ name: '', message: '', scheduled_at: '' }); setShowStepModal(true); }} 
                className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {invitationSteps.map(step => (
                <div key={step.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-serif text-lg font-bold text-white">{step.name}</div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingStep(step); setStepFormData({ name: step.name, message: step.message, scheduled_at: step.scheduled_at || '' }); setShowStepModal(true); }} className="text-white/20 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteStep(step.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="text-sm text-white/30 mb-4 line-clamp-2 font-medium leading-relaxed">{step.message}</div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{step.scheduled_at ? format(parseISO(step.scheduled_at), 'dd.MM. HH:mm') : 'Manuell'}</div>
                    {!step.sent_at && (
                      <button 
                        onClick={() => handleTriggerStep(step.id)} 
                        className="text-[10px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all uppercase tracking-widest"
                      >
                        Senden
                      </button>
                    )}
                    {step.sent_at && <span className="text-[10px] font-bold text-green-400/40 uppercase tracking-widest">Erledigt</span>}
                  </div>
                </div>
              ))}
              {invitationSteps.length === 0 && (
                <div className="text-center py-8 text-white/10 text-sm font-medium">Keine Workflows definiert.</div>
              )}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative overflow-hidden"
          >
            <h2 className="text-3xl font-serif font-bold mb-8 text-white">{editingStep ? 'Schritt bearbeiten' : 'Neuer Schritt'}</h2>
            <form onSubmit={handleSaveStep} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Name</label>
                <input required type="text" placeholder="z.B. Erste Einladung" value={stepFormData.name} onChange={e => setStepFormData({...stepFormData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Nachricht</label>
                <textarea required placeholder="Deine Nachricht..." value={stepFormData.message} onChange={e => setStepFormData({...stepFormData, message: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" rows={4} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Geplant für (optional)</label>
                <input type="datetime-local" value={stepFormData.scheduled_at} onChange={e => setStepFormData({...stepFormData, scheduled_at: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all [color-scheme:dark]" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowStepModal(false)} className="flex-1 px-6 py-4 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Abbrechen</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl max-w-xl w-full p-12 max-h-[90vh] overflow-y-auto relative overflow-hidden"
          >
            <h2 className="text-4xl font-serif font-bold mb-10 text-white tracking-tight">Aktion bearbeiten</h2>
            <form onSubmit={handleEditSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Titel</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all text-xl font-serif" />
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Datum & Uhrzeit</label>
                  <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Ort</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Treffpunkt</label>
                <input type="text" value={formData.meeting_point} onChange={e => setFormData({...formData, meeting_point: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Beschreibung</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" rows={4}></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Antwortfrist</label>
                <input type="datetime-local" value={formData.response_deadline} onChange={e => setFormData({...formData, response_deadline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all [color-scheme:dark]" />
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-8 py-5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Abbrechen</button>
                <button type="submit" className="flex-1 px-8 py-5 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showBulkInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl max-w-md w-full p-12 max-h-[90vh] flex flex-col relative overflow-hidden"
          >
            <h2 className="text-3xl font-serif font-bold mb-8 text-white tracking-tight">Personen wählen</h2>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{selectedPersonIds.length} ausgewählt</span>
              <button 
                onClick={() => setSelectedPersonIds(selectedPersonIds.length === availablePersons.length ? [] : availablePersons.map(p => p.id))}
                className="text-[10px] text-white/40 font-bold hover:text-white transition-colors uppercase tracking-widest"
              >
                {selectedPersonIds.length === availablePersons.length ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-white/5 rounded-3xl divide-y divide-white/5 mb-10 bg-white/5">
              {availablePersons.map(p => (
                <label key={p.id} className="flex items-center gap-5 p-6 hover:bg-white/5 cursor-pointer transition-colors group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={selectedPersonIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPersonIds([...selectedPersonIds, p.id]);
                        else setSelectedPersonIds(selectedPersonIds.filter(id => id !== p.id));
                      }}
                      className="w-6 h-6 rounded-lg border-white/10 bg-black/50 text-white focus:ring-white/10 focus:ring-offset-black transition-all cursor-pointer"
                    />
                  </div>
                  <span className="font-serif text-xl text-white/60 group-hover:text-white transition-colors">{p.name}</span>
                </label>
              ))}
              {availablePersons.length === 0 && (
                <div className="p-12 text-center text-white/10 font-serif text-lg">Keine weiteren Personen verfügbar.</div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowBulkInviteModal(false)} className="flex-1 px-6 py-4 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Abbrechen</button>
              <button 
                onClick={handleBulkInvite} 
                disabled={selectedPersonIds.length === 0}
                className="flex-1 px-6 py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Einladen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
