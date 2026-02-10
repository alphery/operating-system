import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';

// ═══════════════════════════════════════════════════════════
// ALPHERY ACCESS - STABLE AUTH CONTEXT
// ═══════════════════════════════════════════════════════════

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

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
    role: string;
    subdomain: string | null;
}

interface AuthContextType {
    user: any;
    platformUser: PlatformUser | null;
    tenants: Tenant[];
    currentTenant: Tenant | null;
    sessionToken: string | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
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

    // Storage Keys (Renamed to v2 to clear old simulation tokens)
    const SESSION_KEY = 'alphery_session_v2';
    const TENANT_KEY = 'alphery_tenant_v2';

    useEffect(() => {
        const storedToken = localStorage.getItem(SESSION_KEY);
        const storedTenantId = localStorage.getItem(TENANT_KEY);

        if (storedToken) {
            setSessionToken(storedToken);
            verifySession(storedToken, storedTenantId);
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (!firebaseUser) {
                // Clear state on logout
                setPlatformUser(null);
                setTenants([]);
                setCurrentTenantState(null);
                setSessionToken(null);
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(TENANT_KEY);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

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

                if (tenantId && data.tenants.length > 0) {
                    const tenant = data.tenants.find((t: Tenant) => t.id === tenantId);
                    if (tenant) setCurrentTenantState(tenant);
                    else setCurrentTenantState(data.tenants[0]);
                } else if (data.tenants.length > 0) {
                    setCurrentTenantState(data.tenants[0]);
                }
            } else {
                // Token invalid
                handleSignOut();
            }
        } catch (error) {
            console.error('[Auth] Session verification failed:', error);
        } finally {
            setLoading(false);
        }
    }

    async function authenticateWithBackend(firebaseIdToken: string) {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: firebaseIdToken }),
        });

        if (!response.ok) {
            throw new Error(`Auth Failed: ${response.statusText}`);
        }

        const data = await response.json();
        localStorage.setItem(SESSION_KEY, data.sessionToken);
        setSessionToken(data.sessionToken);
        setPlatformUser(data.platformUser);
        setTenants(data.tenants);

        if (data.tenants.length > 0) {
            const firstTenant = data.tenants[0];
            setCurrentTenantState(firstTenant);
            localStorage.setItem(TENANT_KEY, firstTenant.id);
        }
        return data;
    }

    async function loginWithGoogle() {
        if (!auth) throw new Error('Auth not configured');
        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(auth, provider);
        const idToken = await credential.user.getIdToken();
        await authenticateWithBackend(idToken);
    }

    async function loginWithEmail(email: string, password: string) {
        if (!auth) throw new Error('Auth not configured');
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();
        await authenticateWithBackend(idToken);
    }

    async function handleSignOut() {
        if (auth) await firebaseSignOut(auth);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TENANT_KEY);
        setSessionToken(null);
        setPlatformUser(null);
        setTenants([]);
        setCurrentTenantState(null);
    }

    function setCurrentTenant(tenant: Tenant) {
        setCurrentTenantState(tenant);
        localStorage.setItem(TENANT_KEY, tenant.id);
    }

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
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }

    const value = {
        user,
        platformUser,
        tenants,
        currentTenant,
        sessionToken,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signOut: handleSignOut,
        setCurrentTenant,
        updatePlatformUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthenticatedFetch() {
    const { sessionToken, currentTenant } = useAuth();
    return async function (url: string, options: RequestInit = {}) {
        const headers = new Headers(options.headers);
        if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
        if (currentTenant && !url.includes('/platform/')) {
            headers.set('X-Tenant-ID', currentTenant.id);
        }
        return fetch(url, { ...options, headers });
    };
}
