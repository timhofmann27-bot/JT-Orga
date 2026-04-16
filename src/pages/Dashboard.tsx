import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Clock, ChevronRight, Edit2, Trash2, Settings, Users, CheckCircle2, Calendar, Archive, Hourglass } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO, formatDistanceToNow, isFuture } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import SettingsModal from '../components/SettingsModal';

export default function Dashboard() {
  const [aktionen, setAktionen] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingAktion, setEditingAktion] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
  
  const [stats, setStats] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchAktionen();
    fetchStats();
  }, []);

  const fetchAktionen = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) setAktionen(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Aktionen');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Statistik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingAktion ? `/api/admin/events/${editingAktion.id}` : '/api/admin/events';
    const method = editingAktion ? 'PUT' : 'POST';

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

      toast.success(editingAktion ? 'Aktion aktualisiert' : 'Aktion erstellt');
      setShowModal(false);
      setEditingAktion(null);
      setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
      fetchAktionen();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/events/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Aktion gelöscht');
      fetchAktionen();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: number, is_archived: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/events/${id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: !is_archived })
      });
      if (!res.ok) throw new Error('Fehler beim Archivieren');
      toast.success(is_archived ? 'Aktion wiederhergestellt' : 'Aktion archiviert');
      fetchAktionen();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (e: React.MouseEvent, aktion: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAktion(aktion);
    setFormData({ 
      title: aktion.title, 
      date: aktion.date, 
      location: aktion.location, 
      meeting_point: aktion.meeting_point || '',
      description: aktion.description || '', 
      response_deadline: aktion.response_deadline || '' 
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingAktion(null);
    setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
    setShowModal(true);
  };

  const now = new Date();
  const activeAktionen = aktionen.filter(e => !e.is_archived);
  const archivedAktionen = aktionen.filter(e => e.is_archived);
  const upcomingAktionen = activeAktionen.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastAktionen = activeAktionen.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderAktionCard = (aktion: any, index: number) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      key={aktion.id}
    >
      <Link
        to={`/events/${aktion.id}`}
        className="bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/5 p-8 hover:bg-white/[0.05] hover:border-white/10 transition-all group flex flex-col relative overflow-hidden h-full"
      >
        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
          <button onClick={(e) => handleArchive(e, aktion.id, !!aktion.is_archived)} className={`p-2.5 bg-black/80 backdrop-blur-md border border-white/10 ${aktion.is_archived ? 'text-blue-400' : 'text-white/60'} hover:text-blue-400 rounded-full transition-colors`}>
            <Archive className="w-4 h-4" />
          </button>
          <button onClick={(e) => openEdit(e, aktion)} className="p-2.5 bg-black/80 backdrop-blur-md border border-white/10 text-white/60 hover:text-white rounded-full transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(aktion.id); }} className="p-2.5 bg-black/80 backdrop-blur-md border border-white/10 text-white/60 hover:text-red-400 rounded-full transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <h3 className="font-serif text-2xl text-white mb-4 pr-20 group-hover:text-white/90 transition-colors leading-tight">
          {aktion?.title}
        </h3>
        <div className="space-y-4 text-sm text-white/40 flex-1">
          <div className="flex items-center gap-4">
            <Clock className="w-4 h-4 text-white/20" />
            <span className="font-medium tracking-wide">{aktion?.date ? format(parseISO(aktion.date), 'EEEE, dd.MM.yyyy HH:mm', { locale: de }) : '-'}</span>
          </div>
          <div className="flex items-center gap-4">
            <MapPin className="w-4 h-4 text-white/20" />
            <span className="font-medium tracking-wide">{aktion?.location}</span>
          </div>
          {aktion?.response_deadline && (
            <div className="flex items-center gap-4">
              <Hourglass className="w-4 h-4 text-white/20" />
              <span className="font-medium tracking-wide">
                {aktion.response_deadline && isFuture(parseISO(aktion.response_deadline)) 
                  ? `Frist: ${formatDistanceToNow(parseISO(aktion.response_deadline), { addSuffix: true, locale: de })}`
                  : aktion.response_deadline ? 'Frist abgelaufen' : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 pt-6 mt-6 border-t border-white/5">
            <Users className="w-4 h-4 text-white/20" />
            <span className="text-white/80 font-medium tracking-wide">
              {aktion?.yes_count || 0} Zusagen <span className="text-white/20 font-normal ml-1">/ {aktion?.total_invites || 0}</span>
            </span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
          <span>Details ansehen</span>
          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white tracking-tight mb-3">Aktionen</h1>
          <p className="text-white/40 font-medium text-lg">Verwalte deine Veranstaltungen und Teilnehmer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowSettings(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white/80 px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold"
          >
            <Settings className="w-4 h-4" />
            <span>Einstellungen</span>
          </button>
          <button
            onClick={openNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-black px-10 py-4 rounded-2xl hover:bg-white/90 transition-all text-sm font-bold shadow-2xl shadow-white/5"
          >
            <Plus className="w-4 h-4" />
            <span>Neue Aktion</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            { label: 'Aktionen', value: stats.events },
            { label: 'Archiviert', value: stats.archived_events, sub: `${stats.archived_pct.toFixed(1)}%` },
            { label: 'Personen', value: stats.persons },
            { label: 'Einladungen', value: stats.invites },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl"
            >
              <div className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold mb-6">{stat.label}</div>
              <div className="flex items-baseline gap-3">
                <div className="text-5xl font-serif font-bold text-white">{stat.value}</div>
                {stat.sub && <div className="text-xs font-bold text-white/20">{stat.sub}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {upcomingAktionen.length > 0 && (
        <section className="mb-24">
          <div className="flex items-center gap-6 mb-12">
            <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-4 shrink-0">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              Anstehend
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {upcomingAktionen.map((e, i) => renderAktionCard(e, i))}
          </div>
        </section>
      )}

      {pastAktionen.length > 0 && (
        <section className="mb-24 opacity-40 hover:opacity-100 transition-opacity duration-700">
          <div className="flex items-center gap-6 mb-12">
            <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-4 shrink-0">
              Vergangen
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pastAktionen.map((e, i) => renderAktionCard(e, i))}
          </div>
        </section>
      )}

      {archivedAktionen.length > 0 && (
        <section className="opacity-20 hover:opacity-100 transition-opacity duration-700">
          <div className="flex items-center gap-6 mb-12">
            <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-4 shrink-0">
              Archiviert
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {archivedAktionen.map((e, i) => renderAktionCard(e, i))}
          </div>
        </section>
      )}

      {aktionen.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="col-span-full text-center py-32 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-2xl"
          >
            <Calendar className="w-12 h-12 text-white/20" />
          </motion.div>
          <p className="text-white/40 mb-10 text-xl font-serif">Noch keine Aktionen erstellt.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openNew}
            className="text-white font-bold hover:text-white/80 transition-colors inline-flex items-center gap-3 text-sm uppercase tracking-widest"
          >
            Erste Aktion anlegen <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl max-w-xl w-full p-12 max-h-[90vh] overflow-y-auto relative overflow-hidden"
          >
            <h2 className="text-4xl font-serif font-bold mb-10 text-white tracking-tight">{editingAktion ? 'Aktion bearbeiten' : 'Neue Aktion'}</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Titel</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all text-xl font-serif" placeholder="z.B. Wanderung im Taunus" />
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
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Treffpunkt (optional)</label>
                <input type="text" value={formData.meeting_point} onChange={e => setFormData({...formData, meeting_point: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" placeholder="z.B. Parkplatz am Zoo" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Beschreibung (optional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" rows={4}></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Antwortfrist (optional)</label>
                <input type="datetime-local" value={formData.response_deadline} onChange={e => setFormData({...formData, response_deadline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all [color-scheme:dark]" />
                <p className="text-[10px] text-white/20 mt-3 font-medium ml-1">Nach diesem Datum können Teilnehmer nicht mehr antworten.</p>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Abbrechen</button>
                <button type="submit" className="flex-1 px-8 py-5 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Aktion löschen"
        message="Möchtest du diese Aktion wirklich löschen? Alle Einladungen und Antworten werden ebenfalls unwiderruflich gelöscht."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}
