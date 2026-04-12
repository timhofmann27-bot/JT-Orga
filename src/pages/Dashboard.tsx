import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Clock, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
  
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Events');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : '/api/admin/events';
    const method = editingEvent ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern');
      }

      toast.success(editingEvent ? 'Event aktualisiert' : 'Event erstellt');
      setShowModal(false);
      setEditingEvent(null);
      setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
      fetchEvents();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/events/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Event gelöscht');
      fetchEvents();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteId(null);
    }
  };

  const openEdit = (e: React.MouseEvent, event: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingEvent(event);
    setFormData({ 
      title: event.title, 
      date: event.date, 
      location: event.location, 
      meeting_point: event.meeting_point || '',
      description: event.description || '', 
      response_deadline: event.response_deadline || '' 
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingEvent(null);
    setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <button
          onClick={openNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Neues Event
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group flex flex-col relative"
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => openEdit(e, event)} className="p-1.5 bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-900 rounded-md">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(event.id); }} className="p-1.5 bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 rounded-md">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-2 pr-16 group-hover:text-gray-600 transition-colors">
              {event.title}
            </h3>
            <div className="space-y-2 text-sm text-gray-500 flex-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {format(parseISO(event.date), 'EEEE, dd.MM.yyyy HH:mm', { locale: de })}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                {event.location}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-900 font-medium">
              <span>Details ansehen</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">Noch keine Events erstellt.</p>
            <button
              onClick={openNew}
              className="text-gray-900 font-medium hover:underline"
            >
              Erstes Event anlegen
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">{editingEvent ? 'Event bearbeiten' : 'Neues Event'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" placeholder="z.B. Wanderung im Taunus" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum & Uhrzeit</label>
                <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treffpunkt (optional)</label>
                <input type="text" value={formData.meeting_point} onChange={e => setFormData({...formData, meeting_point: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" placeholder="z.B. Parkplatz am Zoo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (optional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Antwortfrist (optional)</label>
                <input type="datetime-local" value={formData.response_deadline} onChange={e => setFormData({...formData, response_deadline: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
                <p className="text-xs text-gray-500 mt-1">Nach diesem Datum können Teilnehmer nicht mehr antworten.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-gray-900 text-white rounded-md hover:bg-black font-medium">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Event löschen"
        message="Möchtest du dieses Event wirklich löschen? Alle Einladungen und Antworten werden ebenfalls unwiderruflich gelöscht."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
