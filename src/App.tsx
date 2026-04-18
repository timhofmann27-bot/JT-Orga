/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import PersonDashboard from './pages/PersonDashboard';
import { PageSkeleton } from './components/ui/Skeleton';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { useWebVitals, trackPageView } from './lib/analytics';
import { useKeyboardShortcuts, ShortcutsModal } from './lib/keyboardShortcuts.tsx';
import InstallAppBanner from './components/InstallAppBanner';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const EventDetails = React.lazy(() => import('./pages/EventDetails'));
const Persons = React.lazy(() => import('./pages/Persons'));
const Stats = React.lazy(() => import('./pages/Stats'));
const PublicInvite = React.lazy(() => import('./pages/PublicInvite'));
const RegisterRequest = React.lazy(() => import('./pages/RegisterRequest'));
const Register = React.lazy(() => import('./pages/Register'));
const RegistrationRequests = React.lazy(() => import('./pages/RegistrationRequests'));

function Analytics() {
  const location = useLocation();
  
  useWebVitals();
  
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  
  return null;
}

function KeyboardShortcutsHandler() {
  useKeyboardShortcuts();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <KeyboardShortcutsHandler />
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <OfflineBanner />
      <InstallAppBanner />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-request" element={<RegisterRequest />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PersonDashboard />} />
          <Route path="/invite/:token" element={<PublicInvite />} />
          
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="events/:id" element={<EventDetails />} />
            <Route path="persons" element={<Persons />} />
            <Route path="stats" element={<Stats />} />
            <Route path="registration-requests" element={<RegistrationRequests />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
