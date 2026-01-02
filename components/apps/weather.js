import React, { Component } from 'react';

export class Weather extends Component {
    constructor() {
        super();
        this.state = {
            loading: true,
            weather: null,
            city: 'London',
            searchInput: '',
            error: null
        };
    }

    componentDidMount() {
        this.fetchWeather(51.5074, -0.1278); // Default London
    }

    async fetchWeather(lat, lon) {
        this.setState({ loading: true, error: null });
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await res.json();
            this.setState({ weather: data, loading: false });
        } catch (e) {
            this.setState({ error: 'Failed to fetch weather', loading: false });
        }
    }

    handleSearch = async (e) => {
        if (e.key === 'Enter' && this.state.searchInput.trim()) {
            this.setState({ loading: true });
            try {
                // simple geocoding using open-meteo geocoding api
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${this.state.searchInput}&count=1&language=en&format=json`);
                const geoData = await geoRes.json();

                if (geoData.results && geoData.results.length > 0) {
                    const { latitude, longitude, name, country } = geoData.results[0];
                    this.setState({ city: `${name}, ${country}`, searchInput: '' });
                    this.fetchWeather(latitude, longitude);
                } else {
                    this.setState({ error: 'City not found', loading: false });
                }
            } catch (e) {
                this.setState({ error: 'Search failed', loading: false });
            }
        }
    }

    getWeatherIcon(code) {
        // WMO Weather interpretation codes (WW)
        if (code === 0) return '☀️';
        if (code >= 1 && code <= 3) return '⛅';
        if (code >= 45 && code <= 48) return '🌫️';
        if (code >= 51 && code <= 67) return '🌧️';
        if (code >= 71 && code <= 77) return '❄️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code >= 95) return '⚡';
        return '🌈';
    }

    getDailyForecast = () => {
        if (!this.state.weather || !this.state.weather.daily) return [];
        const { time, temperature_2m_max, temperature_2m_min, weather_code } = this.state.weather.daily;

        return time.slice(0, 5).map((t, i) => ({
            date: new Date(t).toLocaleDateString('en-US', { weekday: 'short' }),
            max: Math.round(temperature_2m_max[i]),
            min: Math.round(temperature_2m_min[i]),
            icon: this.getWeatherIcon(weather_code[i])
        }));
    }

    render() {
        const { weather, loading, city, error, searchInput } = this.state;

        return (
            <div className="w-full h-full flex flex-col bg-gradient-to-br from-blue-400 to-blue-600 text-white font-sans select-none overflow-hidden relative">
                {/* Search Bar */}
                <div className="absolute top-4 left-4 right-4 z-10">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => this.setState({ searchInput: e.target.value })}
                        onKeyDown={this.handleSearch}
                        placeholder="Search City..."
                        className="w-full bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-full px-4 py-2 text-sm text-white placeholder-white placeholder-opacity-70 outline-none focus:bg-opacity-30 shadow-lg"
                    />
                </div>

                {loading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <div className="animate-spin text-4xl">☀️</div>
                    </div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center text-center p-4">
                        <p>{error}</p>
                    </div>
                ) : weather ? (
                    <>
                        {/* Main Weather */}
                        <div className="flex-grow flex flex-col items-center justify-center pt-10">
                            <h2 className="text-2xl font-light mb-1 shadow-sm">{city}</h2>
                            <div className="text-8xl mb-4 drop-shadow-md">{this.getWeatherIcon(weather.current.weather_code)}</div>
                            <h1 className="text-6xl font-bold mb-2 shadow-sm">{Math.round(weather.current.temperature_2m)}°</h1>
                            <p className="text-lg opacity-90">{this.getWeatherIcon(weather.current.weather_code) === '☀️' ? 'Sunny' : 'Cloudy'}</p>

                            <div className="flex gap-6 mt-8 p-4 bg-white bg-opacity-10 rounded-2xl backdrop-blur-md">
                                <div className="text-center">
                                    <span className="block text-xs opacity-70">Wind</span>
                                    <span className="font-semibold">{weather.current.wind_speed_10m} km/h</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xs opacity-70">Humidity</span>
                                    <span className="font-semibold">{weather.current.relative_humidity_2m}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Forecast */}
                        <div className="bg-white bg-opacity-20 backdrop-blur-lg p-4 rounded-t-3xl border-t border-white border-opacity-20">
                            <div className="flex justify-between items-center">
                                {this.getDailyForecast().map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className="text-xs opacity-80 font-medium">{day.date}</span>
                                        <span className="text-xl shadow-sm">{day.icon}</span>
                                        <span className="text-sm font-bold">{day.max}°</span>
                                        <span className="text-xs opacity-60">{day.min}°</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        )
    }
}

export const displayWeather = () => {
    return <Weather />;
};

export default Weather;
