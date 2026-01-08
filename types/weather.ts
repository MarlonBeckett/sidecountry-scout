export interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    weatherDescription: string;
    cloudCover: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windDirectionCardinal: string;
    windGusts: number;
  };
  hourly: {
    time: string[];
    temperature: number[];
    precipitationProbability: number[];
    precipitation: number[];
    snowfall: number[];
    cloudCover: number[];
    visibility: number[];
    windSpeed: number[];
    windDirection: number[];
    windGusts: number[];
    uvIndex: number[];
  };
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationSum: number[];
    snowfallSum: number[];
    precipitationProbabilityMax: number[];
    windSpeedMax: number[];
    windGustsMax: number[];
    uvIndexMax: number[];
  };
  lastUpdated: string;
}
