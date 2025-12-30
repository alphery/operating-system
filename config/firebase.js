import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

// Initialize Firebase (only once and only if configured)
let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApps()[0];
        }

        // Initialize Firebase services
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (error) {
        console.warn('Firebase initialization error:', error.message);
        console.warn('App will run in demo mode without Firebase');
    }
} else {
    console.warn('Firebase not configured. App will run in demo mode.');
}

export { auth, db, storage };
export default app;
