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
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
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

        let userDataUnsubscribe: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);

                // Set up real-time listener for user data
                if (db && user.email) {
                    try {
                        const userDocRef = doc(db, 'users', user.email.toLowerCase());
                        userDataUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                console.log('[AuthContext] User data updated from Firestore');
                                setUserData(docSnap.data() as UserData);
                            } else {
                                // If doc doesn't exist at email key, it might be new or strictly UID based? 
                                // But system prefers Email. We leave userData null so defaults apply or waiting for creation.
                                console.log('[AuthContext] No user document found for email:', user.email);
                            }
                        }, (error) => {
                            console.error('Error listening to user data:', error);
                        });
                    } catch (error) {
                        console.error('Error setting up user data listener:', error);
                    }
                }
            } else {
                setUser(null);
                setUserData(null);

                // Cleanup listener if exists
                if (userDataUnsubscribe) {
                    userDataUnsubscribe();
                    userDataUnsubscribe = null;
                }
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (userDataUnsubscribe) {
                userDataUnsubscribe();
            }
        };
    }, []);

    const loadUserData = async (uid: string) => {
        // NOTE: This legacy function expects UID. If keys are emails, this might fail unless UID matches Email.
        // Kept for interface compatibility but warning: Docs are keyed by Email now.
        if (!db) return;

        try {
            // Attempt to find user by UID query if we don't know the email?
            // For now, retaining simplistic getDoc which likely fails if key != uid.
            // Ideally should be passed email or query by field 'uid'
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

            // 1. Check if email is whitelisted
            const userDoc = await getDoc(doc(db, 'users', email.toLowerCase()));
            if (!userDoc.exists()) {
                throw new Error('This email is not authorized. Please contact your administrator to be added.');
            }

            const existingData = userDoc.data() as UserData;

            // 2. Perform the actual Firebase Auth signup
            const credential = await createUserWithEmailAndPassword(auth, email, password);

            // 3. Update the existing document with the new UID and profile info
            await updateProfile(credential.user, {
                displayName: displayName || existingData.displayName || 'User',
                photoURL: existingData.photoURL || './images/logos/boy.png'
            });

            const updatedUserData: Partial<UserData> = {
                uid: credential.user.uid,
                displayName: displayName || existingData.displayName || 'User',
                approvalStatus: 'approved' // Whitelisted users are pre-approved
            };

            await setDoc(doc(db, 'users', email.toLowerCase()), updatedUserData, { merge: true });

            console.log('[AUTH] Whitelisted signup successful for user:', email);
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

            // Force account selection to ensure users can switch accounts
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            // Removed sensitive Google Drive scopes to prevent "Google hasn't verified this app" warning
            // provider.addScope('https://www.googleapis.com/auth/drive.file');
            // provider.addScope('https://www.googleapis.com/auth/drive');

            const credential = await signInWithPopup(auth, provider);

            const email = credential.user.email?.toLowerCase();
            if (!email) throw new Error("No email provided by Google");

            // 1. Check if email is whitelisted (using email as ID for whitelist checks)
            const userDoc = await getDoc(doc(db, 'users', email));

            if (!userDoc.exists()) {
                // If it's a Super Admin, we still want them to get in even if not whitelisted (safety)
                if (email === SUPER_ADMIN_EMAIL || email === 'aksnetlink@gmail.com') {
                    const newUserData: UserData = {
                        uid: credential.user.uid,
                        email: email,
                        displayName: credential.user.displayName || 'Super Admin',
                        photoURL: credential.user.photoURL || './images/logos/boy.png',
                        role: 'super_admin',
                        approvalStatus: 'approved',
                        createdAt: new Date().toISOString(),
                        settings: {
                            wallpaper: 'wall-1',
                            theme: 'dark'
                        },
                        files: [],
                        apps: [],
                        allowedProjects: [],
                        allowedApps: null
                    };
                    await setDoc(doc(db, 'users', email), newUserData);
                    return credential.user;
                }

                // Not whitelisted - force logout and throw error
                await signOut(auth);
                throw new Error('This email is not authorized. Please contact your administrator to be added.');
            }

            // 2. User is whitelisted, update their record with UID
            await setDoc(doc(db, 'users', email), {
                uid: credential.user.uid,
                photoURL: credential.user.photoURL || './images/logos/boy.png',
                approvalStatus: 'approved'
            }, { merge: true });

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
        if (!user || !user.email) return;

        if (!db) {
            console.warn('Firestore not available. Cannot update user data in demo mode.');
            return;
        }

        try {
            const userRef = doc(db, 'users', user.email.toLowerCase());
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
