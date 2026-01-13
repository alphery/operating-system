
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Types
interface SettingsProps {
    currBgImgName?: string;
    bg_image_name?: string;
    changeBackgroundImage?: (video: string) => void;
    [key: string]: any;
}

interface SettingsState {
    // Appearance
    wallpaper: string;
    darkMode: boolean;
    accentColor: string;
    iconSize: 'small' | 'medium' | 'large';
    transparency: boolean;
    theme: 'dark' | 'light' | 'auto';
    // Display
    brightness: number;
    nightLight: boolean;
    fontSize: 'small' | 'medium' | 'large';
    scaleFactor: number;
    // Sound
    volume: number;
    notificationSounds: boolean;
    alertVolume: number;
    muteSound: boolean;
    // System
    animations: boolean;
    autoUpdate: boolean;
    showDesktopIcons: boolean;
    doubleClickSpeed: 'slow' | 'medium' | 'fast';
    // Privacy
    locationServices: boolean;
    analytics: boolean;
    // Network
    wifiEnabled: boolean;
    bluetoothEnabled: boolean;
    // Power
    powerMode: 'power-saver' | 'balanced' | 'performance';
    screenTimeout: number; // minutes
    // Accessibility
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
    largeText: boolean;
    cursorSize: 'small' | 'medium' | 'large';
    // Notifications
    doNotDisturb: boolean;
    showPreviews: boolean;
    notificationPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    // Keyboard
    keyboardLayout: string;
    enableShortcuts: boolean;
    // Language & Region
    language: string;
    timeFormat: '12h' | '24h';
    dateFormat: string;
    temperature: 'celsius' | 'fahrenheit';
}

interface Section {
    id: SectionId;
    label: string;
    icon: string;
}

