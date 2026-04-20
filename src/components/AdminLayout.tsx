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
  MessageSquare,
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
    { path: "/broadcast", label: "Push-Senden", icon: MessageSquare },
    { path: "/dashboard", label: "Meine Übersicht", icon: Layout },
  ];

  return (
    <div className="min-h-screen bg-surface text-text flex flex-col selection:bg-accent-muted/30">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-2xl border-b border-border pt-safe">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-16">
            <Link
              to="/"
              className="flex items-center gap-3 sm:gap-4 text-text font-serif tracking-tighter group active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent text-surface rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-2xl shadow-accent/10 ring-1 ring-border shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-black tracking-tighter italic text-xl sm:text-2xl">
                  JT-ORGA
                </span>
                <span className="micro-label !text-[7px] sm:!text-[8px] opacity-40 italic">
                  Systemkonsole
                </span>
              </div>
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
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
              {currentUser && (
                <div className="flex items-center border-r border-border pr-2 sm:pr-4 sm:mr-2">
                  <Avatar
                    name={currentUser.username}
                    avatarUrl={currentUser.avatar_url}
                    size="sm"
                    className="w-8 h-8 sm:w-10 sm:h-10 text-[10px] sm:text-xs"
                  />
                </div>
              )}
            <NotificationsMenu apiPrefix="/api/admin" />
            <div className="h-6 w-px bg-border shrink-0 hidden sm:block" />
            <div className="flex items-center gap-1 bg-surface-elevated/50 p-1 border border-border rounded-[1.25rem] shrink-0">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-text-dim hover:text-text hover:bg-surface-elevated transition-all active:scale-95 shrink-0"
                title="Wechsel zwischen Hell- und Dunkelmodus"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-text-dim hover:text-danger hover:bg-danger/10 transition-all active:scale-95 shrink-0"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
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
