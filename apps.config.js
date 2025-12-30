import displayVsCode from './components/apps/vscode';
import { displayTerminal } from './components/apps/terminal';
import { displaySettings } from './components/apps/settings';
import { displayChrome } from './components/apps/chrome';
import { displayTrash } from './components/apps/trash';
import { displayGedit } from './components/apps/gedit';
import { displayAboutAnurag } from './components/apps/anurag';
import { displayCalculator } from './components/apps/calc';
import { displayERPDashboard } from './components/apps/erp_dashboard';
import { displayCRM } from './components/apps/crm';
import { displayMail } from './components/apps/mail';
import { displayHRM } from './components/apps/hrm';
import { displayProject } from './components/apps/projects';
import { displayUserManager } from './components/apps/user_manager';
import { displayMessenger } from './components/apps/messenger';
import { displayAppStore } from './components/apps/app_store';

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
        favourite: true,
        desktop_shortcut: true,
        screen: displayUserManager,
    },
    {
        id: "dashboard",
        title: "Enterprise Dashboard",
        icon: './themes/Yaru/apps/gnome-control-center.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayERPDashboard,
    },
    {
        id: "projects",
        title: "Alphery Projects",
        icon: './themes/Yaru/apps/projects.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayProject,
    },
    {
        id: "mail",
        title: "Z-Mail",
        icon: './themes/Yaru/apps/gedit.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayMail,
    },
    {
        id: "crm",
        title: "CRM Pro",
        icon: './themes/Yaru/apps/users.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayCRM,
    },
    {
        id: "people",
        title: "People Connect",
        icon: './themes/Yaru/system/user-desktop.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayHRM,
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
        favourite: true,
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
        id: "about-anurag",
        title: "About Anurag",
        icon: './themes/Yaru/system/user-home.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayAboutAnurag,
    },
    {
        id: "gedit",
        title: "Contact Me",
        icon: './themes/Yaru/apps/gedit.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayGedit,
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
        icon: './themes/Yaru/system/view-app-grid-symbolic.svg',
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
