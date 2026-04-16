import React, { useState, useEffect } from 'react';
import { 
  Train, Bus, TramFront as Tram, Footprints as Walk, 
  MapPin, Clock, ArrowRight, X, Loader2, Navigation,
  ChevronRight, AlertCircle, Search, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchTransitConnections, TransitConnection } from '../services/transitService';
import toast from 'react-hot-toast';

interface TransitPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  destinationName: string;
  eventStartTime?: string;
}

export default function TransitPlanner({ isOpen, onClose, destination, destinationName, eventStartTime }: TransitPlannerProps) {
  const [startPoint, setStartPoint] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [departureTime, setDepartureTime] = useState<string>(''); // ISO string or empty for "now"
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<TransitConnection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getIcon = (mode: string) => {
    switch (mode) {
      case 'train': return <Train className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      case 'walk': return <Walk className="w-4 h-4" />;
      case 'tram': return <Tram className="w-4 h-4" />;
      case 'subway': return <Train className="w-4 h-4 text-emerald-400" />;
      default: return <Bus className="w-4 h-4" />;
    }
  };

  const findRoutes = async (start: string) => {
    if (!destination) {
      setError('Zielort nicht definiert. Bitte wähle eine Aktion aus.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const routes = await fetchTransitConnections(start, destination, departureTime || undefined);
      if (routes.length === 0) {
        setError('Keine Verbindung gefunden. Probiere es mit einem anderen Startpunkt oder Zeitpunkt.');
      } else {
        setConnections(routes);
      }
    } catch (err) {
      setError('Fehler bei der Routenberechnung. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation wird von deinem Browser nicht unterstützt');
      setUseCurrentLocation(false);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const start = `${pos.coords.latitude},${pos.coords.longitude}`;
        setStartPoint('Aktueller Standort');
        findRoutes(start);
      },
      (err) => {
        console.error('Geolocation error:', err);
        const msg = err.code === 1 ? 'Standortzugriff verweigert' : 'Standort konnte nicht ermittelt werden';
        toast.error(msg);
        setUseCurrentLocation(false);
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (isOpen) {
      if (useCurrentLocation) {
        handleGetCurrentLocation();
      } else if (startPoint) {
        findRoutes(startPoint);
      }
    } else {
      // Clear results on close to avoid stale data next time
      setConnections([]);
      setError(null);
      setDepartureTime('');
      setShowTimePicker(false);
    }
  }, [isOpen, destination]);

  const getOfficialLinks = (arrivalMode = false) => {
    const isCurrentLoc = startPoint === 'Aktueller Standort';
    const start = isCurrentLoc ? '' : (startPoint || '');
    const encodedStart = encodeURIComponent(start);
    const encodedDest = encodeURIComponent(destination);
    
    // Modern "Next DB" parameters for bahn.de: so (start), zo (destination)
    let dbUrl = `https://www.bahn.de/buchung/fahrplan/suche?so=${encodedStart}&zo=${encodedDest}`;
    let gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${isCurrentLoc ? 'current location' : encodedStart}&destination=${encodedDest}&travelmode=transit`;

    if (arrivalMode && eventStartTime) {
      try {
        const date = parseISO(eventStartTime);
        const arrivalTimeValue = Math.floor(date.getTime() / 1000);
        
        const dateStr = format(date, 'yyyy-MM-dd');
        const timeStr = format(date, 'HH:mm');
        
        // DB: so=Start, zo=Ziel, date=YYYY-MM-DD, time=HH:mm, timesel=arrive
        // Using the /fahrplan/suche endpoint directly to bypass the blank input mask
        dbUrl = `https://www.bahn.de/buchung/fahrplan/suche?so=${encodedStart}&zo=${encodedDest}&date=${dateStr}&time=${timeStr}&timesel=arrive`;
        
        // Google Maps: Ensure arrival_time is passed correctly for transit travel mode
        gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${isCurrentLoc ? 'current location' : encodedStart}&destination=${encodedDest}&travelmode=transit&arrival_time=${arrivalTimeValue}`;
      } catch (e) {
        console.error('Error generating arrival links:', e);
      }
    }

    return { dbUrl, gmapsUrl };
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startPoint) return;
    findRoutes(startPoint);
  };

  const { dbUrl, gmapsUrl } = getOfficialLinks(true);

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
                      onClick={handleGetCurrentLocation}
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
                    {departureTime ? (
                      <span className="text-white">Abfahrt: {format(parseISO(departureTime), 'dd.MM. HH:mm')}</span>
                    ) : (
                      'Abfahrt: Jetzt'
                    )}
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
              {/* Official Apps Section (Always visible for reliability) */}
              <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Offizielle Planung</div>
                  {eventStartTime && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-400 uppercase">Ziel-Ankunft: {format(parseISO(eventStartTime), 'HH:mm')}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={dbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 p-4 rounded-2xl transition-all group active:scale-95"
                  >
                    <Train className="w-4 h-4 text-red-500" />
                    <div className="text-left">
                      <div className="text-[10px] font-black text-white uppercase tracking-tight">DB Navigator</div>
                      <div className="text-[8px] font-bold text-red-500/60 uppercase">Detailliert</div>
                    </div>
                  </a>
                  <a 
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-4 rounded-2xl transition-all group active:scale-95"
                  >
                    <Navigation className="w-4 h-4 text-emerald-500" />
                    <div className="text-left">
                      <div className="text-[10px] font-black text-white uppercase tracking-tight">Google Maps</div>
                      <div className="text-[8px] font-bold text-emerald-500/60 uppercase">Schnell</div>
                    </div>
                  </a>
                </div>
              </div>

              {loading ? (
                <div className="space-y-6">
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Suche Verbindungen...</div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 animate-pulse">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-2">
                          <div className="w-16 h-6 bg-white/5 rounded-lg" />
                          <div className="w-16 h-6 bg-white/5 rounded-lg" />
                        </div>
                        <div className="space-y-2">
                          <div className="w-24 h-8 bg-white/5 rounded-lg" />
                          <div className="w-16 h-3 bg-white/5 rounded-lg ml-auto" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="w-32 h-3 bg-white/5 rounded-lg" />
                        <div className="w-24 h-10 bg-white/5 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="py-20 text-center space-y-8">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-red-500/5 rounded-3xl flex items-center justify-center mx-auto border border-red-500/10">
                      <AlertCircle className="w-8 h-8 text-red-500/40" />
                    </div>
                    <p className="text-white/40 font-serif text-lg px-10">{error}</p>
                  </div>
                  
                  <div className="pt-8 border-t border-white/5 space-y-4">
                    <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">Alternative verwenden</p>
                    <div className="flex justify-center">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startPoint === 'Aktueller Standort' ? 'current location' : startPoint)}&destination=${encodeURIComponent(destination)}&travelmode=transit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 px-8 py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                      >
                        In Google Maps öffnen <ExternalLink className="w-4 h-4 text-white/40" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : connections.length > 0 ? (
                <>
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Empfohlene Wege</div>
                  {connections.map((c, i) => (
                    <motion.div 
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-2">
                          {c.legs.map((leg, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-white/40 text-[9px] font-black uppercase tracking-tight">
                                {getIcon(leg.mode)}
                                {leg.line}
                              </div>
                              {idx < c.legs.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-white/10 self-center" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-serif font-bold text-white tracking-tighter">
                            {format(parseISO(c.departure), 'HH:mm')} – {format(parseISO(c.arrival), 'HH:mm')}
                          </div>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                            {c.duration} Min • {c.transfers} Umstiege
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Abfahrt in {Math.round((parseISO(c.departure).getTime() - Date.now()) / 60000)} Min</span>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Bereit für die Reiseplanung.</p>
                </div>
              )}
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
