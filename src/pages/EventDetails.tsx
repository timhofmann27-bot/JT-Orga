import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, HelpCircle, Clock, Copy, Trash2, Plus, MapPin, Calendar, MessageSquare, UserPlus, Send, Edit2, Hourglass, Train, Compass, Trophy, Megaphone, Zap, Sun, Cloud, Thermometer, Wind, CloudRain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import MapComponent from '../components/MapComponent';
import TransitPlanner from '../components/TransitPlanner';
import { generateVCalendar } from '../lib/calendar';

export default function EventDetails() {
  const { id } = useParams();
  if (!id) return <div className="p-8 text-center">Event nicht gefunden</div>;
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'planning'>('overview');
  const [aktion, setAktion] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [invitationSteps, setInvitationSteps] = useState<any[]>([]);
  const [showTransit, setShowTransit] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [deleteInviteeId, setDeleteInviteeId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [stepFormData, setStepFormData] = useState({ name: '', message: '', scheduled_at: '' });
  const [checklistFormData, setChecklistFormData] = useState({ item_name: '', notes: '' });
  const [pollFormData, setPollFormData] = useState({ question: '', options: ['', ''] });
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '', type: 'event' });
  const [checklist, setChecklist] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchAktion();
    fetchInvites();
    fetchPersons();
    fetchInvitationSteps();
    fetchChecklist();
    fetchPolls();
    fetchMessages();
  }, [id]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Nachrichten');
    }
  };

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}/checklist`);
      if (res.ok) setChecklist(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Mitbringliste');
    }
  };

  const fetchPolls = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}/polls`);
      if (res.ok) setPolls(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Umfragen');
    }
  };

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

  const handleSaveChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/events/${id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checklistFormData)
      });
      if (!res.ok) throw new Error('Fehler beim Speichern');
      toast.success('Gegenstand hinzugefügt');
      setShowChecklistModal(false);
      setChecklistFormData({ item_name: '', notes: '' });
      fetchChecklist();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/checklist/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Gelöscht');
      fetchChecklist();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = pollFormData.options.filter(o => o.trim() !== '');
    if (filteredOptions.length < 2) {
      toast.error('Bitte mindestens 2 Optionen angeben');
      return;
    }
    try {
      const res = await fetch(`/api/admin/events/${id}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pollFormData, options: filteredOptions })
      });
      if (!res.ok) throw new Error('Fehler beim Erstellen');
      toast.success('Umfrage erstellt');
      setShowPollModal(false);
      setPollFormData({ question: '', options: ['', ''] });
      fetchPolls();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeletePoll = async (pollId: number) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/polls/${pollId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Umfrage gelöscht');
      fetchPolls();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      } else {
        throw new Error('Fehler beim Senden');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!window.confirm('Nachricht wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/messages/${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Nachricht gelöscht');
        fetchMessages();
      } else {
        throw new Error('Fehler beim Löschen');
      }
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
      response_deadline: aktion.response_deadline || '',
      type: aktion.type || 'event'
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

  if (!aktion) return <div className="p-8 text-center text-white font-serif">Lade...</div>;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'wanderung': return <Compass className="w-5 h-5" />;
      case 'sport': return <Trophy className="w-5 h-5" />;
      case 'demo': return <Megaphone className="w-5 h-5" />;
      case 'spontan': return <Zap className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'wanderung': return 'Wanderung';
      case 'sport': return 'Sport';
      case 'demo': return 'Demo';
      case 'spontan': return 'Spontan';
      default: return 'Aktion';
    }
  };

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
    <div className="pb-32">
      <Link to="/" className="inline-flex items-center gap-3 text-white/30 hover:text-white mb-10 text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Zurück
      </Link>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface-muted rounded-[3rem] border border-white/5 overflow-hidden mb-12 relative shadow-2xl"
      >
        <div className="h-40 sm:h-56 bg-gradient-to-br from-white/[0.05] to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
          <div className="absolute top-6 right-6">
            <button 
              onClick={openEdit}
              className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"
              title="Aktion bearbeiten"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 pb-10 sm:px-12 sm:pb-14 -mt-12 sm:-mt-16 relative z-10">
          <div className="flex flex-col gap-8">
            <div className="flex-1 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-surface-elevated rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden backdrop-blur-2xl ring-8 ring-black/20 shrink-0">
                  <div className="bg-white/5 w-full h-full flex flex-col items-center justify-center text-white">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-white/20 tracking-[0.3em] mb-1">{aktion?.date ? format(parseISO(aktion.date), 'MMM', { locale: de }) : '-'}</span>
                    <span className="text-4xl sm:text-5xl font-serif font-bold leading-none tracking-tighter">{aktion?.date ? format(parseISO(aktion.date), 'dd') : '-'}</span>
                  </div>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-black shrink-0">
                  {getEventIcon(aktion.type)}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse" />
                  <span className="micro-label !text-white/40">{getEventLabel(aktion.type)}</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tighter leading-[0.9]">{aktion?.title || '-'}</h1>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-2.5 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 text-white/50 text-xs font-bold uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" /> 
                    {aktion?.date ? format(parseISO(aktion.date), 'HH:mm', { locale: de }) : '-'} Uhr
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 text-white/50 text-xs font-bold uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5" /> 
                    {aktion?.location || '-'}
                  </div>
                  {aktion?.meeting_point && (
                    <div className="flex items-center gap-2.5 bg-white text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-white/5">
                      Treffpunkt: {aktion.meeting_point}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {aktion.description && (
            <div className="mt-12 p-8 bg-black/20 rounded-[2.5rem] border border-white/5 text-white/40 text-base sm:text-lg leading-relaxed font-medium">
              {aktion.description}
            </div>
          )}
          
          <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-4">
            <button 
              onClick={() => setShowTransit(true)}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-[1.8rem] flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all active:scale-95 shadow-2xl"
            >
              <Train className="w-5 h-5" /> Route planen
            </button>
            <button 
              onClick={() => generateVCalendar(aktion, `${window.location.origin}/invite/${aktion.token}`)}
              className="bg-white text-black px-8 py-5 rounded-[1.8rem] flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl shadow-white/10"
            >
              <Calendar className="w-5 h-5" /> Kalender
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 px-2 sm:px-0 border-b border-white/5 pb-4">
        {[
          { id: 'overview', label: 'Übersicht', icon: Calendar },
          { id: 'participants', label: 'Teilnehmer', icon: Users },
          { id: 'planning', label: 'Planung & Orga', icon: Edit2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${
              activeTab === tab.id 
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-100' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white scale-95 hover:scale-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            <div className="space-y-10">
              {/* Weather Card */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-[3rem] p-8 sm:p-10 border border-blue-500/20 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col gap-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.4em] mb-2">Vorhersage</h3>
                      <div className="text-2xl font-serif font-bold text-white tracking-tight">{aktion?.location || 'Ort unbekannt'}</div>
                    </div>
                    <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-500/20">
                      <Sun className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="text-6xl sm:text-7xl font-sans font-bold text-white tracking-tighter leading-none">24°</div>
                    <div className="text-lg text-blue-200/60 font-medium mb-1">Heiter bis wolkig</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-blue-500/10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-blue-200/40 tracking-widest flex items-center"><CloudRain className="w-3 h-3 mr-1" /> Regen</span>
                      <span className="text-sm font-bold text-white">10%</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-blue-200/40 tracking-widest flex items-center"><Wind className="w-3 h-3 mr-1" /> Wind</span>
                      <span className="text-sm font-bold text-white">12 km/h</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-blue-200/40 tracking-widest flex items-center"><Thermometer className="w-3 h-3 mr-1" /> Gefühlt</span>
                      <span className="text-sm font-bold text-white">26°</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="bg-surface-muted rounded-[3rem] p-8 sm:p-10 border border-white/5 shadow-2xl space-y-10">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Details</h3>
                <div className="space-y-8">
                  <div className="flex gap-6 items-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                      <Calendar className="w-5 h-5 text-white/20" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Erstellt</div>
                      <div className="text-lg font-serif font-bold text-white tracking-tight">{aktion?.created_at ? format(parseISO(aktion.created_at), 'dd.MM.yyyy') : '-'}</div>
                    </div>
                  </div>
                  {aktion?.response_deadline && (
                    <div className="flex gap-6 items-center">
                      <div className="w-12 h-12 bg-red-500/5 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/10">
                        <Clock className="w-5 h-5 text-red-400/30" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-red-500/30 uppercase tracking-widest mb-1">Deadline</div>
                        <div className="text-lg font-serif font-bold text-white tracking-tight">{format(parseISO(aktion.response_deadline), 'dd.MM. HH:mm')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {/* Action Map */}
              {aktion?.location && (
                <div className="bg-surface-muted rounded-[2.5rem] p-2 border border-white/5 shadow-2xl overflow-hidden group">
                  <div className="rounded-[2.2rem] overflow-hidden grayscale contrast-[1.2] invert brightness-[0.8] opacity-60 group-hover:opacity-100 transition-opacity">
                    <MapComponent location={aktion.location} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'participants' && (
          <motion.div 
            key="participants"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2 sm:px-0">
              {[
                { label: 'Dabei', count: stats.yes, total: stats.total, color: 'emerald', icon: CheckCircle },
                { label: 'Vielleicht', count: stats.maybe, total: stats.total, color: 'amber', icon: HelpCircle },
                { label: 'Abgesagt', count: stats.no, total: stats.total, color: 'red', icon: XCircle },
                { label: 'Offen', count: stats.pending, total: stats.total, color: 'blue', icon: Hourglass }
              ].map((s) => (
                <div key={s.label} className="bg-surface-muted p-6 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 group hover:bg-surface-elevated transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{s.label}</div>
                    <s.icon className={`w-3.5 h-3.5 text-${s.color}-400/30 group-hover:text-${s.color}-400 transition-colors`} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className={`text-4xl font-serif font-bold text-white tracking-tighter`}>{s.count}</div>
                    <div className="text-[10px] font-bold text-white/20">
                      {s.total > 0 ? Math.round((s.count / s.total) * 100) : 0}%
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.total > 0 ? (s.count / s.total) * 100 : 0}%` }}
                      className={`h-full bg-${s.color}-500 transition-all`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Main Content: Invites List */}
              <div className="lg:col-span-2 space-y-10">
          <div className="bg-surface-muted rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 sm:p-10 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/[0.02]">
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3 tracking-tighter">
                  Teilnehmer
                  <div className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-white/30 border border-white/5">
                    {invites.length}
                  </div>
                </h2>
                <p className="text-white/30 text-xs font-medium tracking-tight">Status aller versendeten Einladungen</p>
              </div>
              <div className="w-full sm:w-auto">
                <select 
                  value={filter} 
                  onChange={e => setFilter(e.target.value)}
                  className="w-full sm:w-auto border border-white/10 rounded-2xl text-[10px] font-black px-6 py-3 bg-black text-white outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer uppercase tracking-[0.2em] shadow-xl"
                >
                  <option value="all">Alle anzeigen</option>
                  <option value="yes">Zusagen</option>
                  <option value="maybe">Vielleicht</option>
                  <option value="no">Absagen</option>
                  <option value="pending">Noch offen</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-white/5 px-2">
              {filteredInvitees.length > 0 ? (
                filteredInvitees.map((invitee: any) => (
                  <div key={invitee.id} className="p-6 hover:bg-white/[0.03] transition-all group rounded-2xl mx-2 my-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-serif text-xl font-bold shadow-2xl relative overflow-hidden ${
                          invitee.status === 'yes' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                          invitee.status === 'no' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                          invitee.status === 'maybe' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                          'bg-white/5 text-white/20 border border-white/5'
                        }`}>
                          <div className="relative z-10">{(invitee.name_snapshot || invitee.current_name || '?').charAt(0).toUpperCase()}</div>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="font-serif text-xl text-white flex items-center gap-3 tracking-tight font-bold">
                            {invitee.name_snapshot || invitee.current_name}
                            {invitee.guests_count > 0 && (
                              <div className="text-[10px] bg-white text-black px-2 py-0.5 rounded-lg font-black tracking-widest shadow-xl">
                                +{invitee.guests_count}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <select 
                              value={invitee.status} 
                              onChange={(e) => handleUpdateStatus(invitee.id, e.target.value)}
                              className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-black border transition-all cursor-pointer outline-none shadow-lg ${
                                invitee.status === 'yes' ? 'text-emerald-400 border-emerald-500/20' :
                                invitee.status === 'no' ? 'text-red-400 border-red-500/20' :
                                invitee.status === 'maybe' ? 'text-amber-400 border-amber-500/20' :
                                'text-white/20 border-white/5'
                              }`}
                            >
                              <option value="pending">Offen</option>
                              <option value="yes">Dabei</option>
                              <option value="maybe">Vielleicht</option>
                              <option value="no">Absagt</option>
                            </select>
                            {invitee.responded_at && (
                              <span className="text-[10px] text-white/10 font-bold uppercase tracking-widest">
                                {format(parseISO(invitee.responded_at), 'dd.MM. HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => copyLink(invitee.token)}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                          title="Link kopieren"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleResendInvite(invitee.id)}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                          title="Erinnern"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteInviteeId(invitee.id)}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 rounded-2xl transition-all active:scale-90"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-24 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-white/10" />
                  </div>
                  <p className="text-white/30 font-serif text-lg">Keine Teilnehmer gefunden.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/* Add Person Card */}
          <div className="bg-white rounded-[3rem] p-8 sm:p-10 text-black shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer" onClick={() => setShowBulkInviteModal(true)}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-black/[0.03] rounded-bl-[5rem] -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex flex-col gap-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-black tracking-tighter leading-none">Einladen</h3>
                <p className="text-sm text-black/40 font-bold tracking-tight">Netzwerkmitglieder hinzufügen.</p>
              </div>
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )}

  {activeTab === 'planning' && (
    <motion.div 
      key="planning"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-10"
    >
      <div className="space-y-10">

          {/* Invitation Steps Card */}
          <div className="bg-surface-muted rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 relative z-10">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Workflows</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingStep(null); setStepFormData({ name: '', message: '', scheduled_at: '' }); setShowStepModal(true); }} 
                className="w-10 h-10 bg-white shadow-2xl text-black rounded-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 relative z-10">
              {invitationSteps.map(step => (
                <div key={step.id} className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 group hover:bg-white/[0.05] transition-colors overflow-hidden relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-serif text-lg font-bold text-white tracking-tight">{step.name}</div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingStep(step); setStepFormData({ name: step.name, message: step.message, scheduled_at: step.scheduled_at || '' }); setShowStepModal(true); }} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white transition-colors active:scale-90"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteStep(step.id)} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="text-xs text-white/30 mb-6 line-clamp-2 font-medium leading-relaxed tracking-tight">{step.message}</div>
                  <div className="flex justify-between items-center pt-5 border-t border-white/5">
                    <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">{step.scheduled_at ? format(parseISO(step.scheduled_at), 'dd.MM. HH:mm') : 'Manuell'}</div>
                    {!step.sent_at ? (
                      <button 
                        onClick={() => handleTriggerStep(step.id)} 
                        className="bg-white text-black text-[9px] font-black px-4 py-2 rounded-xl hover:bg-white/90 transition-all uppercase tracking-widest shadow-xl shadow-white/5"
                      >
                        Senden
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                        <CheckCircle className="w-3 h-3" /> Erledigt
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {invitationSteps.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Keine Schritte</p>
                </div>
              )}
            </div>
          </div>

          {/* Checklist Card */}
          <div className="bg-surface-muted rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 relative z-10">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Mitbringliste</h3>
              <button 
                onClick={() => { setChecklistFormData({ item_name: '', notes: '' }); setShowChecklistModal(true); }} 
                className="w-10 h-10 bg-white shadow-2xl text-black rounded-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 relative z-10">
              {checklist.map(item => (
                <div key={item.id} className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-sm font-bold tracking-tight ${item.claimer_person_id ? 'text-white/40' : 'text-white'}`}>{item.item_name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.claimer_person_id ? 'text-emerald-400' : 'text-white/10'}`}>
                        {item.claimer_name ? `Besorgt von: ${item.claimer_name}` : 'Offen'}
                      </span>
                    </div>
                    {item.notes && <span className="text-[10px] text-white/20">{item.notes}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDeleteChecklistItem(item.id)} className="w-10 h-10 flex items-center justify-center text-white/10 hover:text-red-400 transition-colors active:scale-90">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {checklist.length === 0 && (
                <div className="text-center py-10 px-4 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Die Mitbringliste ist noch leer.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/* Polls Card */}
          <div className="bg-surface-muted rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 relative z-10">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Umfragen</h3>
              <button 
                onClick={() => { setPollFormData({ question: '', options: ['', ''] }); setShowPollModal(true); }} 
                className="w-10 h-10 bg-white shadow-2xl text-black rounded-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-6 relative z-10">
              {polls.map(poll => (
                <div key={poll.id} className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-serif font-bold text-white text-lg tracking-tight">{poll.question}</h4>
                    <button onClick={() => handleDeletePoll(poll.id)} className="text-white/10 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {poll.options.map((opt: any) => (
                      <div key={opt.id} className="relative h-10 bg-white/5 rounded-xl overflow-hidden border border-white/5">
                        <div 
                          className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-1000"
                          style={{ width: `${poll.options.reduce((a: any, b: any) => a + b.vote_count, 0) > 0 ? (opt.vote_count / poll.options.reduce((a: any, b: any) => a + b.vote_count, 0)) * 100 : 0}%` }}
                        />
                        <div className="relative h-full flex items-center justify-between px-4 text-[10px] font-bold text-white/60 tracking-widest uppercase">
                          <span>{opt.option_text}</span>
                          <span>{opt.vote_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {polls.length === 0 && (
                <div className="text-center py-10 px-4 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Keine Umfragen erstellt.</p>
                </div>
              )}
            </div>
          </div>
          {/* Message Board */}
          <div className="bg-surface-muted rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 relative z-10">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Pinnwand</h3>
              <MessageSquare className="w-5 h-5 text-white/20" />
            </div>

            <div className="space-y-4 mb-8">
              {messages.length === 0 ? (
                <div className="text-center py-10 px-4 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Noch keine Nachrichten.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`p-4 rounded-2xl border ${msg.is_admin ? 'bg-white/5 border-white/20' : 'bg-black/40 border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tracking-tight ${msg.is_admin ? 'text-white' : 'text-white/60'}`}>
                          {msg.is_admin ? (aktion?.title || 'Event Team') : msg.person_name}
                        </span>
                        {msg.is_admin && <span className="bg-white text-black px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Orga</span>}
                        <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest">{format(parseISO(msg.created_at), 'dd.MM HH:mm')}</span>
                      </div>
                      <button onClick={() => handleDeleteMessage(msg.id)} className="text-white/10 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostMessage} className="relative z-10">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Als Orga an die Pinnwand schreiben..."
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 pr-14 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-colors resize-none h-24"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="absolute bottom-4 right-4 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-white/5 disabled:text-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4 -ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  <ConfirmModal 
        isOpen={deleteInviteeId !== null}
        title="Einladung löschen"
        message="Möchtest du diese Einladung wirklich löschen? Der Link wird ungültig und die Antwort der Person geht verloren."
        onConfirm={handleDeleteInvitee}
        onCancel={() => setDeleteInviteeId(null)}
      />

      {showStepModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl max-w-md w-full p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <h2 className="text-4xl font-serif font-bold mb-10 text-white tracking-tighter shrink-0">{editingStep ? 'Schritt' : 'Neu'} <span className="text-white/30">Workflows</span></h2>
            <form onSubmit={handleSaveStep} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Name</label>
                <input required type="text" placeholder="z.B. Erste Einladung" value={stepFormData.name} onChange={e => setStepFormData({...stepFormData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all font-serif text-xl" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Nachricht</label>
                <textarea required placeholder="Deine Nachricht..." value={stepFormData.message} onChange={e => setStepFormData({...stepFormData, message: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all text-base leading-relaxed min-h-[150px] resize-none" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Geplant (optional)</label>
                <input type="datetime-local" value={stepFormData.scheduled_at} onChange={e => setStepFormData({...stepFormData, scheduled_at: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all [color-scheme:dark]" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setShowStepModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-xs uppercase tracking-widest">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-black hover:bg-white/90 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-white/10">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl max-w-xl w-full p-8 sm:p-12 max-h-[95vh] overflow-y-auto relative overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-12 text-white tracking-tighter">Event <span className="text-white/30">Bearbeiten</span></h2>
            <form onSubmit={handleEditSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Titel</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all text-2xl font-serif" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.3em] ml-1">Typ der Aktion</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'event', label: 'Standard', icon: Calendar },
                    { id: 'wanderung', label: 'Wanderung', icon: Compass },
                    { id: 'sport', label: 'Sport', icon: Trophy },
                    { id: 'demo', label: 'Demo', icon: Megaphone },
                    { id: 'spontan', label: 'Spontan', icon: Zap }
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({...formData, type: type.id})}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                        formData.type === type.id 
                        ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center h-4 flex items-center">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Datum & Uhrzeit</label>
                  <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all [color-scheme:dark]" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Ort</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Treffpunkt</label>
                <input type="text" value={formData.meeting_point} onChange={e => setFormData({...formData, meeting_point: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Beschreibung</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all min-h-[150px] resize-none" />
              </div>
              <div className="space-y-4 p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Antwortfrist</label>
                <input type="datetime-local" value={formData.response_deadline} onChange={e => setFormData({...formData, response_deadline: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all [color-scheme:dark]" />
                <p className="text-[10px] text-white/20 mt-4 leading-relaxed tracking-wider">Nach Ablauf dieser Frist können Teilnehmer ihren Status im System nicht mehr selbstständig ändern.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-10">
                <button type="button" onClick={() => setShowEditModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-xs uppercase tracking-widest">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-black hover:bg-white/90 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-white/10">Änderungen speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showBulkInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl max-w-md w-full p-8 sm:p-12 max-h-[95vh] flex flex-col relative overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <h2 className="text-4xl font-serif font-bold mb-10 text-white tracking-tighter">Mitglieder <span className="text-white/30">Einladen</span></h2>
            
            <div className="flex justify-between items-center mb-8 px-2">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{selectedPersonIds.length} von {availablePersons.length} gewählt</span>
              <button 
                onClick={() => setSelectedPersonIds(selectedPersonIds.length === availablePersons.length ? [] : availablePersons.map(p => p.id))}
                className="text-[10px] text-white/40 font-black hover:text-white transition-colors uppercase tracking-[0.2em]"
              >
                {selectedPersonIds.length === availablePersons.length ? 'Niemand' : 'Alle'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-white/5 rounded-[2.5rem] divide-y divide-white/5 mb-10 bg-white/[0.02] shadow-inner">
              {availablePersons.map(p => (
                <label key={p.id} className="flex items-center gap-6 p-6 hover:bg-white/[0.05] cursor-pointer transition-all group relative active:bg-white/[0.08]">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedPersonIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPersonIds([...selectedPersonIds, p.id]);
                        else setSelectedPersonIds(selectedPersonIds.filter(id => id !== p.id));
                      }}
                      className="w-7 h-7 rounded-xl border-white/10 bg-black/50 text-white focus:ring-white/10 focus:ring-offset-black transition-all cursor-pointer appearance-none checked:bg-white checked:border-white"
                    />
                    {selectedPersonIds.includes(p.id) && (
                      <div className="absolute pointer-events-none">
                        <CheckCircle className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-2xl text-white group-hover:scale-105 transition-transform origin-left tracking-tight font-bold">{p.name}</span>
                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Mitglied</span>
                  </div>
                </label>
              ))}
              {availablePersons.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-white/10" />
                  </div>
                  <p className="text-white/30 font-serif text-lg">Keine weiteren Personen verfügbar.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setShowBulkInviteModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-xs uppercase tracking-widest active:scale-95">Abbrechen</button>
              <button 
                onClick={handleBulkInvite} 
                disabled={selectedPersonIds.length === 0}
                className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-black hover:bg-white/90 transition-all disabled:opacity-20 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-2xl active:scale-95"
              >
                Einladungen senden
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <TransitPlanner 
        isOpen={showTransit}
        onClose={() => setShowTransit(false)}
        destination={aktion?.location}
        destinationName={aktion?.location}
        eventStartTime={aktion?.date}
      />

      {showChecklistModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl max-w-md w-full p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <h2 className="text-4xl font-serif font-bold mb-10 text-white tracking-tighter">Neuer <span className="text-white/30">Gegenstand</span></h2>
            <form onSubmit={handleSaveChecklistItem} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Was wird gebraucht?</label>
                <input required type="text" placeholder="z.B. Grillkohle" value={checklistFormData.item_name} onChange={e => setChecklistFormData({...checklistFormData, item_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all font-serif text-xl" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Notizen (optional)</label>
                <input type="text" placeholder="z.B. Marke egal" value={checklistFormData.notes} onChange={e => setChecklistFormData({...checklistFormData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setShowChecklistModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-xs uppercase tracking-widest">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-black hover:bg-white/90 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-white/10">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showPollModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl max-w-md w-full p-8 sm:p-12 relative overflow-hidden h-[90vh] flex flex-col"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <h2 className="text-4xl font-serif font-bold mb-10 text-white tracking-tighter shrink-0">Neue <span className="text-white/30">Umfrage</span></h2>
            <form onSubmit={handleCreatePoll} className="space-y-10 flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Frage</label>
                <input required type="text" placeholder="Was wollen wir machen?" value={pollFormData.question} onChange={e => setPollFormData({...pollFormData, question: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all font-serif text-xl" />
              </div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Optionen</label>
                <div className="space-y-3">
                  {pollFormData.options.map((opt, i) => (
                    <input 
                      key={i} 
                      type="text" 
                      placeholder={`Option ${i+1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollFormData.options];
                        newOpts[i] = e.target.value;
                        setPollFormData({...pollFormData, options: newOpts});
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all"
                    />
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={() => setPollFormData({...pollFormData, options: [...pollFormData.options, '']})}
                  className="text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Option hinzufügen
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-10 sticky bottom-0 bg-surface pb-4">
                <button type="button" onClick={() => setShowPollModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-xs uppercase tracking-widest">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-black hover:bg-white/90 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-white/10">Erstellen</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
