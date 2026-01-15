import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    role: 'super_admin' | 'user';
    approvalStatus: 'approved' | 'pending';
    createdAt: string;
    settings: {
        wallpaper: string;
        theme: string;
    };
    files: any[];
    apps: any[];
    disabledApps?: string[]; // Array of app IDs that user has uninstalled
    allowedProjects?: string[]; // Array of project IDs this user can access
    allowedApps?: string[]; // Array of app IDs this user can see (e.g., ['projects', 'calendar'])
    [key: string]: any; // Allow other properties
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    signup: (email: string, password: string, displayName?: string) => Promise<User>;
    login: (email: string, password: string) => Promise<User>;
    loginWithGoogle: () => Promise<User>;
    logout: () => Promise<void>;
    updateUserData: (data: Partial<UserData>) => Promise<void>;
    loadUserData: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        // Check if Firebase is configured
        if (!auth) {
            console.warn('Firebase auth not available. Running in demo mode.');
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // Load user data from Firestore
                await loadUserData(user.uid);
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loadUserData = async (uid: string) => {
        if (!db) {
            console.warn('Firestore not available in demo mode');
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const SUPER_ADMIN_EMAIL = 'alpherymail@gmail.com';

    const signup = async (email: string, password: string, displayName?: string) => {
        if (!auth || !db) {
            throw new Error('Firebase not configured. Cannot sign up in demo mode.');
        }

        try {
            console.log('[AUTH] Signup attempt for email:', email);
            const credential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile
            await updateProfile(credential.user, {
                displayName: displayName || 'User',
                photoURL: './images/logos/boy.png' // Default avatar
            });

            // Determine role and approval status
            const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL;
            const approvalStatus = isSuperAdmin ? 'approved' : 'pending';

            const newUserData: UserData = {
                uid: credential.user.uid,
                email: email,
                displayName: displayName || 'User',
                photoURL: './images/logos/boy.png',
                role: isSuperAdmin ? 'super_admin' : 'user',
                approvalStatus: approvalStatus as 'approved' | 'pending',
                createdAt: new Date().toISOString(),
                settings: {
                    wallpaper: 'wall-1',
                    theme: 'dark'
                },
                files: [],
                apps: [],
                allowedProjects: [], // Super admin will have access to all, regular users need explicit permission
                allowedApps: null // null = all apps available (backward compatible), [] = no apps, [...ids] = specific apps
            };

            // Create user document in Firestore
            await setDoc(doc(db, 'users', credential.user.uid), newUserData);

            console.log('[AUTH] Signup successful for user:', credential.user.uid);
            return credential.user;
        } catch (error: any) {
            console.error('[AUTH] Signup failed:', error.code, error.message);
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        if (!auth) {
            throw new Error('Firebase not configured. Cannot login in demo mode.');
        }

        try {
            console.log('[AUTH] Login attempt for email:', email);
            const credential = await signInWithEmailAndPassword(auth, email, password);
            console.log('[AUTH] Login successful for user:', credential.user.uid);
            return credential.user;
        } catch (error: any) {
            console.error('[AUTH] Login failed:', error.code, error.message);

            // Provide user-friendly error messages
            let errorMessage = 'Login failed. Please try again.';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed login attempts. Please try again later.';
                    break;
                default:
                    errorMessage = error.message;
            }

            const enhancedError: any = new Error(errorMessage);
            enhancedError.code = error.code;
            throw enhancedError;
        }
    };

    const loginWithGoogle = async () => {
        if (!auth || !db) {
            throw new Error('Firebase not configured. Cannot login with Google in demo mode.');
        }

        try {
            console.log('[AUTH] Google login attempt');
            const provider = new GoogleAuthProvider();

            // Removed sensitive Google Drive scopes to prevent "Google hasn't verified this app" warning
            // provider.addScope('https://www.googleapis.com/auth/drive.file');
            // provider.addScope('https://www.googleapis.com/auth/drive');

            const credential = await signInWithPopup(auth, provider);

            if (!credential.user.email) throw new Error("No email provided by Google");

            // Check if user document exists, if not create it
            const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

            if (!userDoc.exists()) {
                // Determine role and approval status
                const isSuperAdmin = credential.user.email.toLowerCase() === SUPER_ADMIN_EMAIL;
                const approvalStatus = isSuperAdmin ? 'approved' : 'pending';

                const newUserData: UserData = {
                    uid: credential.user.uid,
                    email: credential.user.email,
                    displayName: credential.user.displayName || 'User',
                    photoURL: credential.user.photoURL || './images/logos/boy.png',
                    role: isSuperAdmin ? 'super_admin' : 'user',
                    approvalStatus: approvalStatus as 'approved' | 'pending',
                    createdAt: new Date().toISOString(),
                    settings: {
                        wallpaper: 'wall-1',
                        theme: 'dark'
                    },
                    files: [],
                    apps: [],
                    allowedProjects: [], // Super admin will have access to all, regular users need explicit permission
                    allowedApps: null // null = all apps available (backward compatible), [] = no apps, [...ids] = specific apps
                };

                await setDoc(doc(db, 'users', credential.user.uid), newUserData);
            }

            console.log('[AUTH] Google login successful for user:', credential.user.uid);
            return credential.user;
        } catch (error: any) {
            console.error('[AUTH] Google login failed:', error.code, error.message);
            throw error;
        }
    };

    const logout = async () => {
        if (!auth) {
            console.warn('Firebase not configured. Cannot logout in demo mode.');
            setUser(null);
            setUserData(null);
            return;
        }

        try {
            await signOut(auth);
            setUser(null);
            setUserData(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const updateUserData = async (data: Partial<UserData>) => {
        if (!user) return;

        if (!db) {
            console.warn('Firestore not available. Cannot update user data in demo mode.');
            return;
        }

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, data, { merge: true });

            // We need to merge the new data with existing state locally
            setUserData(prev => prev ? ({ ...prev, ...data }) : null);
        } catch (error) {
            console.error('Error updating user data:', error);
            throw error;
        }
    };

    const value = {
        user,
        userData,
        loading,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateUserData,
        loadUserData
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
