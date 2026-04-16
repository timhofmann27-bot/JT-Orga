import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Calendar, Users, BarChart, Layout, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationsMenu from './NotificationsMenu';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(() => setLoading(false))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50">Lade...</div>;

  const navItems = [
    { path: '/', label: 'Aktionen', icon: Calendar },
    { path: '/persons', label: 'Mitglieder', icon: Users },
    { path: '/registration-requests', label: 'Anfragen', icon: UserPlus },
    { path: '/stats', label: 'Statistik', icon: BarChart },
    { path: '/dashboard', label: 'Mein Dashboard', icon: Layout },
  ];

  return (
    <div className="min-h-screen bg-surface text-white flex flex-col selection:bg-white/20">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 pt-safe">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 text-white font-serif text-xl tracking-tight group active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-white text-black rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg shadow-white/10">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-bold tracking-tighter">JT-ORGA</span>
            </Link>
            <nav className="hidden lg:flex gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`relative flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isActive ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-white/10 rounded-xl"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsMenu apiPrefix="/api/admin" />
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <button 
              onClick={handleLogout}
              className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all active:scale-90"
              title="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 pb-32 lg:pb-12 h-full">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile Bottom Tab Bar (Native Style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-3xl border-t border-white/5 px-6 pt-3 pb-safe">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 relative ${isActive ? 'text-white' : 'text-white/30'}`}
              >
                <div className={`p-2.5 rounded-2xl transition-all relative ${isActive ? 'bg-white/10 text-white' : ''}`}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div 
                      layoutId="tab-underline"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full translate-y-3" 
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
