import { parseISO } from 'date-fns';

/**
 * Core transit interfaces for consistent data handling across UI
 */
export interface TransitLeg {
  mode: 'train' | 'bus' | 'walk' | 'subway' | 'tram' | 'ferry';
  line?: string;
  departure: string;
  arrival: string;
  duration: number; // minutes
}

export interface TransitConnection {
  id: string;
  departure: string;
  arrival: string;
  duration: number; // minutes
  transfers: number;
  legs: TransitLeg[];
  price?: string;
}

/**
 * Abstract Transit Provider Interface
 * Allows swapping between DB, VBB, OTP, or Google Maps without changing the UI
 */
export interface TransitProvider {
  fetchJourneys(from: string, to: string, when?: string): Promise<TransitConnection[]>;
}

/**
 * HAFAS / transport.rest Provider Implementation (Default)
 * Optimized for EU / DE context
 */
class HafasProvider implements TransitProvider {
  async fetchJourneys(from: string, to: string, when?: string): Promise<TransitConnection[]> {
    const params = new URLSearchParams();
    params.append('results', '4');
    params.append('stopovers', 'false');

    if (when) {
      params.append('when', when);
    }

    // Helper to detect coordinates (handles potential spaces)
    const coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    const isCoords = (str: string) => coordRegex.test(str);

    if (isCoords(from)) {
      const [lat, lon] = from.split(',').map(s => s.trim());
      params.append('from.latitude', lat);
      params.append('from.longitude', lon);
      params.append('from.name', 'Start');
    } else {
      params.append('from', from);
    }

    if (isCoords(to)) {
      const [lat, lon] = to.split(',').map(s => s.trim());
      params.append('to.latitude', lat);
      params.append('to.longitude', lon);
      params.append('to.name', 'Ziel');
    } else {
      params.append('to', to);
    }

    // Switch to VBB as primary request from the Principal Engineer prompt
    const response = await fetch(`https://v6.vbb.transport.rest/journeys?${params.toString()}`);
    
    if (!response.ok) {
      // Fallback to DB if VBB fails for outside-Berlin locations
      const dbResponse = await fetch(`https://v6.db.transport.rest/journeys?${params.toString()}`);
      if (!dbResponse.ok) {
        const errData = await dbResponse.json().catch(() => ({}));
        throw new Error(errData.message || 'Keine Route gefunden');
      }
      return this.parseResponse(await dbResponse.json());
    }
    
    return this.parseResponse(await response.json());
  }

  private parseResponse(data: any): TransitConnection[] {
    if (!data.journeys || data.journeys.length === 0) return [];

    return data.journeys.map((j: any) => {
      const dep = parseISO(j.legs[0].departure);
      const arr = parseISO(j.legs[j.legs.length - 1].arrival);
      
      return {
        id: j.refreshToken || Math.random().toString(),
        departure: j.legs[0].departure,
        arrival: j.legs[j.legs.length - 1].arrival,
        duration: Math.round((arr.getTime() - dep.getTime()) / 60000),
        transfers: j.legs.filter((l: any) => l.mode !== 'walking').length - 1,
        legs: j.legs.map((l: any) => ({
          mode: l.mode === 'walking' ? 'walk' : (l.line?.product || 'tram'),
          line: l.line?.name || l.line?.label,
          departure: l.departure,
          arrival: l.arrival,
          duration: Math.round((parseISO(l.arrival).getTime() - parseISO(l.departure).getTime()) / 60000)
        })),
        price: j.price?.amount ? `${j.price.amount} ${j.price.currency}` : undefined
      };
    });
  }
}

/**
 * Service Factory (Singleton)
 * Easily switch providers here
 */
const activeProvider: TransitProvider = new HafasProvider();

/**
 * Main Public API
 */
export async function fetchTransitConnections(from: string, to: string, when?: string): Promise<TransitConnection[]> {
  // Logic is completely encapsulated in provider
  return activeProvider.fetchJourneys(from, to, when);
}
