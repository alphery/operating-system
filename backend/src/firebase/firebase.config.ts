import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Check if we have all required Firebase credentials
// Check if we have all required Firebase credentials
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

let hasAllCredentials = !!(projectId && clientEmail && rawPrivateKey && rawPrivateKey.length > 50);
let firebaseInitialized = false;

if (hasAllCredentials && !admin.apps.length) {
    try {
        // Robust Private Key Formatting:
        // 1. Remove surrounding double quotes if present
        let formattedKey = rawPrivateKey!.trim();
        if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
            formattedKey = formattedKey.substring(1, formattedKey.length - 1);
        }

        // 2. Replace literal \n with actual newlines
        formattedKey = formattedKey.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId!,
                clientEmail: clientEmail!,
                privateKey: formattedKey,
            }),
        });
        console.log('✅ [FIREBASE] Admin SDK initialized successfully with Production Credentials');
        firebaseInitialized = true;
    } catch (error: any) {
        console.error('❌ [FIREBASE] Admin SDK initialization FAILED:', error.message);
        console.error('   Stack:', error.stack);
        // Fallback to mock mode if init fails
        hasAllCredentials = false;
    }
} else if (admin.apps.length) {
    firebaseInitialized = true;
} else {
    console.warn('⚠️ [FIREBASE] Missing credentials. Using MOCK mode for local development.');
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
        console.log(`🔧 [LOCAL DEV] Mock custom token created for ${uid}`);
        return `mock-custom-token-${uid}`;
    },
    verifyIdToken: async (token: string) => {
        return { uid: 'mock-uid', email: 'mock@example.com' };
    },
};

// Export Firebase admin with mock auth in local dev mode or if init failed
const firebaseAdmin = (hasAllCredentials && firebaseInitialized)
    ? admin
    : { ...admin, auth: () => mockAuth as any };

if (!hasAllCredentials || !firebaseInitialized) {
    console.log('🔧 [LOCAL DEV MODE] Using mock Firebase Auth (Init failed or missing creds)');
}

export default firebaseAdmin;
export const isFirebaseMockMode = !hasAllCredentials || !firebaseInitialized;
