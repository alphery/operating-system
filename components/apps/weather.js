import React, { Component } from 'react';

export class Weather extends Component {
    constructor() {
        super();
        this.state = {
            loading: true,
            weather: null,
            city: 'Coimbatore, India',
            searchInput: '',
            error: null,
            weatherCode: 0,
            isDay: 1
        };
    }

    componentDidMount() {
        this.fetchWeather(11.0168, 76.9558); // Default Coimbatore
    }

    async fetchWeather(lat, lon) {
        this.setState({ loading: true, error: null });
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await res.json();
            this.setState({
                weather: data,
                loading: false,
                weatherCode: data.current.weather_code,
                isDay: data.current.is_day
            });
        } catch (e) {
            this.setState({ error: 'Failed to fetch weather', loading: false });
        }
    }

    handleSearch = async (e) => {
        if (e.key === 'Enter' && this.state.searchInput.trim()) {
            this.setState({ loading: true });
            try {
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

    // Helper to render realistic animated icons based on code
    renderWeatherIcon = (code, size = 'large') => {
        const isSmall = size === 'small';

        // Clear/Sunny
        if (code === 0 || code === 1) {
            return (
                <div className={`weather-icon sun ${isSmall ? 'small' : ''}`}>
                    <div className="sun-body"></div>
                    <div className="sun-rays"></div>
                </div>
            );
        }

        // Cloudy / Partly Cloudy
        if (code === 2 || code === 3 || (code >= 45 && code <= 48)) {
            return (
                <div className={`weather-icon cloud ${isSmall ? 'small' : ''}`}>
                    <div className="cloud-body"></div>
                    <div className="cloud-body-2"></div>
                    {code === 2 && <div className="sun-behind"></div>}
                </div>
            );
        }

        // Rain
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
            return (
                <div className={`weather-icon rain ${isSmall ? 'small' : ''}`}>
                    <div className="cloud-body dark"></div>
                    <div className="rain-drops">
                        <div className="drop d1"></div>
                        <div className="drop d2"></div>
                        <div className="drop d3"></div>
                    </div>
                </div>
            );
        }

        // Thunder
        if (code >= 95) {
            return (
                <div className={`weather-icon storm ${isSmall ? 'small' : ''}`}>
                    <div className="cloud-body dark"></div>
                    <div className="lightning"></div>
                </div>
            );
        }

        // Snow (fallback/default for other codes)
        return (
            <div className={`weather-icon snow ${isSmall ? 'small' : ''}`}>
                <div className="cloud-body"></div>
                <div className="snow-flakes">
                    <div className="flake f1">❄</div>
                    <div className="flake f2">❄</div>
                </div>
            </div>
        );
    }

    getTypeStr(code) {
        if (code === 0) return 'Clear Sky';
        if (code <= 3) return 'Partly Cloudy';
        if (code <= 48) return 'Foggy';
        if (code <= 67) return 'Raining';
        if (code <= 77) return 'Snowing';
        if (code <= 82) return 'Heavy Rain';
        if (code >= 95) return 'Thunderstorm';
        return 'Unknown';
    }

    getDailyForecast = () => {
        if (!this.state.weather || !this.state.weather.daily) return [];
        const { time, temperature_2m_max, temperature_2m_min, weather_code } = this.state.weather.daily;

        return time.slice(0, 5).map((t, i) => ({
            date: new Date(t).toLocaleDateString('en-US', { weekday: 'short' }),
            max: Math.round(temperature_2m_max[i]),
            min: Math.round(temperature_2m_min[i]),
            code: weather_code[i]
        }));
    }

    render() {
        const { weather, loading, city, error, searchInput, weatherCode, isDay } = this.state;

        // Dynamic background class
        let bgClass = "from-blue-400 to-blue-600";
        if (weatherCode > 3) bgClass = "from-gray-700 to-gray-900"; // Cloudy/Rainy
        if (weatherCode === 0 && !isDay) bgClass = "from-indigo-900 to-purple-900"; // Clear Night
        if (weatherCode === 0 && isDay) bgClass = "from-blue-400 to-sky-300"; // Clear Day

        return (
            <div className={`w-full h-full flex flex-col bg-gradient-to-br ${bgClass} text-white font-sans select-none overflow-hidden relative transition-all duration-1000`}>

                {/* Background Animation Layers */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {/* Floating Orbs for "Natural" feel */}
                    <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-yellow-200 opacity-5 rounded-full blur-[100px] animate-blob"></div>
                </div>

                {/* Navbar / Search */}
                <div className="relative z-20 flex justify-between items-center p-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-medium tracking-wide drop-shadow-md">{city}</span>
                        <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-md backdrop-blur-sm">📍 Live</span>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => this.setState({ searchInput: e.target.value })}
                            onKeyDown={this.handleSearch}
                            placeholder="Find city..."
                            className="w-40 focus:w-64 transition-all duration-300 bg-black bg-opacity-10 border border-white border-opacity-10 rounded-full px-4 py-1.5 text-sm text-white placeholder-white placeholder-opacity-60 outline-none focus:bg-opacity-20 backdrop-blur-md"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-opacity-60 text-white pointer-events-none">🔍</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-grow flex items-center justify-center relative z-10">
                        {this.renderWeatherIcon(0)}
                    </div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center text-center p-4 relative z-10">
                        <p className="text-xl text-red-200 bg-red-900 bg-opacity-20 px-4 py-2 rounded-lg">{error}</p>
                    </div>
                ) : weather ? (
                    <>
                        {/* Main Content */}
                        <div className="flex-grow flex flex-col items-center justify-center relative z-10 -mt-10">

                            {/* Animated Icon */}
                            <div className="scale-150 mb-4 drop-shadow-2xl">
                                {this.renderWeatherIcon(weather.current.weather_code)}
                            </div>

                            {/* Temperature */}
                            <div className="text-center relative">
                                <h1 className="text-9xl font-thin tracking-tighter drop-shadow-lg">
                                    {Math.round(weather.current.temperature_2m)}°
                                </h1>
                                <p className="text-2xl font-light opacity-90 mt-[-10px] tracking-widest uppercase">
                                    {this.getTypeStr(weather.current.weather_code)}
                                </p>
                            </div>

                            {/* Detailed Stats */}
                            <div className="flex gap-12 mt-12">
                                <div className="flex flex-col items-center gap-1 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white bg-opacity-10 flex items-center justify-center backdrop-blur-md border border-white border-opacity-20 shadow-lg group-hover:scale-110 transition-transform">
                                        💨
                                    </div>
                                    <span className="text-sm font-semibold">{weather.current.wind_speed_10m} km/h</span>
                                    <span className="text-xs opacity-60 uppercase tracking-wider">Wind</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white bg-opacity-10 flex items-center justify-center backdrop-blur-md border border-white border-opacity-20 shadow-lg group-hover:scale-110 transition-transform">
                                        💧
                                    </div>
                                    <span className="text-sm font-semibold">{weather.current.relative_humidity_2m}%</span>
                                    <span className="text-xs opacity-60 uppercase tracking-wider">Humidity</span>
                                </div>
                            </div>
                        </div>

                        {/* Forecast Strip */}
                        <div className="relative z-20 bg-black bg-opacity-20 backdrop-blur-xl border-t border-white border-opacity-10 p-6">
                            <div className="flex justify-between items-center max-w-lg mx-auto">
                                {this.getDailyForecast().map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 hover:bg-white hover:bg-opacity-5 p-2 rounded-xl transition-colors cursor-default">
                                        <span className="text-xs font-bold opacity-60 uppercase">{day.date}</span>
                                        <div className="scale-75">
                                            {this.renderWeatherIcon(day.code, 'small')}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold">{day.max}°</span>
                                            <span className="text-xs opacity-50">{day.min}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null}

                {/* Internal CSS for Animations */}
                <style jsx>{`
                    @keyframes pulse-slow {
                        0%, 100% { opacity: 0.1; transform: scale(1); }
                        50% { opacity: 0.2; transform: scale(1.1); }
                    }
                    .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }

                    /* === Weather Icons CSS === */
                    .weather-icon {
                        width: 100px;
                        height: 100px;
                        position: relative;
                        animation: float 6s ease-in-out infinite;
                    }
                    .weather-icon.small {
                        width: 40px;
                        height: 40px;
                    }

                    /* SUN */
                    .sun-body {
                        width: 50%;
                        height: 50%;
                        background: radial-gradient(circle, #fbbf24, #d97706);
                        border-radius: 50%;
                        position: absolute;
                        top: 25%;
                        left: 25%;
                        box-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
                    }
                    .sun-rays {
                        width: 100%;
                        height: 100%;
                        position: absolute;
                        animation: spin 20s linear infinite;
                    }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                    /* CLOUD */
                    .cloud-body {
                        width: 60%;
                        height: 35%;
                        background: #fff;
                        border-radius: 20px;
                        position: absolute;
                        top: 40%;
                        left: 20%;
                        z-index: 2;
                        opacity: 0.9;
                        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
                    }
                    .cloud-body::before {
                        content: '';
                        position: absolute;
                        width: 50%;
                        height: 140%;
                        background: #fff;
                        border-radius: 50%;
                        top: -70%;
                        left: 10%;
                    }
                    .cloud-body::after {
                        content: '';
                        position: absolute;
                        width: 40%;
                        height: 120%;
                        background: #fff;
                        border-radius: 50%;
                        top: -50%;
                        right: 15%;
                    }
                    .cloud.small .cloud-body { top: 30%; left: 20%; }

                    /* RAIN */
                    .cloud-body.dark {
                        background: #cbd5e1;
                    }
                    .cloud-body.dark::before, .cloud-body.dark::after {
                        background: #cbd5e1;
                    }
                    .rain-drops {
                         position: absolute;
                         top: 60%;
                         left: 0;
                         width: 100%;
                         height: 40%;
                         overflow: hidden;
                    }
                    .drop {
                        width: 4px;
                        height: 10px;
                        background: #60a5fa;
                        border-radius: 2px;
                        position: absolute;
                        top: -10px;
                        animation: rain 1s linear infinite;
                    }
                    .d1 { left: 40%; animation-delay: 0s; }
                    .d2 { left: 50%; animation-delay: 0.4s; }
                    .d3 { left: 60%; animation-delay: 0.2s; }

                    @keyframes rain {
                        0% { top: 0; opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }

                    /* SNOW */
                    .snow-flakes {
                         position: absolute;
                         top: 60%;
                         left: 20%;
                         width: 60%;
                    }
                    .flake {
                        color: white;
                        font-size: 1.5em;
                        position: absolute;
                        animation: snow 3s linear infinite;
                    }
                    .f1 { left: 10%; animation-delay: 0s; font-size: 10px; }
                    .f2 { left: 60%; animation-delay: 1.5s; font-size: 14px; }
                    @keyframes snow {
                        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(40px) rotate(360deg); opacity: 0; }
                    }

                `}</style>
            </div>
        )
    }
}

export const displayWeather = () => {
    return <Weather />;
};

export default Weather;
