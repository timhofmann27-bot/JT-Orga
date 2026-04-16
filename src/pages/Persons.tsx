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
    <div className="pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 mb-16">
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-6xl font-serif font-bold text-white tracking-tighter leading-none">Netzwerk</h1>
          <p className="text-white/30 font-medium text-lg tracking-tight">Verwalte deine Mitglieder und Kontakte.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={members.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-surface-muted border border-white/5 text-white/60 px-8 py-5 rounded-[2rem] hover:bg-surface-elevated hover:text-white transition-all text-xs font-black uppercase tracking-widest disabled:opacity-20 active:scale-95 shadow-xl"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Multi-Invite</span>
          </button>
          <button
            onClick={openNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-[2rem] hover:bg-white/90 transition-all text-xs font-black uppercase tracking-widest shadow-2xl shadow-white/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Neues Mitglied</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-muted rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5 px-2">
          {members.map((member, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              key={member.id} 
              className="p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.03] gap-8 transition-all duration-500 group relative rounded-[2rem] mx-2 my-1"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-[1.8rem] bg-surface-elevated border border-white/10 flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold text-white shadow-2xl group-hover:scale-105 transition-transform duration-700 relative overflow-hidden">
                  <div className="relative z-10">{member.name.charAt(0).toUpperCase()}</div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                </div>
                <div className="space-y-3">
                  <div className="font-serif text-3xl sm:text-4xl text-white tracking-tighter font-bold">{member.name}</div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    {member.email && (
                      <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border border-white/5">
                        {member.email}
                      </div>
                    )}
                    {member.notes && (
                      <div className="text-xs font-medium text-white/10 italic tracking-tight">"{member.notes}"</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => openEdit(member)}
                  className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setDeleteId(member.id)}
                  className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
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
              className="py-32 px-10 text-center"
            >
              <div className="w-24 h-24 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-2xl">
                <Users className="w-10 h-10 text-white/10" />
              </div>
              <p className="text-white/20 font-serif text-2xl tracking-tight">Noch keine Mitglieder angelegt.</p>
            </motion.div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl max-w-md w-full p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <h2 className="text-4xl font-serif font-bold mb-12 text-white tracking-tighter shrink-0">{editingMember ? 'Mitglied' : 'Neues'} <span className="text-white/30">Hinzufügen</span></h2>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Anzeigename</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all text-2xl font-serif" 
                  placeholder="Vorname Nachname..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Username</label>
                  <input 
                    type="text" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                    placeholder="@name"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">E-Mail</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                    placeholder="mail@..."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Interne Notizen</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all min-h-[120px] resize-none" 
                  placeholder="Optional..."
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-xs uppercase tracking-widest active:scale-95">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-black hover:bg-white/90 transition-all text-xs uppercase tracking-widest shadow-2xl active:scale-95">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl max-w-md w-full p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            <h2 className="text-4xl font-serif font-bold mb-6 text-white tracking-tighter">Alle <span className="text-white/30">Einladen</span></h2>
            <p className="text-white/30 mb-12 font-medium tracking-tight">
              Wähle ein Aktion aus, um alle <span className="text-white font-bold">{members.length} Mitglieder</span> dazu einzuladen.
            </p>
            <form onSubmit={handleBulkInvite} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Aktion auswählen</label>
                <select 
                  required 
                  value={selectedAktionId} 
                  onChange={e => setSelectedAktionId(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer text-xl font-serif" 
                >
                  <option value="" className="bg-black text-white/20">Bitte wählen...</option>
                  {aktionen.map(aktion => (
                    <option key={aktion.id} value={aktion.id} className="bg-black">{aktion.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setShowBulkModal(false)} className="w-full sm:flex-1 h-16 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-xs uppercase tracking-widest active:scale-95">Abbrechen</button>
                <button type="submit" disabled={isInviting || !selectedAktionId} className="w-full sm:flex-1 h-16 bg-white text-black rounded-2xl font-black hover:bg-white/90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95">
                  {isInviting ? 'Wird verarbeitet...' : 'Senden'}
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
