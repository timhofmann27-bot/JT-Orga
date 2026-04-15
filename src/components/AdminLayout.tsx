import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Calendar, Users, BarChart } from 'lucide-react';
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
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white/30">
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
              <div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              AktionsPlaner
            </Link>
            <nav className="hidden sm:flex gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-white/10 rounded-xl"
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
          <div className="flex items-center gap-4">
            <NotificationsMenu apiPrefix="/api/admin" />
            <button 
              onClick={handleLogout}
              className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
        {/* Mobile Nav */}
        <div className="sm:hidden border-t border-white/10 bg-black/50 backdrop-blur-2xl px-2 py-2 flex justify-around">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${isActive ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/80'}`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
