const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export type WeatherData = {
  city: string;
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
};

/**
 * Fetches the current weather for a city, used in the trip info bar.
 * Accepts an optional country to tell cities with the same name apart.
 */
export async function getWeather(city: string, country?: string): Promise<WeatherData> {
  // Build query - append country if provided for accuracy
  const query = country ? `${city},${country}` : city;
  const url = `${BASE_URL}/weather?q=${encodeURIComponent(query)}&units=metric&appid=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    description: data.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed),
  };
}
