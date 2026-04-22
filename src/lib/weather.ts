export interface WeatherData {
  current: {
    weather_code: number;
    temperature_2m: number;
    wind_speed_10m: number;
  };
}

const WMO_CODES: Record<number, string> = {
  0: 'Klarer Himmel',
  1: 'Leicht bewölkt',
  2: 'Leicht bewölkt',
  3: 'Bewölkt',
  45: 'Nebel',
  48: 'Nebel',
  51: 'Regen',
  53: 'Regen',
  55: 'Regen',
  61: 'Regen',
  63: 'Regen',
  65: 'Regen',
  71: 'Schnee',
  73: 'Schnee',
  75: 'Schnee',
  80: 'Regen',
  81: 'Regen',
  82: 'Regen',
  95: 'Gewitter',
  96: 'Gewitter',
  99: 'Gewitter',
};

export function getWeatherLabel(code: number): string {
  return WMO_CODES[code] || 'Unbekannt';
}

export async function fetchWeather(location: string, _dateStr?: string): Promise<WeatherData | null> {
  try {
    // Geocode location first
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de`
    );
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.results?.[0]) return null;

    const { latitude, longitude } = geoData.results[0];

    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    if (!wxRes.ok) return null;
    const wxData = await wxRes.json();

    return {
      current: {
        weather_code: wxData.current_weather.weathercode ?? 0,
        temperature_2m: wxData.current_weather.temperature ?? 0,
        wind_speed_10m: wxData.current_weather.windspeed ?? 0,
      },
    };
  } catch (e) {
    // Weather fetch failed silently
    return null;
  }
}
