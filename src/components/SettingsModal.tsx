import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          if (data.username) setUsername(data.username);
        })
        .catch(() => toast.error('Fehler beim Laden der Einstellungen'));
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword && !currentPassword) {
      toast.error('Bitte gib dein aktuelles Passwort ein, um ein neues zu setzen');
      return;
    }

    if (currentPassword && !newPassword) {
      toast.error('Bitte gib ein neues Passwort ein');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      toast.error('Das neue Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern');
      }

      toast.success('Einstellungen erfolgreich gespeichert');
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative overflow-y-auto max-h-[90vh] overflow-hidden"
      >
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-6 mb-10 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <Settings className="w-7 h-7 text-white/40" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Einstellungen</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Benutzername</label>
            <input 
              required 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" 
            />
          </div>

          <div className="pt-8 border-t border-white/5">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-6">Passwort ändern</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Aktuelles Passwort</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pr-14 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" 
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                    {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Neues Passwort</label>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pr-14 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" 
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Bestätigen</label>
                <div className="relative">
                  <input 
                    type={showConfirm ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pr-14 text-white focus:ring-2 focus:ring-white/10 outline-none transition-all" 
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 px-6 py-4 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all disabled:opacity-20"
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-6 py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all disabled:opacity-20 flex items-center justify-center"
            >
              {loading ? '...' : 'Speichern'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
