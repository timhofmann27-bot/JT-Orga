import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Calendar, Users, BarChart, Layout } from 'lucide-react';
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
    { path: '/stats', label: 'Statistik', icon: BarChart },
    { path: '/dashboard', label: 'Mein Dashboard', icon: Layout },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-white/20">
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 text-white font-serif text-xl tracking-tight group">
              <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-semibold">JT-ORGA</span>
            </Link>
            <nav className="hidden md:flex gap-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${isActive ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-white/10 rounded-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <NotificationsMenu apiPrefix="/api/admin" />
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <button 
              onClick={handleLogout}
              className="text-white/40 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 pb-32 md:pb-10 relative">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 pb-8">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-white' : 'text-white/30'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-white/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
