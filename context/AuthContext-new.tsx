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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://alphery-os-backend.onrender.com';

interface PlatformUser {
    id: string; // UUID
    email: string;
    displayName: string | null;
    photoUrl: string | null;
    isGod: boolean;
    isActive: boolean;
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
    emergencyLogin: (email: string) => Promise<void>;
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

        console.log('[Auth] Booting session:', { hasToken: !!storedToken });

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
            console.log('[Auth] Firebase state:', { hasUser: !!firebaseUser });
            setUser(firebaseUser);
            if (!firebaseUser) {
                // Only clear if we aren't in emergency mode
                const token = localStorage.getItem(SESSION_KEY);
                if (token !== 'emergency-token') {
                    setPlatformUser(null);
                    setTenants([]);
                    setCurrentTenantState(null);
                    setSessionToken(null);
                    localStorage.removeItem(SESSION_KEY);
                    localStorage.removeItem(TENANT_KEY);
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    async function verifySession(token: string, tenantId: string | null) {
        if (token === 'emergency-token') {
            const savedSettings = JSON.parse(localStorage.getItem('system_settings') || '{}');
            console.warn('[Auth] Activating Emergency God Mode from saved token', { hasSettings: !!savedSettings.wallpaper });
            const mockUser: PlatformUser = {
                id: 'emergency-admin',
                email: 'admin@alphery.os',
                displayName: 'God Admin (Emergency)',
                photoUrl: null,
                isGod: true,
                isActive: true,
                settings: savedSettings
            };
            const mockTenant: Tenant = {
                id: 'admin-tenant',
                name: 'Emergency Workspace',
                role: 'owner',
                subdomain: 'admin'
            };
            setPlatformUser(mockUser);
            setTenants([mockTenant]);
            setCurrentTenantState(mockTenant);
            setLoading(false);
            return;
        }

        try {
            console.log('[Auth] Fetching /auth/me from:', `${BACKEND_URL}/auth/me`);
            const response = await fetch(`${BACKEND_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Auth] Me Response:', data);
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
                console.warn('[Auth] Session invalid (Status: ' + response.status + '), clearing');
                if (response.status !== 401) {
                    const errorText = await response.text();
                    console.warn('[Auth] Error details:', errorText);
                }
                handleSignOut();
            }
        } catch (error) {
            console.error('[Auth] Session verification failed:', error);
            // Don't sign out on network error
        } finally {
            setLoading(false);
        }
    }

    async function authenticateWithBackend(firebaseIdToken: string) {
        const response = await fetch(`${BACKEND_URL}/auth/login-google`, {
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

    async function emergencyLogin(email: string) {
        console.warn('[Auth] Manual Emergency Bypass triggered for:', email);
        const savedSettings = JSON.parse(localStorage.getItem('system_settings') || '{}');
        const mockUser: PlatformUser = {
            id: 'emergency-admin',
            email: email,
            displayName: 'God Admin (Simulation)',
            photoUrl: null,
            isGod: true,
            isActive: true,
            settings: savedSettings
        };
        const mockTenant: Tenant = {
            id: 'admin-tenant',
            name: 'Emergency Workspace',
            role: 'owner',
            subdomain: 'admin'
        };

        localStorage.setItem(SESSION_KEY, 'emergency-token');
        localStorage.setItem(TENANT_KEY, mockTenant.id);

        setSessionToken('emergency-token');
        setPlatformUser(mockUser);
        setTenants([mockTenant]);
        setCurrentTenantState(mockTenant);
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

    /**
     * NEW: Direct login with AA/AT/AU ID + password (no Firebase)
     */
    async function loginDirect(customUid: string, password: string) {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customUid, password }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Invalid User ID or password');
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

        // Emergency Mode: Save to local simulation only
        if (sessionToken === 'emergency-token') {
            if (data.settings) {
                const currentSettings = JSON.parse(localStorage.getItem('system_settings') || '{}');
                const merged = { ...currentSettings, ...data.settings };
                localStorage.setItem('system_settings', JSON.stringify(merged));
                // Update local state so UI reacts immediately
                setPlatformUser(prev => prev ? { ...prev, settings: merged } : null);
            }
            return;
        }
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
        loginDirect,
        emergencyLogin,
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
