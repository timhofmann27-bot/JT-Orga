import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Train, Bus, TramFront as Tram, Footprints as Walk,
  MapPin, Clock, ArrowRight, X, Loader2, Navigation,
  ChevronRight, AlertCircle, Search, ExternalLink, Zap, Shield, Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchTransitConnections } from '../services/transitService';
import { processConnections, EnrichedConnection, IntelligenceResult } from '../services/transitIntelligence';
import toast from 'react-hot-toast';

interface TransitPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  destinationName: string;
  eventStartTime?: string;
}

export default function TransitPlanner({
  isOpen, onClose, destination, destinationName, eventStartTime
}: TransitPlannerProps) {
  const [startPoint, setStartPoint] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [departureTime, setDepartureTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<EnrichedConnection[]>([]);
  const [meta, setMeta] = useState<IntelligenceResult['meta'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoized icon getter — no need to recreate on every render
  const getIcon = useMemo(() => (mode: string) => {
    switch (mode) {
      case 'train': return <Train className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      case 'walk': return <Walk className="w-4 h-4" />;
      case 'tram': return <Tram className="w-4 h-4" />;
      case 'subway': return <Train className="w-4 h-4 text-emerald-400" />;
      default: return <Bus className="w-4 h-4" />;
    }
  }, []);

  const findRoutes = useCallback(async (start: string, signal?: AbortSignal) => {
    if (!destination) {
      setError('Zielort nicht definiert. Bitte wähle eine Aktion aus.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const routes = await fetchTransitConnections(start, destination, departureTime || undefined, signal);
      if (signal?.aborted) return;

      if (routes.length === 0) {
        setError('Keine Verbindung gefunden. Probiere einen anderen Startpunkt oder Zeitpunkt.');
        return;
      }

      if (eventStartTime) {
        const intelligence = await processConnections(
          { location: destinationName, startTime: eventStartTime, type: 'party' },
          { from: start, preferences: { priority: 'balanced', behavior: 'balanced' } },
          routes
        );
        if (signal?.aborted) return;
        setConnections(intelligence.connections);
        setMeta(intelligence.meta);
        if (intelligence.connections.length === 0 && intelligence.meta.warnings.length > 0) {
          setError(intelligence.meta.warnings[0]);
        }
      } else {
        setConnections(routes.map(r => ({
          ...r,
          recommendationScore: 0,
          urgency: 'safe',
          confidence: 'medium',
          tags: [],
          summary: 'Verbindung verfügbar.'
        })));
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setError('Fehler bei der Routenberechnung. Bitte später erneut versuchen.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [destination, destinationName, eventStartTime, departureTime]);

  const handleGetCurrentLocation = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation wird von deinem Browser nicht unterstützt');
      setUseCurrentLocation(false);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (signal?.aborted) return;
        const start = `${pos.coords.latitude},${pos.coords.longitude}`;
        setStartPoint('Aktueller Standort');
        findRoutes(start, signal);
      },
      (err) => {
        if (signal?.aborted) return;
        console.error('Geolocation error:', err);
        const msg = err.code === 1 ? 'Standortzugriff verweigert' : 'Standort konnte nicht ermittelt werden';
        toast.error(msg);
        setUseCurrentLocation(false);
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [findRoutes]);

  // AbortController cleanup prevents race conditions on rapid open/close
  useEffect(() => {
    if (!isOpen) {
      setConnections([]);
      setError(null);
      setDepartureTime('');
      setShowTimePicker(false);
      return;
    }
    const controller = new AbortController();
    if (useCurrentLocation) {
      handleGetCurrentLocation(controller.signal);
    } else if (startPoint) {
      findRoutes(startPoint, controller.signal);
    }
    return () => controller.abort();
  }, [isOpen, destination]);

  const getOfficialLinks = useCallback((arrivalMode = false) => {
    const isCurrentLoc = startPoint === 'Aktueller Standort';
    const start = isCurrentLoc ? '' : startPoint;
    const encodedStart = encodeURIComponent(start);
    const encodedDest = encodeURIComponent(destination);

    let dbUrl = `https://www.bahn.de/buchung/fahrplan/suche?so=${encodedStart}&zo=${encodedDest}`;
    let gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${isCurrentLoc ? 'current location' : encodedStart}&destination=${encodedDest}&travelmode=transit`;

    if (arrivalMode && eventStartTime) {
      try {
        const date = parseISO(eventStartTime);
        const arrivalTimeValue = Math.floor(date.getTime() / 1000);
        const dateStr = format(date, 'yyyy-MM-dd');
        const timeStr = format(date, 'HH:mm');
        dbUrl = `https://www.bahn.de/buchung/fahrplan/suche?so=${encodedStart}&zo=${encodedDest}&date=${dateStr}&time=${timeStr}&timesel=arrive`;
        gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${isCurrentLoc ? 'current location' : encodedStart}&destination=${encodedDest}&travelmode=transit&arrival_time=${arrivalTimeValue}`;
      } catch (e) {
        console.error('Error generating arrival links:', e);
      }
    }
    return { dbUrl, gmapsUrl };
  }, [startPoint, destination, eventStartTime]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!startPoint) return;
    findRoutes(startPoint);
  }, [startPoint, findRoutes]);

  const { dbUrl, gmapsUrl } = getOfficialLinks(true);

  // JSX bleibt identisch — nur Logik optimiert
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-[#0a0a0b] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-8 sm:p-10 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                    <Train className="w-6 h-6 text-white/40" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-white tracking-tighter">Route planen</h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Öffentlicher Nahverkehr</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Location Summary */}
              <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 mb-8">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Ziel</div>
                  <div className="text-sm font-bold text-white truncate">{destinationName}</div>
                </div>
              </div>

              {/* Start Input */}
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="relative">
                  <input 
                    type="text"
                    placeholder="Startort eingeben..."
                    value={startPoint}
                    onChange={(e) => {
                      setStartPoint(e.target.value);
                      setUseCurrentLocation(false);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/10 focus:ring-2 focus:ring-white/10 outline-none transition-all font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  {!useCurrentLocation && (
                    <button 
                      type="button"
                      onClick={() => handleGetCurrentLocation()}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                      title="Aktuellen Standort nutzen"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  )}
                </form>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors ml-1 active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {(() => {
                      if (!departureTime) return 'Abfahrt: Jetzt';
                      try {
                        return <span className="text-white">Abfahrt: {format(parseISO(departureTime), 'dd.MM. HH:mm')}</span>;
                      } catch (e) {
                        return 'Abfahrt: Jetzt';
                      }
                    })()}
                  </button>

                  <AnimatePresence>
                    {showTimePicker && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-4"
                      >
                        <div className="flex gap-2">
                          <input 
                            type="datetime-local"
                            value={departureTime}
                            onChange={(e) => {
                              setDepartureTime(e.target.value);
                              if (startPoint) findRoutes(startPoint);
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs outline-none focus:ring-2 focus:ring-white/10 transition-all [color-scheme:dark]"
                          />
                          {departureTime && (
                            <button 
                              onClick={() => {
                                setDepartureTime('');
                                if (startPoint) findRoutes(startPoint);
                              }}
                              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                            >
                              Jetzt
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8">
              {meta && !loading && !error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-6 rounded-[3rem] border flex items-center gap-6 ${
                    meta.globalAdvice === 'leave_now' ? 'bg-red-500/10 border-red-500/20' :
                    meta.globalAdvice === 'leave_soon' ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-emerald-500/10 border-emerald-500/20'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    meta.globalAdvice === 'leave_now' ? 'bg-red-500 text-white shadow-red-500/20' :
                    meta.globalAdvice === 'leave_soon' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                    'bg-emerald-500 text-white shadow-emerald-500/20'
                  }`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Empfehlung</div>
                    <div className="text-sm font-bold text-white leading-tight">{meta.globalMessage}</div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Link */}
              <div className="space-y-6">
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 text-center">Routenführung</div>
                
                <motion.a 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-6 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-10 rounded-[3rem] transition-all group shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                  <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                    <Navigation className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-serif font-bold text-white tracking-tighter mb-2">In Google Maps navigieren</div>
                    <div className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.3em]">
                      {(() => {
                        if (!eventStartTime) return 'Optimale Verbindung';
                        try {
                          return `Ankunft geplant für ${format(parseISO(eventStartTime), 'HH:mm')} Uhr`;
                        } catch (e) {
                          return 'Optimale Verbindung';
                        }
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest mt-4">
                    Klicken zum Starten <ExternalLink className="w-3 h-3" />
                  </div>
                </motion.a>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Analysiere Verkehrslage...</p>
                  </div>
                )}

                {error && !loading && (
                  <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] text-center">
                    <AlertCircle className="w-8 h-8 text-red-500/40 mx-auto mb-4" />
                    <p className="text-white/40 font-medium text-sm leading-relaxed">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 sm:p-10 bg-white/[0.01] border-t border-white/5 text-center">
              <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] leading-relaxed">
                DATEN WERDEN IN ECHTZEIT GELADEN.<br />BITTE PRÜFE DIE VERBINDUNGEN VOR ORT.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
