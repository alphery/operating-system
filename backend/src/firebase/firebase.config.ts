import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Check if we're in local development mode without Firebase credentials
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const isLocalDev = !privateKey || privateKey.length < 100;

if (!admin.apps.length) {
    if (!isLocalDev) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID || 'alphery-1',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
                    privateKey: privateKey?.replace(/\\n/g, '\n') || '',
                }),
            });
            console.log('✅ [FIREBASE] Admin SDK initialized successfully with Production Credentials');
        } catch (error) {
            console.error('❌ [FIREBASE] Admin SDK initialization FAILED:', error.message);
        }
    } else {
        console.warn('⚠️ [FIREBASE] No private key found or key too short. Using MOCK mode.');
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
