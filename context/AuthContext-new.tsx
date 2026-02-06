import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
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
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    setCurrentTenant: (tenant: Tenant) => void;
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
            // Verify token with backend
            verifySession(storedToken, storedTenant);
        } else {
            setLoading(false);
        }
    }, []);

    // Listen to Firebase auth state (identity only)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
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

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    // Verify session with backend
    async function verifySession(token: string, tenantId: string | null) {
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

    // Backend authentication
    async function authenticateWithBackend(firebaseIdToken: string) {
        try {
            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: firebaseIdToken }),
            });

            if (!response.ok) {
                throw new Error('Backend authentication failed');
            }

            const data = await response.json();

            // Store session token
            localStorage.setItem('alphery_session_token', data.sessionToken);
            setSessionToken(data.sessionToken);

            // Set platform user and tenants
            setPlatformUser(data.platformUser);
            setTenants(data.tenants);

            // Set first tenant as current
            if (data.tenants.length > 0) {
                const firstTenant = data.tenants[0];
                setCurrentTenantState(firstTenant);
                localStorage.setItem('alphery_current_tenant', firstTenant.id);
            }

            return data;
        } catch (error) {
            console.error('Backend authentication error:', error);
            throw error;
        }
    }

    // Login with Google
    async function loginWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(auth, provider);

            // Get Firebase ID token
            const idToken = await credential.user.getIdToken();

            // Authenticate with backend
            await authenticateWithBackend(idToken);
        } catch (error) {
            console.error('Google login failed:', error);
            throw error;
        }
    }

    // Login with Email/Password
    async function loginWithEmail(email: string, password: string) {
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);

            // Get Firebase ID token
            const idToken = await credential.user.getIdToken();

            // Authenticate with backend
            await authenticateWithBackend(idToken);
        } catch (error) {
            console.error('Email login failed:', error);
            throw error;
        }
    }

    // Sign Out
    async function signOut() {
        try {
            await firebaseSignOut(auth);
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

    const value: AuthContextType = {
        user,
        platformUser,
        tenants,
        currentTenant,
        sessionToken,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signOut,
        setCurrentTenant,
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

        if (currentTenant) {
            headers.set('X-Tenant-ID', currentTenant.id);
        }

        return fetch(url, {
            ...options,
            headers,
        });
    }

    return authenticatedFetch;
}
