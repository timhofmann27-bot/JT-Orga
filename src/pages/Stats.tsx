import React, { useState, useEffect } from 'react';
import { BarChart as BarChartIcon, Calendar, Users, Mail, Archive, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center text-white/50 font-serif">Lade Statistik...</div>;

  const chartData = stats.eventBreakdown?.slice(0, 10).reverse().map((e: any) => ({
    name: e.title.length > 20 ? e.title.substring(0, 17) + '...' : e.title,
    fullTitle: e.title,
    Zusagen: e.yes_count,
    Absagen: e.no_count,
    Vielleicht: e.maybe_count,
    Offen: e.pending_count,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-white font-serif font-bold mb-2">{payload[0].payload.fullTitle}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-white/40">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-32">
      <div className="mb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl font-display font-medium text-white tracking-tighter leading-none">Analyse</h1>
            <p className="text-white/30 font-medium text-lg tracking-tight">Erfolg und Engagement deiner Events.</p>
          </div>
          <div className="w-16 h-16 bg-surface-elevated border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <BarChartIcon className="w-8 h-8 text-white/40 group-hover:scale-110 transition-transform duration-500 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Aktionen', value: stats.events, icon: Calendar, color: 'blue' },
            { 
              label: 'Archiviert', 
              value: stats.archived_events, 
              icon: Archive, 
              color: 'purple',
              sub: `${Math.round(stats.archived_pct)}%`
            },
            { label: 'Mitglieder', value: stats.persons, icon: Users, color: 'emerald' },
            { label: 'Einladungen', value: stats.invites, icon: Mail, color: 'rose' }
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} 
              className="bg-surface-muted p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col gap-8 relative overflow-hidden group hover:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="w-5 h-5 text-white/20" />
                </div>
                {item.sub && (
                  <div className="text-[9px] font-black text-white/20 px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">
                    {item.sub}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">{item.label}</div>
                <div className="text-4xl font-serif font-bold text-white tracking-tighter">{item.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} 
        className="bg-surface-muted p-8 sm:p-14 rounded-[3rem] shadow-2xl border border-white/5 mb-16 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16">
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold text-white tracking-tighter">Response Trends</h2>
            <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">Letzte 10 Aktionen im Vergleich</p>
          </div>
          <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
              <span className="text-[9px] font-black text-white/30 uppercase">Zusagen</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-amber-500/60" />
              <span className="text-[9px] font-black text-white/30 uppercase">Vielleicht</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-rose-500/60" />
              <span className="text-[9px] font-black text-white/30 uppercase">Absagen</span>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="0 0" stroke="#ffffff03" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff15', fontSize: 9, fontWeight: 900 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff15', fontSize: 9, fontWeight: 900 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff03' }} />
              <Bar 
                dataKey="Zusagen" 
                fill="#10b981" 
                fillOpacity={0.4} 
                radius={[8, 8, 8, 8]} 
                animationDuration={2000} 
                barSize={12}
              />
              <Bar 
                dataKey="Vielleicht" 
                name="Vielleicht" 
                fill="#f59e0b" 
                fillOpacity={0.4} 
                radius={[8, 8, 8, 8]} 
                animationDuration={2000} 
                barSize={12}
              />
              <Bar 
                dataKey="Absagen" 
                fill="#f43f5e" 
                fillOpacity={0.4} 
                radius={[8, 8, 8, 8]} 
                animationDuration={2000} 
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} 
        className="bg-surface-muted rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-8 sm:p-12 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-bold text-white tracking-tighter">Event Logs</h2>
            <p className="text-white/20 text-xs font-medium tracking-tight">Detaillierte Antwortstatistik pro Aktion</p>
          </div>
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
            Historie
          </div>
        </div>
        <div className="overflow-x-auto px-4 pb-8">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                <th className="px-10 py-10">Aktion</th>
                <th className="px-10 py-10">Datum</th>
                <th className="px-10 py-10 text-center">Invites</th>
                <th className="px-10 py-10 text-center">Dabei</th>
                <th className="px-10 py-10 text-center">Maybe</th>
                <th className="px-10 py-10 text-center">Nein</th>
                <th className="px-10 py-10 text-center">Offen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.eventBreakdown?.map((aktion: any) => (
                <tr key={aktion.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-10 py-10">
                    <div className="font-serif text-2xl text-white group-hover:text-white transition-colors tracking-tighter font-bold">{aktion.title}</div>
                  </td>
                  <td className="px-10 py-10 text-sm font-bold text-white/20 uppercase tracking-widest">
                    {format(parseISO(aktion.date), 'dd.MM.yyyy', { locale: de })}
                  </td>
                  <td className="px-10 py-10 text-center text-2xl font-serif font-bold text-white/40">
                    {aktion.total_invites}
                  </td>
                  <td className="px-10 py-10 text-center">
                    <div className="inline-flex items-center justify-center min-w-[40px] px-3 py-1.5 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10">
                      {aktion.yes_count}
                    </div>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <div className="inline-flex items-center justify-center min-w-[40px] px-3 py-1.5 rounded-xl text-[10px] font-black bg-amber-500/10 text-amber-400/80 border border-amber-500/10">
                      {aktion.maybe_count}
                    </div>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <div className="inline-flex items-center justify-center min-w-[40px] px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-500/10 text-rose-400/80 border border-rose-500/10">
                      {aktion.no_count}
                    </div>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <div className="inline-flex items-center justify-center min-w-[40px] px-3 py-1.5 rounded-xl text-[10px] font-black bg-white/5 text-white/20 border border-white/5">
                      {aktion.pending_count}
                    </div>
                  </td>
                </tr>
              ))}
              {(!stats.eventBreakdown || stats.eventBreakdown.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-10 py-32 text-center text-white/5 font-serif text-3xl tracking-tighter">
                    Keine Daten verfügbar.
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

