import displayVsCode from './components/apps/vscode';
import { displayTerminal } from './components/apps/terminal';
import { displaySettings } from './components/apps/settings';
import { displayChrome } from './components/apps/chrome';
import { displayTrash } from './components/apps/trash';
import { displayGedit } from './components/apps/gedit';
import { displayAboutAjith } from './components/apps/anurag';
import { displayCalculator } from './components/apps/calc';
import { displayProject } from './components/apps/projects';
import { displayUserManager } from './components/apps/user_manager';
import { displayMessenger } from './components/apps/messenger';
import { displayAppStore } from './components/apps/app_store';
import { displayFileManager } from './components/apps/file_manager';
import { displayTodo } from './components/apps/todo';
import { displayWeather } from './components/apps/weather';
import { displayCalendar } from './components/apps/calendar';

const apps = [
    {
        id: "messenger",
        title: "Messenger",
        icon: './themes/Yaru/apps/messenger.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayMessenger,
    },
    {
        id: "users",
        title: "Alphery Users",
        icon: './themes/Yaru/apps/users.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayUserManager,
    },
    {
        id: "projects",
        title: "Alphery Projects",
        icon: './themes/Yaru/apps/projects.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayProject,
    },
    {
        id: "files",
        title: "Files",
        icon: './themes/Yaru/system/folder.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayFileManager,
    },
    {
        id: "chrome",
        title: "Google Chrome",
        icon: './themes/Yaru/apps/chrome.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayChrome,
    },
    {
        id: "calc",
        title: "Calculator",
        icon: './themes/Yaru/apps/calc.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
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
        favourite: true,
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
        desktop_shortcut: true,
        screen: displayAboutAjith,
    },
    {
        id: "gedit",
        title: "Text Editor",
        icon: './themes/Yaru/apps/gedit.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayGedit,
    },
    {
        id: "todo",
        title: "To-Do",
        icon: './themes/Yaru/apps/todo.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayTodo,
    },
    {
        id: "weather",
        title: "Weather",
        icon: './themes/Yaru/apps/weather.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayWeather,
    },
    {
        id: "calendar",
        title: "Calendar",
        icon: './themes/Yaru/apps/calendar.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayCalendar,
    },
    {
        id: "trash",
        title: "Trash",
        icon: './themes/Yaru/system/user-trash-full.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayTrash,
    },
    {
        id: "app-store",
        title: "App Store",
        icon: './themes/Yaru/apps/app_store.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayAppStore,
    }
]

export default apps;

if (typeof window !== 'undefined') {
    window.ALL_APPS = apps;
}
