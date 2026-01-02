import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Settings(props) {
    const { user, userData } = useAuth();
    const [activeSection, setActiveSection] = useState('appearance');

    // Initialize settings from localStorage or defaults
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('system_settings');
        return saved ? JSON.parse(saved) : {
            // Appearance
            wallpaper: props.currBgImgName || props.bg_image_name || 'wall-8',
            darkMode: true,
            accentColor: '#E95420',
            iconSize: 'medium',
            // Display
            brightness: 100,
            nightLight: false,
            fontSize: 'medium',
            scaleFactor: 100,
            // Sound
            volume: 70,
            notificationSounds: true,
            alertVolume: 80,
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
        };
    });

    const wallpapers = {
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
        localStorage.setItem('system_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };

            // Apply settings immediately
            applySettings(key, value);

            return newSettings;
        });
    };

    const applySettings = (key, value) => {
        const root = document.documentElement;

        switch (key) {
            case 'wallpaper':
                if (props.changeBackgroundImage) {
                    props.changeBackgroundImage(value);
                }
                break;

            case 'accentColor':
                root.style.setProperty('--accent-color', value);
                root.style.setProperty('--ub-orange', value);
                break;

            case 'brightness':
                root.style.setProperty('--brightness', `${value}%`);
                document.body.style.filter = `brightness(${value / 100})`;
                break;

            case 'fontSize':
                const fontSizes = { small: '14px', medium: '16px', large: '18px' };
                root.style.setProperty('--base-font-size', fontSizes[value]);
                break;

            case 'scaleFactor':
                root.style.setProperty('--scale-factor', `${value / 100}`);
                break;

            case 'iconSize':
                const iconSizes = { small: '32px', medium: '48px', large: '64px' };
                root.style.setProperty('--icon-size', iconSizes[value]);
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
                // Store for potential audio elements
                localStorage.setItem('system_volume', value);
                break;

            default:
                break;
        }
    };

    // Apply all settings on mount
    useEffect(() => {
        Object.keys(settings).forEach(key => {
            applySettings(key, settings[key]);
        });
    }, []);

    const sections = [
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'display', label: 'Display', icon: '🖥️' },
        { id: 'sound', label: 'Sound', icon: '🔊' },
        { id: 'network', label: 'Network', icon: '📡' },
        { id: 'power', label: 'Power', icon: '🔋' },
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
                    {['small', 'medium', 'large'].map((size) => (
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
                    {['small', 'medium', 'large'].map((size) => (
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
                    <div className="w-11 h-6 bg-gray-  700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                            onClick={() => updateSetting('powerMode', mode.id)}
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
                    {['slow', 'medium', 'fast'].map((speed) => (
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
                            <p className="text-gray-400">{user.email || user.username}</p>
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
                        <span className="text-white">{navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '16 GB'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Browser</span>
                        <span className="text-white">{navigator.userAgentData?.brands?.[0]?.brand || 'Modern Browser'}</span>
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

    const renderContent = () => {
        switch (activeSection) {
            case 'appearance': return renderAppearanceSettings();
            case 'display': return renderDisplaySettings();
            case 'sound': return renderSoundSettings();
            case 'network': return renderNetworkSettings();
            case 'power': return renderPowerSettings();
            case 'system': return renderSystemSettings();
            case 'privacy': return renderPrivacySettings();
            case 'about': return renderAboutSettings();
            default: return renderAppearanceSettings();
        }
    };

    return (
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
    );
}

export default Settings;

export const displaySettings = () => {
    return <Settings />;
};
