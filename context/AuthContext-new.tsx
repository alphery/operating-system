import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithCustomToken,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';

// ═══════════════════════════════════════════════════════════
// ALPHERY ACCESS - NEW AUTH CONTEXT (UUID-Based)
// ═══════════════════════════════════════════════════════════

interface PlatformUser {
    id: string; // UUID
    email: string;
    displayName: string | null;
    photoUrl: string | null;
    isGod: boolean;
    settings?: any;
}

interface Tenant {
    id: string;
    name: string;
    role: string; // owner, admin, member, viewer
    subdomain: string | null;
}

interface AuthContextType {
    user: any; // Firebase user (identity only)
    platformUser: PlatformUser | null;
    tenants: Tenant[];
    currentTenant: Tenant | null;
    sessionToken: string | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithUserId: (customUid: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    setCurrentTenant: (tenant: Tenant) => void;
    updatePlatformUser: (data: Partial<PlatformUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load session from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('alphery_session_token');
        const storedTenant = localStorage.getItem('alphery_current_tenant');

        if (storedToken) {
            setSessionToken(storedToken);

            // EMERGENCY BYPASS MOUNT
            if (storedToken === 'emergency-token') {
                console.log('[Auth] Detected Emergency God Mode token on mount');
                const mockPlatformUser: PlatformUser = {
                    id: 'admin-bypass-id',
                    email: 'alpherymail@gmail.com',
                    displayName: 'Admin (Emergency Mode)',
                    photoUrl: null,
                    isGod: true
                };
                setPlatformUser(mockPlatformUser);
                const mockTenant: Tenant = {
                    id: 'admin-tenant',
                    name: 'Admin Workspace',
                    role: 'owner',
                    subdomain: 'admin'
                };
                setTenants([mockTenant]);
                setCurrentTenantState(mockTenant);
                setLoading(false);
                return;
            }

            // Verify normal token with backend
            verifySession(storedToken, storedTenant);
        } else {
            setLoading(false);
        }
    }, []);

    // Listen to Firebase auth state (identity only)
    useEffect(() => {
        // If Firebase auth is not configured, skip auth listener
        if (!auth) {
            console.warn('Firebase auth not configured, skipping auth state listener');
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // If we have a real Firebase user, we usually want to verify it
                // unless we're already in emergency mode and it matches an admin
                const storedToken = localStorage.getItem('alphery_session_token');
                if (storedToken === 'emergency-token') {
                    // Keep emergency state if admin
                    if (firebaseUser.email === 'alpherymail@gmail.com' || firebaseUser.email === 'aksnetlink@gmail.com') {
                        setLoading(false);
                        return;
                    }
                }
            } else {
                // NO FIREBASE USER detected
                const storedToken = localStorage.getItem('alphery_session_token');

                // If we are in emergency mode, DON'T wipe the session just because Firebase is null
                if (storedToken === 'emergency-token') {
                    console.log('[Auth] Keeping Emergency session (Firebase user is null)');
                    setLoading(false);
                    return;
                }

                // Normal logout flow
                setPlatformUser(null);
                setTenants([]);
                setCurrentTenantState(null);
                setSessionToken(null);
                localStorage.removeItem('alphery_session_token');
                localStorage.removeItem('alphery_current_tenant');
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

    // Verify session with backend
    async function verifySession(token: string, tenantId: string | null) {
        // Skip verification for emergency token (handled in onAuthStateChanged)
        if (token === 'emergency-token') {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPlatformUser(data.user);
                setTenants(data.tenants);

                // Restore current tenant
                if (tenantId && data.tenants.length > 0) {
                    const tenant = data.tenants.find((t: Tenant) => t.id === tenantId);
                    if (tenant) {
                        setCurrentTenantState(tenant);
                    } else {
                        setCurrentTenantState(data.tenants[0]);
                    }
                } else if (data.tenants.length > 0) {
                    setCurrentTenantState(data.tenants[0]);
                }
            } else {
                // Token invalid, clear session
                localStorage.removeItem('alphery_session_token');
                localStorage.removeItem('alphery_current_tenant');
                setSessionToken(null);
            }
        } catch (error) {
            console.error('Session verification failed:', error);
        } finally {
            setLoading(false);
        }
    }

    // Backend authentication with fallback
    async function authenticateWithBackend(firebaseIdToken: string, firebaseUser?: any) {
        try {
            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: firebaseIdToken }),
            });

