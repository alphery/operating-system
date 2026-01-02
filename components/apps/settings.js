import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Settings(props) {
    const { user, userData, updateUserData } = useAuth();
    const [activeSection, setActiveSection] = useState('appearance');
    const [settings, setSettings] = useState({
        // Appearance
        wallpaper: props.currBgImgName || 'wall-8',
        darkMode: true,
        accentColor: '#E95420', // Ubuntu orange
        // Display
        brightness: 100,
        nightLight: false,
        fontSize: 'medium',
        // Sound
        volume: 70,
        notificationSounds: true,
        // System
        animations: true,
        autoUpdate: true,
        showDesktopIcons: true,
        // Privacy
        locationServices: false,
        analytics: false,
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
    ];

    useEffect(() => {
        // Load settings from localStorage or Firebase
        const savedSettings = localStorage.getItem('system_settings');
        if (savedSettings) {
            setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
        }
    }, []);

    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('system_settings', JSON.stringify(newSettings));

        // Apply specific settings immediately
        if (key === 'wallpaper' && props.changeBackgroundImage) {
            props.changeBackgroundImage(value);
        }
        if (key === 'accentColor') {
            document.documentElement.style.setProperty('--accent-color', value);
        }
        if (key === 'brightness') {
            document.documentElement.style.setProperty('--brightness', `${value}%`);
        }
    };

    const sections = [
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'display', label: 'Display', icon: '🖥️' },
        { id: 'sound', label: 'Sound', icon: '🔊' },
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
                            className={`cursor-pointer rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 ${settings.wallpaper === name ? 'border-blue-500' : 'border-transparent'
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
                            className={`w-12 h-12 rounded-full cursor-pointer transition-all hover:scale-110 ${settings.accentColor === accent.color ? 'ring-4 ring-white' : ''
                                }`}
                            style={{ backgroundColor: accent.color }}
                            title={accent.name}
                        />
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
                    <span className="text-gray-400">{settings.brightness}%</span>
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
                            className={`px-6 py-2 rounded-lg font-medium capitalize transition-all ${settings.fontSize === size
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

    const renderSoundSettings = () => (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">System Volume</h3>
                    <span className="text-gray-400">{settings.volume}%</span>
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
                <button className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors">
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
                            <p className="text-gray-400">{user.email}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">System Information</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Processor</span>
                        <span className="text-white">Intel Core i7</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Memory</span>
                        <span className="text-white">16 GB</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Graphics</span>
                        <span className="text-white">WebGL Renderer</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Storage</span>
                        <span className="text-white">Browser Local Storage</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'appearance':
                return renderAppearanceSettings();
            case 'display':
                return renderDisplaySettings();
            case 'sound':
                return renderSoundSettings();
            case 'system':
                return renderSystemSettings();
            case 'privacy':
                return renderPrivacySettings();
            case 'about':
                return renderAboutSettings();
            default:
                return renderAppearanceSettings();
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
                                        ? 'bg-blue-600 text-white'
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
