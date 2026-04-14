import React, { useState, useEffect } from 'react';
import { BarChart, Calendar, Users, Mail, CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center">Lade...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <BarChart className="w-6 h-6 text-gray-900" />
          Statistik
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Events gesamt</div>
              <div className="text-2xl font-bold text-gray-900">{stats.events}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Personen im Adressbuch</div>
              <div className="text-2xl font-bold text-gray-900">{stats.persons}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Einladungen verschickt</div>
              <div className="text-2xl font-bold text-gray-900">{stats.invites}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Antworten pro Event</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Datum</th>
                <th className="px-6 py-3 text-center">Einladungen</th>
                <th className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Zusagen
                  </div>
                </th>
                <th className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    Absagen
                  </div>
                </th>
                <th className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600">
                    <HelpCircle className="w-3 h-3" />
                    Vielleicht
                  </div>
                </th>
                <th className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    Offen
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.eventBreakdown?.map((event: any) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(parseISO(event.date), 'dd.MM.yyyy', { locale: de })}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    {event.total_invites}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {event.yes_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {event.no_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {event.maybe_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {event.pending_count}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats.eventBreakdown || stats.eventBreakdown.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                    Keine Events gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
