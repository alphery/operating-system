import displaySpotify from './components/apps/spotify';
import displayVsCode from './components/apps/vscode';
import { displayTerminal } from './components/apps/terminal';
import { displaySettings } from './components/apps/settings';
import { displayChromePopout as displayChrome } from './components/apps/chrome_popout';
import displayCandy from './components/apps/candy';
import { displayTrash } from './components/apps/trash';
import { displayGedit } from './components/apps/gedit';
import { displayAboutAnurag } from './components/apps/anurag';
import { displayTerminalCalc } from './components/apps/calc';
import displayCricket from './components/apps/cricket';
import { displayNoSleep } from './components/apps/nosleep';

const apps = [
    {
        id: "chrome",
        title: "Chrome",
        icon: './themes/Yaru/apps/chrome.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayChrome,
    },
    {
        id: "candy",
        title: "Candy",
        icon: './themes/Yaru/apps/candy-fiesta.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayCandy,
    },
    {
        id: "calc",
        title: "Calculator",
        icon: './themes/Yaru/apps/calc.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayTerminalCalc,
    },
    {
        id: "cricket",
        title: "Cricket",
        icon: './themes/Yaru/apps/cricket_gunda.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayCricket,
    },
    {
        id: "about-anurag",
        title: "About Me",
        icon: './themes/Yaru/system/user-home.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayAboutAnurag,
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
        favourite: true,
        desktop_shortcut: false,
        screen: displayTerminal,
    },
    {
        id: "spotify",
        title: "Spotify",
        icon: './themes/Yaru/apps/spotify.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displaySpotify,
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
        id: "trash",
        title: "Trash",
        icon: './themes/Yaru/system/user-trash-full.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayTrash,
    },
    {
        id: "gedit",
        title: "Contact Me",
        icon: './themes/Yaru/apps/gedit.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayGedit,
    },
    {
        id: "nosleep",
        title: "No Sleep",
        icon: './themes/Yaru/apps/nosleep.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayNoSleep,
    },
]

export default apps;