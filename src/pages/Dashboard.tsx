import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Clock, ChevronRight, Edit2, Trash2, Settings, Users, CheckCircle2, Calendar, Archive, Hourglass, UserPlus, Compass, Trophy, Megaphone, Zap } from 'lucide-react';
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
  const [formData, setFormData] = useState({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '', type: 'event' });
  
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
      setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '', type: 'event' });
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
      response_deadline: aktion.response_deadline || '',
      type: aktion.type || 'event'
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingAktion(null);
    setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '', type: 'event' });
    setShowModal(true);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'wanderung': return <Compass className="w-4 h-4" />;
      case 'sport': return <Trophy className="w-4 h-4" />;
      case 'demo': return <Megaphone className="w-4 h-4" />;
      case 'spontan': return <Zap className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
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

  const now = new Date();
  const activeAktionen = aktionen.filter(e => !e.is_archived);
  const archivedAktionen = aktionen.filter(e => e.is_archived);
  const upcomingAktionen = activeAktionen.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastAktionen = activeAktionen.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderAktionCard = (aktion: any, index: number) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      key={aktion.id}
    >
      <Link
        to={`/events/${aktion.id}`}
        className="block bg-surface-muted rounded-[2.5rem] border border-white/5 p-6 sm:p-8 hover:bg-surface-elevated hover:border-white/10 transition-all duration-300 group relative overflow-hidden h-full active:scale-[0.98]"
      >
        <div className="flex flex-col gap-6 h-full">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/5 p-1.5 rounded-lg text-white/40">
                  {getEventIcon(aktion.type)}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{getEventLabel(aktion.type)}</span>
              </div>
              <h3 className="font-display text-2xl text-white group-hover:text-white transition-colors leading-tight">
                {aktion?.title}
              </h3>
              <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{aktion?.date ? format(parseISO(aktion.date), 'EEEE, dd. MMM', { locale: de }) : '-'}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={(e) => handleArchive(e, aktion.id, !!aktion.is_archived)} className={`w-9 h-9 flex items-center justify-center bg-white/5 border border-white/5 ${aktion.is_archived ? 'text-blue-400' : 'text-white/40'} hover:text-blue-400 rounded-full transition-all active:scale-90`}>
                <Archive className="w-4 h-4" />
              </button>
              <button onClick={(e) => openEdit(e, aktion)} className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/5 text-white/40 hover:text-white rounded-full transition-all active:scale-90">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(aktion.id); }} className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/5 text-white/40 hover:text-red-400 rounded-full transition-all active:scale-90">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 text-sm text-white/40">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white/20" />
              </div>
              <span className="font-medium truncate">{aktion?.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-white/20" />
              </div>
              <div className="font-medium text-white/80">
                {aktion?.yes_count || 0} <span className="text-white/20 font-normal">Zusagen von</span> {aktion?.total_invites || 0}
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-white/5 flex items-center justify-between">
            <div className="px-4 py-2 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:bg-white/10 group-hover:text-white transition-all">
              Details ansehen
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white text-black transition-all transform group-hover:translate-x-1">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-12 mb-24 px-2 lg:px-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            <span className="micro-label">Systemkonsole</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-display font-medium text-white tracking-tighter leading-[0.8] animate-fade-in-up">
            Aktionen <span className="text-white/20 italic font-serif">Zentrale</span>
          </h2>
          <p className="text-white/30 font-medium text-xl max-w-lg leading-relaxed">
            Zentrales Management für Einsatzbereitschaft, <br />Mitglieder & operative Ereignisse.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowSettings(true)}
            className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/5 text-white/50 rounded-2xl hover:bg-white/10 transition-all hover:text-white active:scale-90"
            title="Einstellungen"
          >
            <Settings className="w-6 h-6" />
          </button>
          <button
            onClick={openNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-4 bg-white text-black px-12 h-16 rounded-[2rem] hover:bg-white/90 transition-all text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-white/10 active:scale-[0.95]"
          >
            <Plus className="w-4 h-4" />
            <span>Neu erstellen</span>
          </button>
        </div>
      </div>

      {stats?.pending_requests > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <Link 
            to="/registration-requests"
            className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.05] transition-all group overflow-hidden relative shadow-2xl active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10 blur-2xl" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-white/20 animate-pulse">
                <UserPlus className="w-7 h-7 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-1">Registrierungsanfragen</h3>
                <p className="text-sm text-white/40 font-medium tracking-tight">Es warten {stats.pending_requests} Person(en) auf Freischaltung.</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform bg-white/5 group-hover:bg-white group-hover:text-black">
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
        </motion.div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          {[
            { label: 'Gesamt Aktionen', value: stats.events, icon: Calendar },
            { label: 'Aktive Personen', value: stats.persons, icon: Users },
            { label: 'Versendete Einladungen', value: stats.invites, icon: CheckCircle2 },
            { label: 'Archivierte Daten', value: stats.archived_events, sub: `${stats.archived_pct.toFixed(0)}%`, icon: Archive },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="premium-card p-10 rounded-[3rem] shadow-none group cursor-default"
            >
              <div className="flex flex-col gap-10">
                <div className="flex justify-between items-center">
                  <div className="micro-label opacity-40">{stat.label}</div>
                  <stat.icon className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
                </div>
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl sm:text-7xl font-serif font-black text-white tracking-tighter leading-none">{stat.value}</div>
                  {stat.sub && (
                    <div className="text-[9px] font-black text-white/30 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      {stat.sub}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-32">
        {upcomingAktionen.length > 0 && (
          <section>
            <div className="flex items-center gap-6 mb-12 px-2 lg:px-0">
              <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-4 shrink-0">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse" />
                Anstehend
              </h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAktionen.map((e, i) => renderAktionCard(e, i))}
            </div>
          </section>
        )}

        {pastAktionen.length > 0 && (
          <section className="opacity-60 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-6 mb-12 px-2 lg:px-0">
              <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-4 shrink-0">
                Vergangen
              </h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastAktionen.map((e, i) => renderAktionCard(e, i))}
            </div>
          </section>
        )}

        {archivedAktionen.length > 0 && (
          <section className="opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-6 mb-12 px-2 lg:px-0">
              <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-4 shrink-0">
                Archiviert
              </h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {archivedAktionen.map((e, i) => renderAktionCard(e, i))}
            </div>
          </section>
        )}
      </div>

      {aktionen.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-32 px-10 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5 backdrop-blur-3xl relative overflow-hidden"
        >
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/5">
            <Calendar className="w-10 h-10 text-white/10" />
          </div>
          <p className="text-white/30 mb-10 text-xl font-serif">Noch keine Aktionen vorhanden.</p>
          <button
            onClick={openNew}
            className="bg-white text-black px-10 h-14 rounded-2xl font-bold hover:bg-white/90 transition-all shadow-2xl shadow-white/5 active:scale-[0.95]"
          >
            Erste Aktion erstellen
          </button>
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 sm:p-6 z-[100] backdrop-blur-3xl">
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl max-w-2xl w-full p-8 sm:p-14 h-[95vh] sm:h-auto overflow-y-auto relative"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white tracking-tighter shrink-0">{editingAktion ? 'Aktion' : 'Neue'} <span className="text-white/30">Bearbeiten</span></h2>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90">
                <Trash2 className="w-5 h-5 opacity-0 pointer-events-none" /> {/* Hidden spacing or close icon */}
                <div className="text-xl font-light">×</div>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.3em] ml-1">Event Bezeichnung</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all text-2xl font-serif placeholder:text-white/5" placeholder="Name der Aktion..." />
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
                  <label className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.3em] ml-1">Datum & Zeit</label>
                  <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all [color-scheme:dark]" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.3em] ml-1">Standort</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all" placeholder="Ort eingeben..." />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.3em] ml-1">Konkreter Treffpunkt</label>
                <input type="text" value={formData.meeting_point} onChange={e => setFormData({...formData, meeting_point: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all" placeholder="Optional: Genauer Treffpunkt..." />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.3em] ml-1">Zusätzliche Infos</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all min-h-[150px] resize-none" placeholder="Details zur Aktion..."></textarea>
              </div>

              <div className="space-y-4 p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-[0.3em] ml-1">Rückmeldefrist</label>
                <input type="datetime-local" value={formData.response_deadline} onChange={e => setFormData({...formData, response_deadline: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all [color-scheme:dark]" />
                <p className="text-[10px] text-white/20 mt-4 leading-relaxed tracking-wider">Nach Ablauf dieser Frist können Teilnehmer ihren Status im System nicht mehr selbstständig ändern.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 py-10">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-sm uppercase tracking-widest active:scale-95">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all text-sm uppercase tracking-widest shadow-2xl shadow-white/10 active:scale-95">Änderungen speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Aktion unwiderruflich löschen?"
        message="Bist du sicher? Alle damit verbundenen Daten, Einladungen und Statistiken gehen verloren."
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
