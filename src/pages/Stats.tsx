import React, { useState, useEffect } from 'react';
import { BarChart, Calendar, Users, Mail, CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
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
    <div className="pb-24">
      <div className="mb-16">
        <h1 className="text-5xl font-serif font-bold text-white mb-12 flex items-center gap-6 tracking-tight">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center shadow-2xl">
            <BarChart className="w-8 h-8 text-white/40" />
          </div>
          Statistik
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { label: 'Aktionen gesamt', value: stats.events, icon: Calendar },
            { label: 'Personen', value: stats.persons, icon: Users },
            { label: 'Einladungen', value: stats.invites, icon: Mail }
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }} 
              className="bg-white/[0.02] p-10 rounded-[3rem] shadow-2xl border border-white/5 flex items-center gap-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                <item.icon className="w-8 h-8 text-white/20" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">{item.label}</div>
                <div className="text-4xl font-serif font-bold text-white">{item.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} 
        className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-10 border-b border-white/5 bg-white/5">
          <h2 className="text-2xl font-serif font-bold text-white">Antworten pro Aktion</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                <th className="px-10 py-6">Aktion</th>
                <th className="px-10 py-6">Datum</th>
                <th className="px-10 py-6 text-center">Einladungen</th>
                <th className="px-10 py-6 text-center">Zusagen</th>
                <th className="px-10 py-6 text-center">Absagen</th>
                <th className="px-10 py-6 text-center">Vielleicht</th>
                <th className="px-10 py-6 text-center">Offen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.eventBreakdown?.map((aktion: any) => (
                <tr key={aktion.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-10 py-8 font-serif text-xl text-white group-hover:text-white transition-colors">{aktion.title}</td>
                  <td className="px-10 py-8 text-sm font-medium text-white/30">
                    {format(parseISO(aktion.date), 'dd.MM.yyyy', { locale: de })}
                  </td>
                  <td className="px-10 py-8 text-center text-xl font-serif font-bold text-white">
                    {aktion.total_invites}
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/10 uppercase tracking-widest">
                      {aktion.yes_count}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/10 uppercase tracking-widest">
                      {aktion.no_count}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10 uppercase tracking-widest">
                      {aktion.maybe_count}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-white/5 text-white/20 border border-white/5 uppercase tracking-widest">
                      {aktion.pending_count}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats.aktionBreakdown || stats.aktionBreakdown.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-10 py-24 text-center text-white/10 font-serif text-xl">
                    Keine Aktionen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