            if (!response.ok) {
                // If backend fails (404, 500), try fallback for admins
                if (firebaseUser) {
                    const email = firebaseUser.email;
                    if (email === 'alpherymail@gmail.com' || email === 'aksnetlink@gmail.com') {
                        console.warn('Backend unavailable, activating Emergency God Mode for Admin');
                        const mockPlatformUser: PlatformUser = {
                            id: firebaseUser.uid,
                            email: email,
                            displayName: firebaseUser.displayName || 'Admin',
                            photoUrl: firebaseUser.photoURL || null,
                            isGod: true
                        };
                        setPlatformUser(mockPlatformUser);
                        // Mock tenant for context
                        const mockTenant: Tenant = {
                            id: 'admin-tenant',
                            name: 'Admin Workspace',
                            role: 'owner',
                            subdomain: 'admin'
                        };
                        setTenants([mockTenant]);
                        setCurrentTenantState(mockTenant);
                        // Set dummy session
                        localStorage.setItem('alphery_session_token', 'emergency-token');
                        localStorage.setItem('alphery_current_tenant', 'admin-tenant');
                        setSessionToken('emergency-token');
                        return;
                    }
                }
                throw new Error(`Backend authentication failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Store session token
            localStorage.setItem('alphery_session_token', data.sessionToken);
            setSessionToken(data.sessionToken);

            // Set platform user and tenants
            setPlatformUser(data.platformUser);
            setTenants(data.tenants);

            // ═══════════════════════════════════════════════════════════
            // BRIDGE SYNC: If backend provided a firebaseToken,
            // we MUST sign in to Firebase with it to satisfy Security Rules.
            // ═══════════════════════════════════════════════════════════
            if (data.firebaseToken && auth) {
                try {
                    console.log('[Auth] Syncing Firebase identity with backend custom token...');
                    await signInWithCustomToken(auth, data.firebaseToken);
                } catch (e) {
                    console.error('[Auth] Firebase sync failed:', e);
                }
            } else if (firebaseUser) {
                // If already logged in via social, just refresh claims
                try {
                    console.log('[Auth] Refreshing Firebase token to pick up new claims...');
                    await firebaseUser.getIdToken(true);
                } catch (e) {
                    console.error('[Auth] Failed to refresh token:', e);
                }
            }

            if (data.tenants.length > 0) {
                const firstTenant = data.tenants[0];
                setCurrentTenantState(firstTenant);
                localStorage.setItem('alphery_current_tenant', firstTenant.id);
            }

            return data;
        } catch (error) {
            console.error('Backend authentication error:', error);

            // Retry fallback logic (repetitive but safe if network error instead of 404)
            if (firebaseUser) {
                const email = firebaseUser.email;
                if (email === 'alpherymail@gmail.com' || email === 'aksnetlink@gmail.com') {
                    console.warn('Backend unavailable (Network Error), activating Emergency God Mode for Admin');
                    const mockPlatformUser: PlatformUser = {
                        id: firebaseUser.uid,
                        email: email,
                        displayName: firebaseUser.displayName || 'Admin',
                        photoUrl: firebaseUser.photoURL || null,
                        isGod: true
                    };
                    setPlatformUser(mockPlatformUser);
                    // Mock tenant for context
                    const mockTenant: Tenant = {
                        id: 'admin-tenant',
                        name: 'Admin Workspace',
                        role: 'owner',
                        subdomain: 'admin'
                    };
                    setTenants([mockTenant]);
                    setCurrentTenantState(mockTenant);
                    // Set dummy session
                    localStorage.setItem('alphery_session_token', 'emergency-token');
                    localStorage.setItem('alphery_current_tenant', 'admin-tenant');
                    setSessionToken('emergency-token');
                    return;
                }
            }
            throw error;
        }
    }

    // Login with Google
    async function loginWithGoogle() {
        if (!auth) {
            throw new Error('Firebase auth not configured');
        }
        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(auth, provider);

            // Get Firebase ID token
            const idToken = await credential.user.getIdToken();

            // Authenticate with backend
            await authenticateWithBackend(idToken, credential.user);
        } catch (error) {
            console.warn('Google login failed (handled by component):', error);
            throw error;
        }
    }

    // Login with User ID
    async function loginWithUserId(customUid: string, password: string) {
        try {
            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customUid, password }),
            });

            if (!response.ok) {
                throw new Error('Invalid User ID or password');
            }

            const data = await response.json();

            // This will trigger the sync logic in authenticateWithBackend
            await authenticateWithBackend(data.sessionToken);

            // Re-fetch me to ensure full profile
            verifySession(data.sessionToken, null);
        } catch (error) {
            console.error('User ID login failed:', error);
            throw error;
        }
    }

    // Sign Out
    async function signOut() {
        try {
            if (auth) {
                await firebaseSignOut(auth);
            }
            localStorage.removeItem('alphery_session_token');
            localStorage.removeItem('alphery_current_tenant');
            setSessionToken(null);
            setPlatformUser(null);
            setTenants([]);
            setCurrentTenantState(null);
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }

    // Set current tenant
    function setCurrentTenant(tenant: Tenant) {
        setCurrentTenantState(tenant);
        localStorage.setItem('alphery_current_tenant', tenant.id);
    }

    // Update Platform User Settings
    async function updatePlatformUser(data: Partial<PlatformUser>) {
        if (!sessionToken) return;

        try {
            const response = await fetch(`${BACKEND_URL}/auth/me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setPlatformUser(prev => prev ? { ...prev, ...updatedUser } : null);
                console.log('[Auth] User updated successfully');
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }

    const value: AuthContextType = {
        user,
        platformUser,
        tenants,
        currentTenant,
        sessionToken,
        loading,
        loginWithGoogle,
        loginWithUserId,
        signOut,
        setCurrentTenant,
        updatePlatformUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ═══════════════════════════════════════════════════════════
// HELPER HOOK: API Calls with Auth
// ═══════════════════════════════════════════════════════════

export function useAuthenticatedFetch() {
    const { sessionToken, currentTenant } = useAuth();

    async function authenticatedFetch(url: string, options: RequestInit = {}) {
        const headers = new Headers(options.headers);

        if (sessionToken) {
            headers.set('Authorization', `Bearer ${sessionToken}`);
        }

        if (currentTenant && !url.includes('/platform/')) {
            headers.set('X-Tenant-ID', currentTenant.id);
        }

        return fetch(url, {
            ...options,
            headers,
        });
    }

    return authenticatedFetch;
}
