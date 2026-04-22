import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Edit2, Sun, Cloud, CloudRain, Zap, Compass, Trophy, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import EventHeader, { EventOverview } from '../components/event-details/EventHeader';
import EventStats from '../components/event-details/EventStats';
import EventParticipants from '../components/event-details/EventParticipants';
import EventPlanning from '../components/event-details/EventPlanning';
import EventModals from '../components/event-details/EventModals';
import { fetchWeather, getWeatherLabel, WeatherData } from '../lib/weather';

export default function EventDetails() {
  const { id } = useParams();
  if (!id) return <div className="p-8 text-center">Event nicht gefunden</div>;
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'planning'>('overview');
  const [aktion, setAktion] = useState<any>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
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

  useEffect(() => {
    if (aktion?.location) {
      loadWeather(aktion.location, aktion.date);
    }
  }, [aktion?.location, aktion?.date]);

  const loadWeather = async (location: string, dateStr: string) => {
    setWeatherLoading(true);
    try {
      const weatherData = await fetchWeather(location, dateStr);
      setWeather(weatherData);
    } catch (e) {
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherInfo = (code: number) => {
    const label = getWeatherLabel(code);
    if (label === 'Klarer Himmel') return { label, icon: Sun, color: 'text-amber-400' };
    if (label === 'Leicht bewölkt') return { label, icon: Cloud, color: 'text-blue-300' };
    if (label === 'Nebel') return { label, icon: Cloud, color: 'text-gray-400' };
    if (label === 'Regen') return { label, icon: CloudRain, color: 'text-blue-400' };
    if (label === 'Schnee') return { label, icon: Cloud, color: 'text-white' };
    if (label === 'Gewitter') return { label, icon: Zap, color: 'text-amber-500' };
    return { label, icon: Cloud, color: 'text-white/40' };
  };

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

      <EventHeader 
        aktion={aktion} 
        onEdit={openEdit} 
        onTransit={() => setShowTransit(true)}
        getEventIcon={getEventIcon}
        getEventLabel={getEventLabel}
      />

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
          >
            <EventOverview 
              aktion={aktion} 
              weather={weather} 
              weatherLoading={weatherLoading} 
              getWeatherInfo={getWeatherInfo} 
            />
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
            <EventStats stats={stats} />
            <EventParticipants 
              invites={invites}
              filter={filter}
              setFilter={setFilter}
              filteredInvitees={filteredInvitees}
              handleUpdateStatus={handleUpdateStatus}
              copyLink={copyLink}
              handleResendInvite={handleResendInvite}
              setDeleteInviteeId={setDeleteInviteeId}
              setShowBulkInviteModal={setShowBulkInviteModal}
              aktion={aktion}
            />
          </motion.div>
        )}

        {activeTab === 'planning' && (
          <motion.div 
            key="planning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <EventPlanning 
              invitationSteps={invitationSteps}
              setEditingStep={setEditingStep}
              setStepFormData={setStepFormData}
              setShowStepModal={setShowStepModal}
              handleTriggerStep={handleTriggerStep}
              handleDeleteStep={handleDeleteStep}
              checklist={checklist}
              setChecklistFormData={setChecklistFormData}
              setShowChecklistModal={setShowChecklistModal}
              handleDeleteChecklistItem={handleDeleteChecklistItem}
              polls={polls}
              setPollFormData={setPollFormData}
              setShowPollModal={setShowPollModal}
              handleDeletePoll={handleDeletePoll}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handlePostMessage={handlePostMessage}
              handleDeleteMessage={handleDeleteMessage}
              aktion={aktion}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <EventModals 
        id={id}
        deleteInviteeId={deleteInviteeId}
        setDeleteInviteeId={setDeleteInviteeId}
        handleDeleteInvitee={handleDeleteInvitee}
        showStepModal={showStepModal}
        setShowStepModal={setShowStepModal}
        editingStep={editingStep}
        stepFormData={stepFormData}
        setStepFormData={setStepFormData}
        handleSaveStep={handleSaveStep}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        formData={formData}
        setFormData={setFormData}
        handleEditSubmit={handleEditSubmit}
        showBulkInviteModal={showBulkInviteModal}
        setShowBulkInviteModal={setShowBulkInviteModal}
        selectedPersonIds={selectedPersonIds}
        setSelectedPersonIds={setSelectedPersonIds}
        availablePersons={availablePersons}
        handleBulkInvite={handleBulkInvite}
        showChecklistModal={showChecklistModal}
        setShowChecklistModal={setShowChecklistModal}
        checklistFormData={checklistFormData}
        setChecklistFormData={setChecklistFormData}
        handleSaveChecklistItem={handleSaveChecklistItem}
        showPollModal={showPollModal}
        setShowPollModal={setShowPollModal}
        pollFormData={pollFormData}
        setPollFormData={setPollFormData}
        handleCreatePoll={handleCreatePoll}
        showTransit={showTransit}
        setShowTransit={setShowTransit}
        aktion={aktion}
      />
    </div>
  );
}