type SectionId = 'appearance' | 'display' | 'sound' | 'notifications' | 'network' | 'power' | 'accessibility' | 'keyboard' | 'language' | 'system' | 'privacy' | 'about';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Settings App Crash:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-gray-400 mb-4">The Settings app encountered an error.</p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('system_settings');
                            window.location.reload();
                        }}
                        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                        Reset Settings & Reload
                    </button>
                    <details className="mt-8 text-left bg-black bg-opacity-50 p-4 rounded text-xs font-mono max-w-full overflow-auto text-red-400">
                        <summary className="cursor-pointer mb-2">Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export function Settings(props: SettingsProps) {

    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<SectionId>('appearance');

    // Default settings object
    const getDefaultSettings = (): SettingsState => ({
        // Appearance
        wallpaper: props.currBgImgName || props.bg_image_name || 'wall-8',
        darkMode: true,
        accentColor: '#E95420',
        iconSize: 'medium',
        transparency: true,
        theme: 'dark',
        // Display
        brightness: 100,
        nightLight: false,
        fontSize: 'medium',
        scaleFactor: 100,
        // Sound
        volume: 70,
        notificationSounds: true,
        alertVolume: 80,
        muteSound: false,
        // System
        animations: true,
        autoUpdate: true,
        showDesktopIcons: true,
        doubleClickSpeed: 'medium',
        // Privacy
        locationServices: false,
        analytics: false,
        // Network
        wifiEnabled: true,
        bluetoothEnabled: false,
        // Power
        powerMode: 'balanced',
        screenTimeout: 10,
        // Accessibility
        highContrast: false,
        reduceMotion: false,
        screenReader: false,
        largeText: false,
        cursorSize: 'medium',
        // Notifications
        doNotDisturb: false,
        showPreviews: true,
        notificationPosition: 'top-right',
        // Keyboard
        keyboardLayout: 'us',
        enableShortcuts: true,
        // Language & Region
        language: 'en-US',
        timeFormat: '12h',
        dateFormat: 'MM/DD/YYYY',
        temperature: 'celsius',
    });

    // Initialize settings from localStorage or defaults
    const [settings, setSettings] = useState<SettingsState>(() => {
        try {
            const saved = localStorage.getItem('system_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all keys exist
                return { ...getDefaultSettings(), ...parsed };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return getDefaultSettings();
    });

    const wallpapers: Record<string, string> = {
        "wall-1": "./images/wallpapers/wallpaper1.jpg",
        "wall-2": "./images/wallpapers/wallpaper2.jpg",
        "wall-4": "./images/wallpapers/wallpaper4.jpg",
        "wall-5": "./images/wallpapers/wallpaper5.jpg",
        "wall-7": "./images/wallpapers/wallpaper7.jpg",
        "wall-8": "./images/wallpapers/wallpaper8.jpg",
    };

    const accentColors = [
        { name: 'Ubuntu Orange', color: '#E95420' },
        { name: 'Blue', color: '#3584E4' },
        { name: 'Purple', color: '#9A348E' },
        { name: 'Green', color: '#26A269' },
        { name: 'Red', color: '#E01B24' },
        { name: 'Pink', color: '#F66151' },
        { name: 'Teal', color: '#0E8A8A' },
        { name: 'Yellow', color: '#F5C211' },
    ];

    // Save settings whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('system_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, [settings]);

    const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        applySettings(key, value);
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const applySettings = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        const root = document.documentElement;

        switch (key) {
            case 'wallpaper':
                if (props.changeBackgroundImage && value !== props.currBgImgName) {
                    props.changeBackgroundImage(value as string);
                }
                break;

            case 'accentColor':
                root.style.setProperty('--accent-color', value as string);
                root.style.setProperty('--ub-orange', value as string);
                break;

            case 'theme':
                if (value === 'dark') {
                    document.body.classList.add('dark-mode');
                    document.body.classList.remove('light-mode');
                    root.style.setProperty('--bg-primary', '#1e1e1e');
                    root.style.setProperty('--bg-secondary', '#2d2d2d');
                    root.style.setProperty('--text-primary', '#ffffff');
                    root.style.setProperty('--text-secondary', '#b0b0b0');
                } else if (value === 'light') {
                    document.body.classList.remove('dark-mode');
                    document.body.classList.add('light-mode');
                    root.style.setProperty('--bg-primary', '#ffffff');
                    root.style.setProperty('--bg-secondary', '#f5f5f5');
                    root.style.setProperty('--text-primary', '#000000');
                    root.style.setProperty('--text-secondary', '#666666');
                } else if (value === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                        document.body.classList.add('dark-mode');
                        document.body.classList.remove('light-mode');
                        root.style.setProperty('--bg-primary', '#1e1e1e');
                        root.style.setProperty('--bg-secondary', '#2d2d2d');
                        root.style.setProperty('--text-primary', '#ffffff');
                        root.style.setProperty('--text-secondary', '#b0b0b0');
                    } else {
                        document.body.classList.remove('dark-mode');
                        document.body.classList.add('light-mode');
                        root.style.setProperty('--bg-primary', '#ffffff');
                        root.style.setProperty('--bg-secondary', '#f5f5f5');
                        root.style.setProperty('--text-primary', '#000000');
                        root.style.setProperty('--text-secondary', '#666666');
                    }
                }
                break;

            case 'darkMode':
                if (value) {
                    document.body.classList.add('dark-mode');
                    document.body.classList.remove('light-mode');
                    root.style.setProperty('--bg-primary', '#1e1e1e');
                    root.style.setProperty('--bg-secondary', '#2d2d2d');
                } else {
                    document.body.classList.remove('dark-mode');
                    document.body.classList.add('light-mode');
                    root.style.setProperty('--bg-primary', '#ffffff');
                    root.style.setProperty('--bg-secondary', '#f5f5f5');
                }
                break;

            case 'transparency':
                if (value) {
                    document.body.classList.add('transparency-enabled');
                    root.style.setProperty('--window-transparency', '0.85');
                    root.style.setProperty('--backdrop-blur', '12px');
                    root.style.setProperty('--panel-opacity', '0.8');
                } else {
                    document.body.classList.remove('transparency-enabled');
                    root.style.setProperty('--window-transparency', '1');
                    root.style.setProperty('--backdrop-blur', '0px');
                    root.style.setProperty('--panel-opacity', '1');
                }
                break;

            case 'brightness':
                const brightnessVal = value as number;
                root.style.setProperty('--brightness', `${brightnessVal}%`);
                document.body.style.filter = `brightness(${brightnessVal / 100})`;
                break;

            case 'fontSize':
                const fontSizes = { small: '14px', medium: '16px', large: '18px' };
                root.style.setProperty('--base-font-size', fontSizes[value as 'small' | 'medium' | 'large']);
                break;

            case 'scaleFactor':
                root.style.setProperty('--scale-factor', `${(value as number) / 100}`);
                break;

            case 'iconSize':
                const iconSizes = { small: '32px', medium: '48px', large: '64px' };
                root.style.setProperty('--icon-size', iconSizes[value as 'small' | 'medium' | 'large']);
                break;

            case 'animations':
                root.style.setProperty('--transition-duration', value ? '0.2s' : '0s');
                document.body.classList.toggle('no-animations', !value);
                break;

            case 'nightLight':
                if (value) {
                    root.style.setProperty('--night-light-filter', 'sepia(0.3) saturate(0.7)');
                    document.body.style.filter += ' sepia(0.3) saturate(0.7)';
                } else {
                    root.style.setProperty('--night-light-filter', 'none');
                    document.body.style.filter = document.body.style.filter.replace('sepia(0.3) saturate(0.7)', '');
                }
                break;

            case 'volume':
                localStorage.setItem('system_volume', String(value));
                window.dispatchEvent(new CustomEvent('system_volume_change', { detail: value }));
                break;

            case 'wifiEnabled':
                localStorage.setItem('system_wifi', String(value));
                window.dispatchEvent(new CustomEvent('system_wifi_change', { detail: value }));
                break;

            case 'bluetoothEnabled':
                localStorage.setItem('system_bluetooth', String(value));
                window.dispatchEvent(new CustomEvent('system_bluetooth_change', { detail: value }));
                break;

            case 'highContrast':
                if (value) {
                    document.body.classList.add('high-contrast-mode');
                    root.style.setProperty('--contrast-multiplier', '1.5');
                } else {
                    document.body.classList.remove('high-contrast-mode');
                    root.style.setProperty('--contrast-multiplier', '1');
                }
                break;

            case 'reduceMotion':
                if (value) {
                    document.body.classList.add('reduce-motion');
                    root.style.setProperty('--transition-duration', '0s');
                    root.style.setProperty('--animation-duration', '0s');
                } else {
                    document.body.classList.remove('reduce-motion');
                    root.style.setProperty('--transition-duration', '0.2s');
                    root.style.setProperty('--animation-duration', '0.3s');
                }
                break;

            case 'screenReader':
                localStorage.setItem('system_screen_reader', String(value));
                if (value) {
                    document.body.setAttribute('aria-live', 'polite');
                } else {
                    document.body.removeAttribute('aria-live');
                }
                break;

            case 'largeText':
                if (value) {
                    root.style.setProperty('--base-font-size', '20px');
                    document.body.classList.add('large-text-mode');
                } else {
                    root.style.setProperty('--base-font-size', '16px');
                    document.body.classList.remove('large-text-mode');
                }
                break;

            case 'cursorSize':
                const cursorSizes = {
                    small: '1',
                    medium: '1.5',
                    large: '2'
                };
                const size = value as 'small' | 'medium' | 'large';
                root.style.setProperty('--cursor-size', cursorSizes[size] || '1');
                // Note: Actual cursor change with SVG data URI might need specific image handling, keeping simple for now
                break;

            case 'muteSound':
                localStorage.setItem('system_mute', String(value));
                window.dispatchEvent(new CustomEvent('system_mute_change', { detail: value }));
                break;

            case 'alertVolume':
                localStorage.setItem('system_alert_volume', String(value));
                break;

            case 'doNotDisturb':
                localStorage.setItem('system_dnd', String(value));
                window.dispatchEvent(new CustomEvent('system_dnd_change', { detail: value }));
                break;

            case 'showPreviews':
            case 'notificationPosition':
                localStorage.setItem(`system_${key}`, String(value));
                window.dispatchEvent(new CustomEvent(`system_${key}_change`, { detail: value }));
                break;

            default:
                // For any other settings, just store in localStorage
                if (typeof value !== 'undefined') {
                    localStorage.setItem(`system_${key}`, typeof value === 'object' ? JSON.stringify(value) : String(value));
                }
                break;
        }
    };

    // Apply all settings on mount
    useEffect(() => {
        (Object.keys(settings) as Array<keyof SettingsState>).forEach(key => {
            applySettings(key, settings[key]);
        });
    }, []);

    const sections: Section[] = [
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'display', label: 'Display', icon: '🖥️' },
        { id: 'sound', label: 'Sound', icon: '🔊' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'network', label: 'Network', icon: '📡' },
        { id: 'power', label: 'Power', icon: '🔋' },
        { id: 'accessibility', label: 'Accessibility', icon: '♿' },
        { id: 'keyboard', label: 'Keyboard', icon: '⌨️' },
        { id: 'language', label: 'Language & Region', icon: '🌍' },
        { id: 'system', label: 'System', icon: '⚙️' },
        { id: 'privacy', label: 'Privacy', icon: '🔒' },
        { id: 'about', label: 'About', icon: 'ℹ️' },
    ];

    const renderAppearanceSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Wallpaper</h3>
                <div className="grid grid-cols-3 gap-4">
                    {Object.keys(wallpapers).map((name) => (
                        <div
                            key={name}
                            onClick={() => updateSetting('wallpaper', name)}
                            className={`cursor-pointer rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 ${settings.wallpaper === name ? 'border-blue-500 ring-4 ring-blue-500 ring-opacity-50' : 'border-transparent hover:border-gray-600'
                                }`}
                            style={{
                                backgroundImage: `url(${wallpapers[name]})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                height: '120px'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'light', 'auto'] as const).map((theme) => (
                        <button
                            key={theme}
                            onClick={() => updateSetting('theme', theme)}
                            className={`px-6 py-3 rounded-lg font-medium capitalize transition-all ${settings.theme === theme
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {theme === 'dark' && '🌙'} {theme === 'light' && '☀️'} {theme === 'auto' && '🔄'} {theme}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Transparency Effects</h3>
                    <p className="text-sm text-gray-400">Enable blur and transparency in UI</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.transparency}
                        onChange={(e) => updateSetting('transparency', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Accent Color</h3>
                <div className="flex gap-3 flex-wrap">
                    {accentColors.map((accent) => (
                        <div
                            key={accent.color}
                            onClick={() => updateSetting('accentColor', accent.color)}
                            className={`w-14 h-14 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center ${settings.accentColor === accent.color ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900' : ''
                                }`}
                            style={{ backgroundColor: accent.color }}
                            title={accent.name}
                        >
                            {settings.accentColor === accent.color && <span className="text-white text-xl">✓</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Icon Size</h3>
                <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                            key={size}
                            onClick={() => updateSetting('iconSize', size)}
                            className={`px-6 py-2 rounded-lg font-medium capitalize transition-all ${settings.iconSize === size
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderDisplaySettings = () => (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">Brightness</h3>
                    <span className="text-gray-400 font-mono">{settings.brightness}%</span>
                </div>
                <input
                    type="range"
                    min="20"
                    max="100"
                    value={settings.brightness}
                    onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Night Light</h3>
                    <p className="text-sm text-gray-400">Reduces blue light in the evening</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.nightLight}
                        onChange={(e) => updateSetting('nightLight', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Font Size</h3>
                <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                            key={size}
                            onClick={() => updateSetting('fontSize', size)}
                            className={`flex-1 px-6 py-2 rounded-lg font-medium capitalize transition-all ${settings.fontSize === size
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">UI Scale</h3>
                    <span className="text-gray-400 font-mono">{settings.scaleFactor}%</span>
                </div>
                <input
                    type="range"
                    min="75"
                    max="150"
                    step="25"
                    value={settings.scaleFactor}
                    onChange={(e) => updateSetting('scaleFactor', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>75%</span>
                    <span>100%</span>
                    <span>125%</span>
                    <span>150%</span>
                </div>
            </div>
        </div>
    );

    const renderSoundSettings = () => (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">System Volume</h3>
                    <span className="text-gray-400 font-mono">{settings.volume}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume}
                    onChange={(e) => updateSetting('volume', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">Alert Volume</h3>
                    <span className="text-gray-400 font-mono">{settings.alertVolume}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.alertVolume}
                    onChange={(e) => updateSetting('alertVolume', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Notification Sounds</h3>
                    <p className="text-sm text-gray-400">Play sounds for notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.notificationSounds}
                        onChange={(e) => updateSetting('notificationSounds', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>
    );

    const renderNetworkSettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📶</span>
                    <div>
                        <h3 className="text-white font-medium">Wi-Fi</h3>
                        <p className="text-sm text-gray-400">Connected to Local Network</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.wifiEnabled}
                        onChange={(e) => updateSetting('wifiEnabled', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📘</span>
                    <div>
                        <h3 className="text-white font-medium">Bluetooth</h3>
                        <p className="text-sm text-gray-400">Discoverable</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.bluetoothEnabled}
                        onChange={(e) => updateSetting('bluetoothEnabled', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>
    );

    const renderPowerSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Power Mode</h3>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'power-saver', label: 'Power Saver', icon: '🍃' },
                        { id: 'balanced', label: 'Balanced', icon: '⚖️' },
                        { id: 'performance', label: 'Performance', icon: '⚡' }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => updateSetting('powerMode', mode.id as any)}
                            className={`px-4 py-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${settings.powerMode === mode.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            <span className="text-2xl">{mode.icon}</span>
                            <span className="text-xs">{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Screen Timeout</h3>
                <select
                    value={settings.screenTimeout}
                    onChange={(e) => updateSetting('screenTimeout', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={0}>Never</option>
                </select>
            </div>
        </div>
    );

    const renderSystemSettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Animations</h3>
                    <p className="text-sm text-gray-400">Enable UI animations and transitions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.animations}
                        onChange={(e) => updateSetting('animations', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Show Desktop Icons</h3>
                    <p className="text-sm text-gray-400">Display icons on desktop</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.showDesktopIcons}
                        onChange={(e) => updateSetting('showDesktopIcons', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Auto Updates</h3>
                    <p className="text-sm text-gray-400">Automatically check for system updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.autoUpdate}
                        onChange={(e) => updateSetting('autoUpdate', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Double-Click Speed</h3>
                <div className="flex gap-2">
                    {(['slow', 'medium', 'fast'] as const).map((speed) => (
                        <button
                            key={speed}
                            onClick={() => updateSetting('doubleClickSpeed', speed)}
                            className={`flex-1 px-6 py-2 rounded-lg font-medium capitalize transition-all ${settings.doubleClickSpeed === speed
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {speed}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <button
                    onClick={() => {
                        if (confirm('Reset all settings to defaults?')) {
                            localStorage.removeItem('system_settings');
                            window.location.reload();
                        }
                    }}
                    className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-medium transition-colors"
                >
                    Reset All Settings
                </button>
            </div>
        </div>
    );

    const renderPrivacySettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Location Services</h3>
                    <p className="text-sm text-gray-400">Allow apps to access your location</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.locationServices}
                        onChange={(e) => updateSetting('locationServices', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Analytics</h3>
                    <p className="text-sm text-gray-400">Send anonymous usage data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.analytics}
                        onChange={(e) => updateSetting('analytics', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <button
                    onClick={() => {
                        if (confirm('This will clear all browsing data, cache, and cookies. Continue?')) {
                            localStorage.clear();
                            alert('All data cleared! Page will reload.');
                            window.location.reload();
                        }
                    }}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
                >
                    Clear All Data
                </button>
            </div>
        </div>
    );

    const renderAboutSettings = () => (
        <div className="space-y-4">
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 text-center">
                <div className="text-6xl mb-4">💻</div>
                <h2 className="text-2xl font-bold text-white mb-2">Alphery OS</h2>
                <p className="text-gray-400 mb-4">Version 1.0.0</p>
                <div className="space-y-2 text-sm text-gray-300">
                    <p>Built with React & Next.js</p>
                    <p>Powered by Firebase</p>
                    {user && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="font-medium">Logged in as:</p>
                            <p className="text-gray-400">{user.email || user.displayName}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">System Information</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Processor</span>
                        <span className="text-white">{navigator.hardwareConcurrency || 4} Cores</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Memory</span>
                        <span className="text-white">{(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '16 GB'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Browser</span>
                        <span className="text-white">{(navigator as any).userAgentData?.brands?.[0]?.brand || 'Modern Browser'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Platform</span>
                        <span className="text-white">{navigator.platform}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Screen</span>
                        <span className="text-white">{window.screen.width} × {window.screen.height}</span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">Storage</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">System Settings</span>
                        <span className="text-white">{Math.round(JSON.stringify(settings).length / 1024)} KB</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">23% of local storage used</p>
                </div>
            </div>
        </div>
    );

    const renderNotificationsSettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🔕</span>
                    <div>
                        <h3 className="text-white font-medium">Do Not Disturb</h3>
                        <p className="text-sm text-gray-400">Silence all notifications</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.doNotDisturb}
                        onChange={(e) => updateSetting('doNotDisturb', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Show Previews</h3>
                    <p className="text-sm text-gray-400">Display notification content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.showPreviews}
                        onChange={(e) => updateSetting('showPreviews', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Notification Position</h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'top-right', label: 'Top Right', icon: '↗️' },
                        { id: 'top-left', label: 'Top Left', icon: '↖️' },
                        { id: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
                        { id: 'bottom-left', label: 'Bottom Left', icon: '↙️' }
                    ].map((pos) => (
                        <button
                            key={pos.id}
                            onClick={() => updateSetting('notificationPosition', pos.id as any)}
                            className={`px-4 py-3 rounded-lg font-medium transition-all ${settings.notificationPosition === pos.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            <span className="mr-2">{pos.icon}</span>{pos.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAccessibilitySettings = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">High Contrast</h3>
                    <p className="text-sm text-gray-400">Increase color contrast for better visibility</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.highContrast}
                        onChange={(e) => updateSetting('highContrast', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Reduce Motion</h3>
                    <p className="text-sm text-gray-400">Minimize animations and transitions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.reduceMotion}
                        onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Screen Reader</h3>
                    <p className="text-sm text-gray-400">Enable accessibility screen reader</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.screenReader}
                        onChange={(e) => updateSetting('screenReader', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Large Text</h3>
                    <p className="text-sm text-gray-400">Increase default text size system-wide</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.largeText}
                        onChange={(e) => updateSetting('largeText', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Cursor Size</h3>
                <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                            key={size}
                            onClick={() => updateSetting('cursorSize', size)}
                            className={`flex-1 px-6 py-2 rounded-lg font-medium capitalize transition-all ${settings.cursorSize === size
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderKeyboardSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Keyboard Layout</h3>
                <select
                    value={settings.keyboardLayout}
                    onChange={(e) => updateSetting('keyboardLayout', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="us">US English</option>
                    <option value="uk">UK English</option>
                    <option value="dvorak">Dvorak</option>
                    <option value="colemak">Colemak</option>
                    <option value="azerty">AZERTY (French)</option>
                    <option value="qwertz">QWERTZ (German)</option>
                </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-xl">
                <div>
                    <h3 className="text-white font-medium">Keyboard Shortcuts</h3>
                    <p className="text-sm text-gray-400">Enable system keyboard shortcuts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.enableShortcuts}
                        onChange={(e) => updateSetting('enableShortcuts', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Common Shortcuts</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Open Terminal</span>
                        <span className="text-white font-mono bg-gray-700 px-2 py-1 rounded">Ctrl + Alt + T</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Open Settings</span>
                        <span className="text-white font-mono bg-gray-700 px-2 py-1 rounded">Ctrl + ,</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400">Close Window</span>
                        <span className="text-white font-mono bg-gray-700 px-2 py-1 rounded">Alt + F4</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLanguageSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Language</h3>
                <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="en-US">English (United States)</option>
                    <option value="en-GB">English (United Kingdom)</option>
                    <option value="es-ES">Español (España)</option>
                    <option value="fr-FR">Français (France)</option>
                    <option value="de-DE">Deutsch (Deutschland)</option>
                    <option value="it-IT">Italiano (Italia)</option>
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="ja-JP">日本語 (Japanese)</option>
                    <option value="zh-CN">中文 (Chinese Simplified)</option>
                    <option value="hi-IN">हिन्दी (Hindi)</option>
                </select>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Time Format</h3>
                <div className="flex gap-2">
                    {(['12h', '24h'] as const).map((format) => (
                        <button
                            key={format}
                            onClick={() => updateSetting('timeFormat', format)}
                            className={`flex-1 px-6 py-2 rounded-lg font-medium transition-all ${settings.timeFormat === format
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {format === '12h' ? '12 Hour (2:30 PM)' : '24 Hour (14:30)'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Date Format</h3>
                <select
                    value={settings.dateFormat}
                    onChange={(e) => updateSetting('dateFormat', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (31 Dec 2024)</option>
                </select>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Temperature Unit</h3>
                <div className="flex gap-2">
                    {[
                        { id: 'celsius', label: 'Celsius (°C)' },
                        { id: 'fahrenheit', label: 'Fahrenheit (°F)' }
                    ].map((unit) => (
                        <button
                            key={unit.id}
                            onClick={() => updateSetting('temperature', unit.id as any)}
                            className={`flex-1 px-6 py-2 rounded-lg font-medium transition-all ${settings.temperature === unit.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {unit.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'appearance': return renderAppearanceSettings();
            case 'display': return renderDisplaySettings();
            case 'sound': return renderSoundSettings();
            case 'notifications': return renderNotificationsSettings();
            case 'network': return renderNetworkSettings();
            case 'power': return renderPowerSettings();
            case 'accessibility': return renderAccessibilitySettings();
            case 'keyboard': return renderKeyboardSettings();
            case 'language': return renderLanguageSettings();
            case 'system': return renderSystemSettings();
            case 'privacy': return renderPrivacySettings();
            case 'about': return renderAboutSettings();
            default: return renderAppearanceSettings();
        }
    };

    return (
        <ErrorBoundary>
            <div className="w-full h-full flex bg-gray-900 text-white select-none overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-gray-800 bg-opacity-50 backdrop-blur-xl border-r border-gray-700 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-xl font-bold mb-4">Settings</h2>
                        <div className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeSection === section.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-300 hover:bg-gray-700 hover:bg-opacity-50'
                                        }`}
                                >
                                    <span className="text-xl">{section.icon}</span>
                                    <span className="font-medium">{section.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8">
                        <h1 className="text-3xl font-bold mb-6 capitalize">{activeSection}</h1>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default Settings;

export const displaySettings = () => {
    // Assuming this function is called by the OS logic to render the app
    // We can't pass props here easily if it's just a static function call without context
    // But typically the OS renders the component associated with the app ID.
    // If this export is used as 'screen', we should export the component itself or a wrapper.
    return <Settings />;
};
