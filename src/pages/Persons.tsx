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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.username && m.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-white/40" />
            <span className="micro-label">Personal-Verwaltung</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-display font-medium text-white tracking-tighter leading-none">Netzwerk</h1>
          <p className="text-white/30 font-medium text-xl tracking-tight max-w-xl italic">
            Zentrale Übersicht der Einsatzkräfte und Kontakte.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-none">
            <input 
              type="text" 
              placeholder="Suchen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-white text-sm outline-none focus:border-white/20 transition-all placeholder:text-white/10"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={members.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white/5 border border-white/5 text-white/40 px-8 h-14 rounded-2xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-20 active:scale-95"
          >
            <CalendarPlus className="w-4 h-4 text-white/20" />
            <span>Multi-Invite</span>
          </button>
          <button
            onClick={openNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-4 bg-white text-black px-10 h-14 rounded-2xl hover:bg-white/90 transition-all text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Neu anlegen</span>
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-[80px_2fr_1.5fr_2fr_2fr_120px] gap-4 px-8 py-5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-center">Sign</div>
          <div>Name</div>
          <div>User</div>
          <div>Kontakt</div>
          <div>Notiz</div>
          <div className="text-right pr-4">Aktionen</div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredMembers.map((member, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.01, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              key={member.id} 
              className="group relative"
            >
              <div className="flex flex-col lg:grid lg:grid-cols-[80px_2fr_1.5fr_2fr_2fr_120px] gap-4 px-8 py-4 bg-transparent hover:bg-white/[0.04] transition-all duration-200 items-center">
                {/* Avatar / Sign - Hidden on tiny mobile to save space, or kept small */}
                <div className="hidden lg:flex justify-center">
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-center font-serif text-[11px] font-bold text-white/40 shadow-sm relative overflow-hidden group-hover:text-white group-hover:border-white/20 transition-all">
                    <span className="relative z-10">{member.name.charAt(0).toUpperCase()}</span>
                  </div>
                </div>

                {/* Name & Identity */}
                <div className="flex flex-col min-w-0 w-full lg:w-auto">
                  <div className="flex items-center justify-between lg:justify-start gap-4">
                    <span className="font-serif text-lg font-bold text-white transition-colors tracking-tight truncate">
                      {member.name}
                    </span>
                    {/* Actions on mobile (right side of name) */}
                    <div className="lg:hidden flex items-center gap-1">
                      <button 
                        onClick={() => openEdit(member)}
                        className="w-8 h-8 flex items-center justify-center text-white/20 active:text-white transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(member.id)}
                        className="w-8 h-8 flex items-center justify-center text-white/20 active:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-[9px] font-black text-white/20 uppercase tracking-widest flex flex-wrap items-center gap-2">
                    <span className="text-white/40">@{member.username || 'user'}</span>
                    {(member.email || member.notes) && <span className="w-1 h-1 rounded-full bg-white/10" />}
                    <span className="truncate">{member.email || (member.notes && `"${member.notes}"`)}</span>
                  </div>
                </div>

                {/* Username */}
                <div className="hidden lg:block min-w-0">
                  <span className="text-xs font-mono text-white/30 group-hover:text-white/60 transition-colors truncate block">
                    {member.username ? `@${member.username}` : '—'}
                  </span>
                </div>

                {/* Email */}
                <div className="hidden lg:block min-w-0">
                  {member.email ? (
                    <div className="flex items-center gap-2 text-xs text-white/40 font-medium truncate">
                      <div className="w-1 h-1 rounded-full bg-blue-500/30" />
                      {member.email}
                    </div>
                  ) : (
                    <span className="text-white/5 text-[9px] font-black uppercase tracking-widest">—</span>
                  )}
                </div>

                {/* Note */}
                <div className="hidden lg:block min-w-0">
                  {member.notes ? (
                    <span className="text-xs text-white/20 italic truncate block max-w-full" title={member.notes}>
                      "{member.notes}"
                    </span>
                  ) : (
                    <span className="text-white/5 text-[9px] font-black uppercase tracking-widest">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEdit(member)}
                    className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setDeleteId(member.id)}
                    className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
                    title="Löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
          {filteredMembers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-32 px-10 text-center"
            >
              <div className="w-24 h-24 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-2xl">
                <Users className="w-10 h-10 text-white/10" />
              </div>
              <p className="text-white/20 font-serif text-2xl tracking-tight">
                {searchTerm ? 'Keine Treffer für deine Suche.' : 'Noch keine Mitglieder angelegt.'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Suche zurücksetzen
                </button>
              )}
            </motion.div>
          )}
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 sm:p-6 z-50 backdrop-blur-2xl">
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
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 sm:p-6 z-50 backdrop-blur-2xl">
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
