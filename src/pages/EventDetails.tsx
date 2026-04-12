import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, HelpCircle, Clock, Copy, Trash2, Plus, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [deleteInviteeId, setDeleteInviteeId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvent();
    fetchInvites();
    fetchPersons();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (res.ok) setEvent(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden des Events');
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

  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;
    
    try {
      const res = await fetch(`/api/admin/events/${id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: Number(selectedPersonId) })
      });
      
      if (res.ok) {
        setSelectedPersonId('');
        toast.success('Person eingeladen');
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

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link kopiert!');
  };

  if (!event) return <div className="p-8 text-center">Lade...</div>;

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
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Übersicht
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <div className="text-gray-500 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {format(parseISO(event.date), 'EEEE, dd.MM.yyyy HH:mm', { locale: de })}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>
              {event.meeting_point && (
                <span className="flex items-center gap-1.5 text-gray-900 font-medium">
                  <span className="text-gray-400 font-normal">Treffpunkt:</span> {event.meeting_point}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">Eingeladen</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.yes}</div>
          <div className="text-xs text-gray-900 uppercase tracking-wider font-medium mt-1 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3"/> Zugesagt</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-700">{stats.no}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wider font-medium mt-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3"/> Abgesagt</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.maybe}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1 flex items-center justify-center gap-1"><HelpCircle className="w-3 h-3"/> Vielleicht</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-dashed border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-400">{stats.pending}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Ausstehend</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-900" />
            Einladungen
          </h2>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm p-2 bg-white w-full sm:w-auto"
            >
              <option value="all">Alle anzeigen</option>
              <option value="yes">Nur Zusagen</option>
              <option value="no">Nur Absagen</option>
              <option value="maybe">Nur Vielleicht</option>
              <option value="pending">Nur Ausstehend</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleAddInvitee} className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedPersonId}
              onChange={e => setSelectedPersonId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-3 sm:p-2 text-sm bg-white"
            >
              <option value="">Person auswählen...</option>
              {availablePersons.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button 
              type="submit" 
              disabled={!selectedPersonId}
              className="w-full sm:w-auto bg-gray-900 text-white px-4 py-3 sm:py-2 rounded-md text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Einladen
            </button>
          </form>
          {availablePersons.length === 0 && persons.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">Alle Personen aus dem Adressbuch sind bereits eingeladen.</p>
          )}
          {persons.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Noch keine Personen angelegt. <Link to="/persons" className="text-gray-900 hover:underline">Jetzt Personen anlegen</Link>.
            </p>
          )}
        </div>

        {/* Mobile Cards / Desktop Table */}
        <div className="divide-y divide-gray-100">
          {filteredInvitees.map((invitee: any) => (
            <div key={invitee.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                  {invitee.name_snapshot || invitee.current_name}
                  {invitee.status === 'yes' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-900 text-white">Zusage</span>}
                  {invitee.status === 'no' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">Absage</span>}
                  {invitee.status === 'maybe' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">Vielleicht</span>}
                  {invitee.status === 'pending' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-200 text-gray-500">Ausstehend</span>}
                </div>
                {invitee.comment && <div className="text-sm text-gray-500 mt-1 break-words">"{invitee.comment}"</div>}
                {invitee.guests_count > 0 && <div className="text-sm text-gray-600 mt-1">+ {invitee.guests_count} Begleitperson(en)</div>}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button 
                  onClick={() => copyLink(invitee.token)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                  title="Einladungslink kopieren"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Link</span>
                </button>
                <button 
                  onClick={() => setDeleteInviteeId(invitee.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Einladung löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredInvitees.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              Keine Einladungen gefunden.
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteInviteeId !== null}
        title="Einladung löschen"
        message="Möchtest du diese Einladung wirklich löschen? Der Link wird ungültig und die Antwort der Person geht verloren."
        onConfirm={handleDeleteInvitee}
        onCancel={() => setDeleteInviteeId(null)}
      />
    </div>
  );
}
