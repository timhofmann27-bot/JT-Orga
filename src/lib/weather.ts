
export interface WeatherData {
  temp: number;
  tempMin: number;
  current: number | null;
  code: number;
  condition: string;
  rainProb: number;
}

export async function fetchWeather(location: string, date?: string): Promise<WeatherData> {
  // Mock implementation
  return {
    temp: 22,
    tempMin: 15,
    current: 21,
    code: 0,
    condition: 'Sunny',
    rainProb: 5,
  };
}

export function getWeatherLabel(code: number | string): string {
  return 'Klarer Himmel';
}
