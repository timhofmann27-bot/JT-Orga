import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsMenuProps {
  apiPrefix: string;
}

export default function NotificationsMenu({ apiPrefix }: NotificationsMenuProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${apiPrefix}/notifications`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setNotifications(await res.json());
        }
      }
    } catch (e: any) {
      if (e.name !== 'TypeError' && e.message !== 'Failed to fetch') {
        console.error('Failed to fetch notifications', e);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [apiPrefix]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRead = async (id: number, link?: string) => {
    try {
      await fetch(`${apiPrefix}/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleReadAll = async () => {
    try {
      await fetch(`${apiPrefix}/notifications/read-all`, { method: 'PUT' });
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const renderMessage = (message: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all">{part}</a>;
      }
      return part;
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(5px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 mt-2 w-[calc(100vw-48px)] sm:w-96 bg-[#111] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 backdrop-blur-2xl max-w-[400px]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 relative z-10">
              <h3 className="font-bold text-white">Benachrichtigungen</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  className="text-xs text-white/50 hover:text-white font-medium flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Alle als gelesen markieren
                </button>
              )}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar relative z-10" style={{ maxHeight: "calc(100vh - 150px)" }}>
              {notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                    <Bell className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm font-medium">Keine Benachrichtigungen vorhanden.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleRead(notif.id, notif.link)}
                      className={`p-4 hover:bg-white/5 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-white/5' : ''}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {!notif.is_read ? (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-white/20 mt-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${!notif.is_read ? 'font-bold text-white' : 'font-medium text-white/70'}`}>
                          {notif.title}
                        </div>
                        <div className="text-sm text-white/50 mt-0.5 leading-relaxed">
                          {renderMessage(notif.message)}
                        </div>
                        <div className="text-xs text-white/40 mt-1.5 font-mono tracking-tight opacity-70">
                          {formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true, locale: de })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
