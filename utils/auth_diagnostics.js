import { auth } from '../config/firebase';

/**
 * Diagnostic utility to check Firebase authentication state and custom claims
 */
export async function diagnoseAuthState() {
    if (!auth) {
        console.error('🔴 Firebase auth is not configured');
        return null;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
        console.error('🔴 No Firebase user is currently signed in');
        return null;
    }

    try {
        // Force refresh to get latest claims
        const idTokenResult = await currentUser.getIdTokenResult(true);

        console.log('🔍 === FIREBASE AUTH DIAGNOSTICS ===');
        console.log('✅ Firebase UID:', currentUser.uid);
        console.log('✅ Email:', currentUser.email);
        console.log('✅ Display Name:', currentUser.displayName);
        console.log('\n📋 Custom Claims:');
        console.log('   - platformId:', idTokenResult.claims.platformId || '❌ NOT SET');
        console.log('   - customUid:', idTokenResult.claims.customUid || '❌ NOT SET');
        console.log('   - isGod:', idTokenResult.claims.isGod || '❌ NOT SET');
        console.log('\n🔑 Token issued at:', new Date(idTokenResult.issuedAtTime));
        console.log('⏰ Token expires at:', new Date(idTokenResult.expirationTime));
        console.log('================================\n');

        return {
            firebaseUid: currentUser.uid,
            email: currentUser.email,
            claims: idTokenResult.claims,
            hasRequiredClaims: !!(idTokenResult.claims.platformId)
        };
    } catch (error) {
        console.error('🔴 Failed to get token result:', error);
        return null;
    }
}

// Auto-run on import in dev mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.diagnoseAuth = diagnoseAuthState;
    console.log('💡 Run window.diagnoseAuth() in console to check auth state');
}
