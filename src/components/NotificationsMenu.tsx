import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

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
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Alle als gelesen markieren
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Keine Benachrichtigungen vorhanden.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleRead(notif.id, notif.link)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {!notif.is_read ? (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-gray-300 mt-0.5" />
                      )}
                    </div>
                    <div>
                      <div className={`text-sm ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {notif.message}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true, locale: de })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
