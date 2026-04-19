import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LogOut,
  Calendar,
  Users,
  BarChart,
  Layout,
  UserPlus,
  Moon,
  Sun,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import NotificationsMenu from "./NotificationsMenu";
import Breadcrumb from "./Breadcrumb";
import { useTheme } from "../lib/theme";
import VersionBadge from "./VersionBadge";
import Avatar from "./Avatar";
import SettingsModal from "./SettingsModal";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    avatar_url?: string | null;
  } | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then(() => setLoading(false))
      .catch(() => navigate("/login"));

    // Fetch current user info for avatar
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data))
      .catch(() => {});
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    navigate("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text-dim">
        Lade...
      </div>
    );

  const navItems = [
    { path: "/", label: "Aktionen", icon: Calendar },
    { path: "/persons", label: "Mitglieder", icon: Users },
    { path: "/registration-requests", label: "Anfragen", icon: UserPlus },
    { path: "/stats", label: "Statistik", icon: BarChart },
    { path: "/dashboard", label: "Meine Übersicht", icon: Layout },
  ];

  return (
    <div className="min-h-screen bg-surface text-text flex flex-col selection:bg-accent-muted/30">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-2xl border-b border-border pt-safe">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <Link
              to="/"
              className="flex items-center gap-4 text-text font-serif text-2xl tracking-tighter group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-accent text-surface rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-2xl shadow-accent/10 ring-1 ring-border">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-black tracking-tighter italic">
                  JT-ORGA
                </span>
                <span className="micro-label !text-[8px] opacity-40 italic">
                  Systemkonsole
                </span>
              </div>
              {currentUser && (
                <div className="ml-4 pl-4 border-l border-border">
                  <Avatar
                    name={currentUser.username}
                    avatarUrl={currentUser.avatar_url}
                    size="sm"
                  />
                </div>
              )}
            </Link>
            <nav className="hidden lg:flex gap-1 bg-surface-elevated rounded-2xl p-1 border border-border">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path === "/" &&
                    location.pathname.startsWith("/events"));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group ${isActive ? "text-accent" : "text-text-dim hover:text-text hover:bg-surface-elevated/50"}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-accent-muted/10 rounded-xl border border-border"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:scale-110" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <NotificationsMenu apiPrefix="/api/admin" />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border hover:bg-danger/10 hover:border-danger/20 hover:text-danger transition-all active:scale-95 group"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest">
                Abmelden
              </span>
            </button>
            <button
              onClick={toggleTheme}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border hover:bg-accent-muted transition-all active:scale-95"
              title="Wechsel zwischen Hell- und Dunkelmodus"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      <main className="flex-1 max-w-[1920px] w-full mx-auto px-6 sm:px-12 py-12 pb-32 lg:pb-12 h-full relative">
        <VersionBadge />
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-3xl border-t border-border px-6 pt-3 pb-safe">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/" && location.pathname.startsWith("/events"));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 relative ${isActive ? "text-accent" : "text-text-dim"}`}
              >
                <div
                  className={`p-2.5 rounded-2xl transition-all relative ${isActive ? "bg-accent-muted text-accent" : ""}`}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full translate-y-3"
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
