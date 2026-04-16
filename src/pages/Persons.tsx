import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, CalendarPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import ConfirmModal from '../components/ConfirmModal';

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [aktionen, setAktionen] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedAktionId, setSelectedAktionId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', username: '', email: '', notes: '' });
  
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchAktionen();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/persons');
      if (res.ok) setMembers(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Mitglieder');
    }
  };

  const fetchAktionen = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) setAktionen(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Aktionen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingMember ? `/api/admin/persons/${editingMember.id}` : '/api/admin/persons';
    const method = editingMember ? 'PUT' : 'POST';

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

      toast.success(editingMember ? 'Mitglied aktualisiert' : 'Mitglied angelegt');
      setShowModal(false);
      setEditingMember(null);
      setFormData({ name: '', username: '', email: '', notes: '' });
      fetchMembers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/persons/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Person gelöscht');
      fetchMembers();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAktionId) return toast.error('Bitte wähle eine Aktion aus');
    
    setIsInviting(true);
    try {
      const memberIds = members.map(m => m.id);
      const res = await fetch(`/api/admin/events/${selectedAktionId}/invites/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_ids: memberIds })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Einladen');
      }

      const data = await res.json();
      toast.success(`${data.count} Mitglieder erfolgreich eingeladen!`);
      setShowBulkModal(false);
      setSelectedAktionId('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const openEdit = (member: any) => {
    setEditingMember(member);
    setFormData({ 
      name: member.name, 
      username: member.username || '', 
      email: member.email || '', 
      notes: member.notes || '' 
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingMember(null);
    setFormData({ name: '', username: '', email: '', notes: '' });
    setShowModal(true);
  };

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white tracking-tight mb-3">Mitglieder</h1>
          <p className="text-white/40 font-medium text-lg">Verwalte dein Netzwerk und lade Personen ein.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={members.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white/80 px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold disabled:opacity-20"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Alle einladen</span>
          </button>
          <button
            onClick={openNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-black px-10 py-4 rounded-2xl hover:bg-white/90 transition-all text-sm font-bold shadow-2xl shadow-white/5"
          >
            <Plus className="w-4 h-4" />
            <span>Mitglied anlegen</span>
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {members.map((member, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={member.id} 
              className="p-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.03] gap-6 transition-colors group"
            >
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-center font-serif text-2xl font-bold text-white/40 shadow-2xl">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-serif text-2xl text-white group-hover:text-white transition-colors">{member.name}</div>
                  {member.notes && <div className="text-sm text-white/20 mt-2 font-medium">{member.notes}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEdit(member)}
                  className="p-4 text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setDeleteId(member.id)}
                  className="p-4 text-white/20 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all"
                  title="Löschen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
          {members.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="p-32 text-center relative overflow-hidden"
            >
              <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-2xl">
                <Users className="w-12 h-12 text-white/10" />
              </div>
              <p className="text-white/20 font-serif text-2xl">Noch keine Mitglieder angelegt.</p>
            </motion.div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative overflow-hidden"
          >
            <h2 className="text-3xl font-serif font-bold mb-10 text-white tracking-tight">{editingMember ? 'Mitglied bearbeiten' : 'Neues Mitglied'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Anzeigename</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all text-xl font-serif" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Benutzername</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">E-Mail</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Notizen</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                  rows={3}
                ></textarea>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Abbrechen</button>
                <button type="submit" className="flex-1 px-8 py-5 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative overflow-hidden"
          >
            <h2 className="text-3xl font-serif font-bold mb-6 flex items-center gap-4 text-white tracking-tight">
              Alle einladen
            </h2>
            <p className="text-sm text-white/30 mb-10 font-medium leading-relaxed">
              Wähle ein Aktion aus, um alle {members.length} Mitglieder dazu einzuladen. Bereits eingeladene Personen werden übersprungen.
            </p>
            <form onSubmit={handleBulkInvite} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Aktion auswählen</label>
                <select 
                  required 
                  value={selectedAktionId} 
                  onChange={e => setSelectedAktionId(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer text-lg font-serif" 
                >
                  <option value="" className="bg-black">Bitte wählen...</option>
                  {aktionen.map(aktion => (
                    <option key={aktion.id} value={aktion.id} className="bg-black">{aktion.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 px-8 py-5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Abbrechen</button>
                <button type="submit" disabled={isInviting || !selectedAktionId} className="flex-1 px-8 py-5 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all disabled:opacity-20 flex items-center justify-center gap-3">
                  {isInviting ? 'Lädt...' : 'Einladen'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Mitglied löschen"
        message="Möchtest du dieses Mitglied wirklich löschen? Alle Einladungen dieses Mitglieds werden ebenfalls unwiderruflich gelöscht."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
