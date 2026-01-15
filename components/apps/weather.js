
import React, { Component, createRef } from 'react';

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
            isDay: 1,
            containerWidth: 800, // Default width
            containerHeight: 600 // Default height
        };
        this.containerRef = createRef();
        this.canvasRef = createRef();
        this.animationFrameId = null;
        this.particles = [];
    }

    componentDidMount() {
        this.fetchWeather(11.0168, 76.9558); // Default Coimbatore

        // Use ResizeObserver for container-aware responsiveness
        this.resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                this.setState({ containerWidth: width, containerHeight: height }, () => {
                    this.initCanvas();
                });
            }
        });

        if (this.containerRef.current) {
            this.resizeObserver.observe(this.containerRef.current);
        }
    }

    componentWillUnmount() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.weatherCode !== this.state.weatherCode || prevState.isDay !== this.state.isDay) {
            this.initCanvas();
        }
    }

    handleResize = () => {
        this.initCanvas();
    }

    initCanvas = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const { weatherCode, isDay } = this.state;
        const ctx = canvas.getContext('2d');

        // Set canvas to full resolution
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        this.particles = [];
        const w = rect.width;
        const h = rect.height;

        // Initialize particles based on weather
        // Rain: 51-67, 80-82, 95+
        if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || weatherCode >= 95) {
            const count = (weatherCode >= 65 || weatherCode >= 95) ? 400 : 100;
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    speed: Math.random() * 15 + 10,
                    length: Math.random() * 20 + 10,
                    opacity: Math.random() * 0.5 + 0.1,
                    type: 'rain'
                });
            }
        }

        // Snow: 71-77, 85-86
        else if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
            const count = 200;
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    speed: Math.random() * 2 + 0.5,
                    radius: Math.random() * 3 + 1,
                    opacity: Math.random() * 0.8 + 0.2,
                    type: 'snow'
                });
            }
        }

        // Stars: Clear Night (0-2)
        else if (!isDay && weatherCode <= 2) {
            const count = 150;
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    radius: Math.random() * 1.5,
                    opacity: Math.random(),
                    twinkleSpeed: Math.random() * 0.05,
                    type: 'star'
                });
            }
        }

        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animate(ctx, rect.width, rect.height);
    }

    animate = (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);

        this.particles.forEach(p => {
            if (p.type === 'rain') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + p.length);
                ctx.strokeStyle = `rgba(174, 194, 224, ${p.opacity})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                p.y += p.speed;
                if (p.y > height) {
                    p.y = -p.length;
                    p.x = Math.random() * width;
                }
            } else if (p.type === 'snow') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();

                p.y += p.speed;
                p.x += Math.sin(p.y * 0.01) * 0.5; // Swaying effect

                if (p.y > height) {
                    p.y = -5;
                    p.x = Math.random() * width;
                }
            } else if (p.type === 'star') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                // Twinkle
                p.opacity += p.twinkleSpeed;
                if (p.opacity > 1 || p.opacity < 0.2) p.twinkleSpeed *= -1;

                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();
            }
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate(ctx, width, height));
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
            }, () => {
                // Init canvas after state update
                setTimeout(this.initCanvas, 100);
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

    // New 3D/Realistic Icon rendering using SVG gradients and filters
    renderWeatherIcon = (code, size = 'large') => {
        const isSmall = size === 'small';
        const dim = isSmall ? 40 : 120;

        // Common Definitions for SVG gradients
        const defs = (
            <defs>
                <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#FF4500" />
                </linearGradient>
                <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        );

        // Sun
        if (code === 0 || code === 1) {
            return (
                <svg width={dim} height={dim} viewBox="0 0 100 100" className="drop-shadow-lg">
                    {defs}
                    <circle cx="50" cy="50" r="25" fill="url(#sunGrad)" filter="url(#glow)">
                        <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="3s" repeatCount="indefinite" additive="sum" />
                    </circle>
                    <g>
                        {[...Array(8)].map((_, i) => (
                            <line key={i} x1="50" y1="50" x2="50" y2="10" stroke="#FF8C00" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45} 50 50)`}>
                                <animate attributeName="opacity" values="1;0.5;1" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                            </line>
                        ))}
                        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
                    </g>
                </svg>
            );
        }

        // Cloud / Part Cloud
        if (code === 2 || code === 3 || (code >= 45 && code <= 48)) {
            return (
                <svg width={dim} height={dim} viewBox="0 0 100 100" className="drop-shadow-lg">
                    {defs}
                    {code === 2 && <circle cx="65" cy="35" r="15" fill="url(#sunGrad)" />}
                    <path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 20,-10 a20,20 0 0,1 20,10 a20,20 0 0,1 15,35 z" fill="url(#cloudGrad)" filter="url(#glow)">
                        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="4s" repeatCount="indefinite" />
                    </path>
                </svg>
            );
        }

        // Rain
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
            return (
                <svg width={dim} height={dim} viewBox="0 0 100 100" className="drop-shadow-xl">
                    {defs}
                    <path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 20,-10 a20,20 0 0,1 20,10 a20,20 0 0,1 15,35 z" fill="#94a3b8" filter="url(#glow)" />
                    <g fill="#3b82f6" opacity="0.8">
                        <ellipse cx="35" cy="70" rx="2" ry="5">
                            <animate attributeName="cy" values="70;90" dur="0.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="0.8s" repeatCount="indefinite" />
                        </ellipse>
                        <ellipse cx="50" cy="70" rx="2" ry="5">
                            <animate attributeName="cy" values="70;90" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
                        </ellipse>
                        <ellipse cx="65" cy="70" rx="2" ry="5">
                            <animate attributeName="cy" values="70;90" dur="0.8s" begin="0.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="0.8s" begin="0.5s" repeatCount="indefinite" />
                        </ellipse>
                    </g>
                </svg>
            );
        }

        // Thunder
        if (code >= 95) {
            return (
                <svg width={dim} height={dim} viewBox="0 0 100 100" className="drop-shadow-xl">
                    {defs}
                    <path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 20,-10 a20,20 0 0,1 20,10 a20,20 0 0,1 15,35 z" fill="#475569" filter="url(#glow)" />
                    <path d="M50,60 L40,80 L55,80 L45,95" stroke="#FCD34D" strokeWidth="3" fill="none">
                        <animate attributeName="opacity" values="0;1;0;1;0" dur="2s" repeatCount="indefinite" />
                    </path>
                </svg>
            );
        }

        // Snow / Default
        return (
            <svg width={dim} height={dim} viewBox="0 0 100 100" className="drop-shadow-lg">
                {defs}
                <path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 20,-10 a20,20 0 0,1 20,10 a20,20 0 0,1 15,35 z" fill="url(#cloudGrad)" filter="url(#glow)" />
                <g fill="#fff" fontSize="15">
                    <text x="35" y="75">❄<animate attributeName="y" values="75;95" dur="2s" repeatCount="indefinite" /></text>
                    <text x="55" y="75">❄<animate attributeName="y" values="75;95" dur="2s" begin="0.5s" repeatCount="indefinite" /></text>
                </g>
            </svg>
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
        const { weather, loading, city, error, searchInput, weatherCode, isDay, containerWidth, containerHeight } = this.state;

        // Responsiveness Flags
        const isSmall = containerWidth < 550;
        const isTiny = containerWidth < 350;
        const isShort = containerHeight < 450;

        // Dynamic background colors
        let bgGradient = "from-blue-400 to-blue-600";
        if (weatherCode >= 95) bgGradient = "from-slate-800 to-slate-900"; // Thunderstorm
        else if (weatherCode >= 51) bgGradient = "from-slate-600 to-slate-800"; // Rain
        else if (weatherCode >= 45) bgGradient = "from-slate-500 to-slate-600"; // Fog
        else if (weatherCode > 2 && isDay) bgGradient = "from-blue-300 to-gray-400"; // Overcast Day
        else if (weatherCode > 2 && !isDay) bgGradient = "from-gray-800 to-gray-900"; // Overcast Night
        else if (!isDay) bgGradient = "from-indigo-900 via-purple-900 to-slate-900"; // Clear Night
        else bgGradient = "from-sky-400 to-blue-500"; // Clear Day

        return (
            <div ref={this.containerRef} className={`w-full h-full flex flex-col bg-gradient-to-b ${bgGradient} text-white font-sans select-none overflow-hidden relative transition-all duration-1000`}>

                {/* === REALISTIC CANVAS Background Animation === */}
                <canvas
                    ref={this.canvasRef}
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{ opacity: 0.6 }}
                />

                {/* CSS Based Clouds Layer (Better for simple shapes than canvas) */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {weatherCode > 0 && [...Array(4)].map((_, i) => (
                        <div key={i} className="absolute blur-xl opacity-40 bg-white rounded-full animate-drift"
                            style={{
                                width: '300px', height: '100px',
                                top: `${10 + i * 20}%`,
                                left: `-${(i + 1) * 20}%`,
                                animationDuration: `${30 + i * 10}s`,
                                animationDelay: `${i * 2}s`
                            }}></div>
                    ))}
                    {/* Fog Overlay */}
                    {(weatherCode === 45 || weatherCode === 48) && (
                        <div className="absolute inset-0 bg-white opacity-20 animate-pulse-slow blur-3xl"></div>
                    )}
                </div>

                {/* Navbar / Search */}
                <div className="relative z-20 flex justify-between items-center p-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-medium tracking-wide drop-shadow-md">{city}</span>
                        <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10">📍 Live</span>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => this.setState({ searchInput: e.target.value })}
                            onKeyDown={this.handleSearch}
                            placeholder="Find city..."
                            className="w-40 focus:w-64 transition-all duration-300 bg-black bg-opacity-20 border border-white border-opacity-20 rounded-full px-4 py-1.5 text-sm text-white placeholder-white placeholder-opacity-60 outline-none focus:bg-opacity-30 backdrop-blur-md"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-opacity-60 text-white pointer-events-none">🔍</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-grow flex items-center justify-center relative z-10 animate-pulse">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="opacity-70">Forecasting...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center text-center p-4 relative z-10">
                        <p className="text-xl text-red-200 bg-red-900 bg-opacity-20 px-4 py-2 rounded-lg border border-red-500/30">{error}</p>
                    </div>
                ) : weather ? (
                    <>
                        {/* Main Content */}
                        <div className="flex-grow flex flex-col items-center justify-center relative z-10 -mt-10">

                            {/* Weather Icon & Temp */}
                            <div className={`flex flex-col items-center transition-all duration-500 ${isShort ? 'scale-75' : ''}`}>
                                <div className="mb-2 transition-transform hover:scale-110 duration-500">
                                    {this.renderWeatherIcon(weather.current.weather_code, isSmall ? 'small' : 'large')}
                                </div>
                                <h1 className={`${isSmall ? 'text-6xl' : 'text-8xl md:text-9xl'} font-thin tracking-tighter drop-shadow-lg relative transition-all font-mono`}>
                                    {Math.round(weather.current.temperature_2m)}°
                                </h1>
                                <p className={`${isSmall ? 'text-lg' : 'text-2xl md:text-3xl'} font-light opacity-90 mt-2 tracking-widest uppercase text-shadow-sm`}>
                                    {this.getTypeStr(weather.current.weather_code)}
                                </p>
                            </div>

                            {/* Detailed Stats */}
                            {!isShort && (
                                <div className={`flex ${isSmall ? 'gap-6 mt-8' : 'gap-16 mt-12'}`}>
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white bg-opacity-10 flex items-center justify-center backdrop-blur-sm border border-white border-opacity-10 shadow-lg group-hover:bg-opacity-20 transition-all">
                                            💨
                                        </div>
                                        <div className="flex flex-col items-center text-shadow">
                                            <span className="text-sm font-semibold">{weather.current.wind_speed_10m} km/h</span>
                                            <span className="text-[10px] opacity-70 uppercase tracking-wider">Wind</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white bg-opacity-10 flex items-center justify-center backdrop-blur-sm border border-white border-opacity-10 shadow-lg group-hover:bg-opacity-20 transition-all">
                                            💧
                                        </div>
                                        <div className="flex flex-col items-center text-shadow">
                                            <span className="text-sm font-semibold">{weather.current.relative_humidity_2m}%</span>
                                            <span className="text-xs opacity-70 uppercase tracking-wider">Humidity</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Forecast Strip */}
                        <div className="relative z-20 bg-black bg-opacity-20 backdrop-blur-xl border-t border-white border-opacity-10 p-6">
                            <div className="flex justify-between items-center max-w-2xl mx-auto overflow-x-auto pb-2 scrollbar-none gap-4 px-2">
                                {this.getDailyForecast().map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 min-w-[60px] p-2 rounded-xl transition-colors cursor-default hover:bg-white/5 flex-shrink-0">
                                        <span className="text-xs font-bold opacity-70 uppercase whitespace-nowrap">{day.date}</span>
                                        <div className="my-1 transform scale-90">
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

                <style jsx>{`
                    @keyframes drift { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
                    .animate-drift { animation: drift 40s linear infinite; }
                    .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                    @keyframes pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.4; } }
                `}</style>
            </div>
        )
    }
}

export const displayWeather = () => {
    return <Weather />;
};

export default Weather;
