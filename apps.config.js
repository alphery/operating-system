import { displayVsCode } from './components/apps/vscode';
import { displayTerminal } from './components/apps/terminal';
import { displaySettings } from './components/apps/settings';
import { displayChrome } from './components/apps/chrome';
import { displayCamera } from './components/apps/camera';
import { displayVoiceRecorder } from './components/apps/voice_recorder';
import { displayGallery } from './components/apps/gallery';

import { displayTrash } from './components/apps/trash';
import { displayGedit } from './components/apps/gedit';
import { displayAboutAjith } from './components/apps/anurag';
import { displayCalculator } from './components/apps/calc';
import { displayProject } from './components/apps/crm_odoo';
import { displayCRMPro } from './components/apps/crm-pro'; // NEW CRM PRO
import { displayUserManager } from './components/apps/user_manager';
import displayAlpheryAccess from './components/apps/alphery_access.tsx';
import { displayMessenger } from './components/apps/messenger';
import { displayAppStore } from './components/apps/app_store';
import { displayFileManager } from './components/apps/file_manager';
import { displayTodo } from './components/apps/todo';
import { displayWeather } from './components/apps/weather';
import { displayCalendar } from './components/apps/calendar';
import { displayAboutAlphery } from './components/apps/about_alphery';
import RealtimeDemo from './components/apps/realtime_demo';

// Default installed apps for all new users
const DEFAULT_INSTALLED_APPS = [
    'chrome',
    'messenger',
    'calendar',
    'weather',
    'settings',
    'files',
    'trash',
    'gedit', // Text Editor
    'app-store',
    'realtime-demo' // Socket.IO Test
];

const apps = [
    {
        id: "messenger",
        title: "Messenger",
        icon: './themes/Yaru/apps/messenger.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayMessenger,
    },
    {
        id: "alphery-access",
        title: "Alphery Access",
        icon: './themes/Yaru/apps/users.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayAlpheryAccess,
    },
    {
        id: "projects",
        title: "CRM Pro (Old)",
        icon: './themes/Yaru/apps/projects.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayProject,
    },
    {
        id: "crm-pro",
        title: "CRM Pro",
        icon: './themes/Yaru/apps/projects.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayCRMPro,
    },
    {
        id: "files",
        title: "Files",
        icon: './themes/Yaru/system/folder.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayFileManager,
    },
    {
        id: "chrome",
        title: "Google Chrome",
        icon: './themes/Yaru/apps/chrome.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayChrome,
    },

    {
        id: "calc",
        title: "Calculator",
        icon: './themes/Yaru/apps/calc.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayCalculator,
    },
    {
        id: "vscode",
        title: "Visual Studio Code",
        icon: './themes/Yaru/apps/vscode.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayVsCode,
    },
    {
        id: "terminal",
        title: "Terminal",
        icon: './themes/Yaru/apps/bash.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayTerminal,
    },
    {
        id: "settings",
        title: "Settings",
        icon: './themes/Yaru/apps/gnome-control-center.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displaySettings,
    },
    {
        id: "about-ajith",
        title: "About Ajith",
        icon: './themes/Yaru/system/user-home.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayAboutAjith,
    },
    {
        id: "gedit",
        title: "Text Editor",
        icon: './themes/Yaru/apps/gedit.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayGedit,
    },
    {
        id: "todo",
        title: "To-Do",
        icon: './themes/Yaru/apps/todo.svg',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayTodo,
    },
    {
        id: "weather",
        title: "Weather",
        icon: './themes/Yaru/apps/weather.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayWeather,
    },
    {
        id: "calendar",
        title: "Calendar",
        icon: './themes/Yaru/apps/calendar.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayCalendar,
    },
    {
        id: "trash",
        title: "Trash",
        icon: './themes/Yaru/system/user-trash-full.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayTrash,
    },
    {
        id: "app-store",
        title: "App Store",
        icon: './themes/Yaru/apps/app_store.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayAppStore,
    },
    {
        id: "about-alphery",
        title: "About Alphery",
        icon: '/images/logos/Dark_Logo_H.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayAboutAlphery,
    },
    {
        id: "camera",
        title: "Camera",
        icon: './themes/Yaru/apps/camera.png',
        disabled: true,
        favourite: false,
        desktop_shortcut: false,
        screen: displayCamera,
    },
    {
        id: "voice-recorder",
        title: "Voice Recorder",
        icon: './themes/Yaru/apps/microphone.png',
        disabled: true,
        favourite: false,
        desktop_shortcut: false,
        screen: displayVoiceRecorder,
    },
    {
        id: "gallery",
        title: "Gallery",
        icon: './themes/Yaru/apps/photos.png',
        disabled: true,
        favourite: false,
        desktop_shortcut: false,
        screen: displayGallery,
    },
    {
        id: "realtime-demo",
        title: "Realtime Demo",
        icon: './themes/Yaru/apps/spotify.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: () => <RealtimeDemo />,
    }
]

export default apps;
export { DEFAULT_INSTALLED_APPS };

if (typeof window !== 'undefined') {
    window.ALL_APPS = apps;
    window.DEFAULT_INSTALLED_APPS = DEFAULT_INSTALLED_APPS;
}
