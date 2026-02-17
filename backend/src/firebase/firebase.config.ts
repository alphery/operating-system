import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Check if we're in local development mode without Firebase credentials
const isLocalDev = !process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length && !isLocalDev) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || 'alphery-1',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
            }),
        });
        console.log('✅ Firebase Admin initialized');
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
    }
}

// Mock Firebase Auth for local development
const mockAuth = {
    createUser: async (userData: any) => {
        const uid = crypto.createHash('md5').update(userData.email).digest('hex').substring(0, 28);
        console.log(`🔧 [LOCAL DEV] Mock Firebase user created: ${uid}`);
        return { uid, email: userData.email, displayName: userData.displayName };
    },
    getUserByEmail: async (email: string) => {
        const uid = crypto.createHash('md5').update(email).digest('hex').substring(0, 28);
        return { uid, email };
    },
    updateUser: async (uid: string, data: any) => {
        console.log(`🔧 [LOCAL DEV] Mock user updated: ${uid}`);
        return { uid };
    },
    deleteUser: async (uid: string) => {
        console.log(`🔧 [LOCAL DEV] Mock user deleted: ${uid}`);
    },
    setCustomUserClaims: async (uid: string, claims: any) => {
        console.log(`🔧 [LOCAL DEV] Mock claims set for ${uid}:`, claims);
    },
    getUser: async (uid: string) => {
        return { uid };
    },
    createCustomToken: async (uid: string, additionalClaims?: any) => {
        return `mock-custom-token-${uid}`;
    },
    verifyIdToken: async (token: string) => {
        return { uid: 'mock-uid', email: 'mock@example.com' };
    },
};

// Export Firebase admin with mock auth in local dev mode
const firebaseAdmin = isLocalDev
    ? { ...admin, auth: () => mockAuth as any }
    : admin;

if (isLocalDev) {
    console.log('🔧 [LOCAL DEV MODE] Using mock Firebase Auth');
}

export default firebaseAdmin;
