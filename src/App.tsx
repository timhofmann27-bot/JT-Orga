/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import PersonLogin from './pages/PersonLogin';
import PersonDashboard from './pages/PersonDashboard';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import Persons from './pages/Persons';
import Stats from './pages/Stats';
import PublicInvite from './pages/PublicInvite';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/login" element={<PersonLogin />} />
        <Route path="/dashboard" element={<PersonDashboard />} />
        <Route path="/invite/:token" element={<PublicInvite />} />
        
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="persons" element={<Persons />} />
          <Route path="stats" element={<Stats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
