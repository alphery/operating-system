# Alphery OS

<div align="center">

![Alphery OS](https://img.shields.io/badge/Alphery-OS-blue?style=for-the-badge&logo=ubuntu)
![Next.js](https://img.shields.io/badge/Next.js-13-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-integrated-orange?style=for-the-badge&logo=firebase)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)

**A cloud-enabled, web-based operating system simulation with multi-user support**

[Live Demo](https://my-portfolio-rouge-ten.vercel.app/) • [Documentation](#documentation) • [Setup Guide](#firebase-setup)

</div>

---

## ✨ Features

### 🖥️ Core Features
- **Desktop Environment** - Full Ubuntu-like interface
- **Multiple Apps** - Terminal, VS Code, Calculator, Browser, and more
- **Window Management** - Draggable, resizable windows
- **File System** - Create, edit, and manage files
- **Settings** - Customizable wallpapers and themes

### 🔥 NEW: Firebase Integration
- **🔐 User Authentication** - Email/Password + Google OAuth
- **☁️ Cloud Storage** - All data saved to Firestore
- **👥 Multi-User Support** - Each user gets their own workspace
- **🌍 Global Access** - Access your OS from any device
- **🔄 Real-time Sync** - Changes sync instantly across devices
- **💾 Data Persistence** - Never lose your files and settings

---

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/alphery/operating-system.git
cd operating-system

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or export as static site
npm run export
```

---

## 🔥 Firebase Setup

This project now includes Firebase for cloud-based authentication and storage!

### Quick Setup (5 minutes)

1. **Create Firebase Project**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Create new project: "alphery-os"
   - Enable Authentication & Firestore

2. **Get Config Values**
   - Go to Project Settings → Your apps → Web
   - Copy the config object

3. **Configure Locally**
   ```bash
   # Create environment file
   cp .env.local.example .env.local
   
   # Edit .env.local and paste your Firebase config
   ```

4. **Deploy to Vercel**
   - Add Firebase env vars in Vercel dashboard
   - Push to GitHub
   - Auto-deploys! 🎉

**📚 Detailed Documentation:**
- [**FIREBASE_QUICKSTART.md**](FIREBASE_QUICKSTART.md) - Fast 5-minute setup
- [**FIREBASE_SETUP.md**](FIREBASE_SETUP.md) - Comprehensive guide
- [**ARCHITECTURE.txt**](ARCHITECTURE.txt) - System architecture

---

## 📁 Project Structure

```
operating-system/
├── config/
│   └── firebase.js              # Firebase configuration
├── context/
│   └── AuthContext.js           # Authentication provider
├── components/
│   ├── apps/                    # OS applications
│   ├── screen/
│   │   ├── booting_screen.js    # Modern Alphery OS loader
│   │   ├── lock_screen.js       # Lock screen
│   │   ├── firebase_auth_screen.js  # Login/Signup
│   │   └── desktop.js           # Main desktop
│   └── util components/         # Utility components
├── hooks/
│   └── useFirebaseSync.js       # Data syncing hooks
├── pages/
│   ├── _app.js                  # App wrapper with AuthProvider
│   └── index.js                 # Main entry
├── public/                      # Static assets
└── styles/                      # CSS styles
```

---

## 🎨 What's New

### Modern Loader
- ✅ Black background with blue-purple gradient
- ✅ "ALPHERY OS" branding with animated text
- ✅ White loading spinner
- ✅ Smooth animations

### Authentication
- ✅ Email/Password signup & login
- ✅ Google OAuth integration
- ✅ Demo mode (no account needed)
- ✅ Persistent sessions

### Cloud Features
- ✅ User data stored in Firestore
- ✅ Settings synced across devices
- ✅ Files saved to cloud
- ✅ Real-time updates

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 13, React 18, TailwindCSS
- **Backend**: Firebase
  - Authentication (Email/Password, Google OAuth)
  - Firestore (NoSQL database)
  - Cloud Storage
- **Deployment**: Vercel
- **UI**: Custom Ubuntu-like interface

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [FIREBASE_QUICKSTART.md](FIREBASE_QUICKSTART.md) | Quick 5-minute Firebase setup |
| [FIREBASE_SETUP.md](FIREBASE_SETUP.md) | Detailed Firebase configuration guide |
| [FIREBASE_INTEGRATION_SUMMARY.md](FIREBASE_INTEGRATION_SUMMARY.md) | Complete integration overview |
| [ARCHITECTURE.txt](ARCHITECTURE.txt) | System architecture diagrams |

---

## 🎯 Usage

### Authentication

Users can:
1. **Sign Up** with email and password
2. **Sign In** with Google (one-click)
3. **Demo Mode** - Try without creating an account

### Data Management

All user data is automatically:
- ✅ Saved to Firestore (if logged in)
- ✅ Synced across devices in real-time
- ✅ Backed up to localStorage (demo mode)
- ✅ Isolated per user (secure)

### Development

```javascript
// Use authentication in your components
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, userData, updateUserData } = useAuth();
  
  // Save user settings
  await updateUserData({
    settings: { wallpaper: 'wall-1' }
  });
}

// Auto-sync data to Firebase
import { useUserSettings } from '../hooks/useFirebaseSync';

function Settings() {
  const { saveData, loadData } = useUserSettings();
  
  saveData({ theme: 'dark' });
}
```

---

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alphery/operating-system)

**Important:** Add Firebase environment variables in Vercel:
- Settings → Environment Variables
- Add all `NEXT_PUBLIC_FIREBASE_*` variables

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Issues

Found a bug? [Create an issue](https://github.com/alphery/operating-system/issues)

---

## 📄 License

This project is licensed under the ISC License.

---

## 👤 Author

**Alphery** 

Modified and enhanced from the original Web-OS by Anurag Pathak

---

## 🎉 Acknowledgments

- Original Web-OS concept by Anurag Pathak
- Firebase for backend infrastructure
- Vercel for seamless deployment
- Ubuntu for UI inspiration

---

<div align="center">

**Made with ❤️ and ☕**

⭐ Star this repo if you like it!

</div>