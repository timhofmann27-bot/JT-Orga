import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, LogOut, User, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import NotificationsMenu from '../components/NotificationsMenu';

export default function PersonDashboard() {
  const [user, setUser] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/public/check');
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        setUser(data.user);
        
        const invRes = await fetch('/api/public/dashboard');
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvitations(invData);
        }
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('/api/public/logout', { method: 'POST' });
      toast.success('Abgemeldet');
      navigate('/login');
    } catch (err) {
      toast.error('Fehler beim Abmelden');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Lade...</div>;

  const upcoming = invitations.filter(i => new Date(i.date) >= new Date());
  const past = invitations.filter(i => new Date(i.date) < new Date());
  const pending = upcoming.filter(i => i.status === 'pending');
  const responded = upcoming.filter(i => i.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline">Hallo, {user?.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsMenu apiPrefix="/api/public" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Offene Einladungen */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">Offene Einladungen</h2>
            </div>
            <div className="grid gap-4">
              {pending.map(inv => (
                <Link 
                  key={inv.id} 
                  to={`/invite/${inv.token}`}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-amber-200 hover:border-amber-400 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex flex-col items-center justify-center text-amber-700 shrink-0">
                      <span className="text-xs font-bold uppercase">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                      <span className="text-lg font-bold leading-none">{format(parseISO(inv.date), 'dd')}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors">{inv.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(parseISO(inv.date), 'HH:mm')} Uhr</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {inv.location}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Meine Events */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-900" />
            <h2 className="text-xl font-bold text-gray-900">Kommende Events</h2>
          </div>
          {responded.length > 0 ? (
            <div className="grid gap-4">
              {responded.map(inv => (
                <Link 
                  key={inv.id} 
                  to={`/invite/${inv.token}`}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-gray-900 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-500 shrink-0">
                      <span className="text-xs font-bold uppercase">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                      <span className="text-lg font-bold leading-none">{format(parseISO(inv.date), 'dd')}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{inv.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {inv.location}</span>
                        <span className="flex items-center gap-1">
                          {inv.status === 'yes' && <span className="text-green-600 flex items-center gap-1 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Zugesagt</span>}
                          {inv.status === 'no' && <span className="text-red-600 flex items-center gap-1 font-medium"><XCircle className="w-3.5 h-3.5" /> Abgesagt</span>}
                          {inv.status === 'maybe' && <span className="text-amber-600 flex items-center gap-1 font-medium"><HelpCircle className="w-3.5 h-3.5" /> Vielleicht</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center">
              <p className="text-gray-500">Du hast noch keine kommenden Events mit Antwort.</p>
            </div>
          )}
        </section>

        {/* Vergangene Events */}
        {past.length > 0 && (
          <section className="opacity-60">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Vergangene Events</h2>
            <div className="grid gap-3">
              {past.map(inv => (
                <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-gray-400 w-10 text-center">
                      {format(parseISO(inv.date), 'dd.MM.')}
                    </div>
                    <div className="font-medium text-gray-700">{inv.title}</div>
                  </div>
                  <div className="text-xs font-bold uppercase text-gray-400">
                    {inv.status === 'yes' ? 'Teilgenommen' : 'Nicht dabei'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
