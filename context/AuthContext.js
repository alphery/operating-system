import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

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

    const loadUserData = async (uid) => {
        if (!db) {
            console.warn('Firestore not available in demo mode');
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const SUPER_ADMIN_EMAIL = 'alpherymail@gmail.com';

    const signup = async (email, password, displayName) => {
        if (!auth || !db) {
            throw new Error('Firebase not configured. Cannot sign up in demo mode.');
        }

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile
            await updateProfile(credential.user, {
                displayName: displayName || 'User',
                photoURL: './images/logos/boy.png' // Default avatar
            });

            // Determine role and approval status
            const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL;
            const approvalStatus = isSuperAdmin ? 'approved' : 'pending';

            // Create user document in Firestore
            await setDoc(doc(db, 'users', credential.user.uid), {
                uid: credential.user.uid,
                email: email,
                displayName: displayName || 'User',
                photoURL: './images/logos/boy.png',
                role: isSuperAdmin ? 'super_admin' : 'user',
                approvalStatus: approvalStatus,
                createdAt: new Date().toISOString(),
                settings: {
                    wallpaper: 'wall-1',
                    theme: 'dark'
                },
                files: [],
                apps: []
            });

            return credential.user;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const login = async (email, password) => {
        if (!auth) {
            throw new Error('Firebase not configured. Cannot login in demo mode.');
        }

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            return credential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        if (!auth || !db) {
            throw new Error('Firebase not configured. Cannot login with Google in demo mode.');
        }

        try {
            const provider = new GoogleAuthProvider();

            // Request Google Drive access
            provider.addScope('https://www.googleapis.com/auth/drive.file');
            provider.addScope('https://www.googleapis.com/auth/drive');

            const credential = await signInWithPopup(auth, provider);

            // Check if user document exists, if not create it
            const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

            if (!userDoc.exists()) {
                // Determine role and approval status
                const isSuperAdmin = credential.user.email.toLowerCase() === SUPER_ADMIN_EMAIL;
                const approvalStatus = isSuperAdmin ? 'approved' : 'pending';

                await setDoc(doc(db, 'users', credential.user.uid), {
                    uid: credential.user.uid,
                    email: credential.user.email,
                    displayName: credential.user.displayName || 'User',
                    photoURL: credential.user.photoURL || './images/logos/boy.png',
                    role: isSuperAdmin ? 'super_admin' : 'user',
                    approvalStatus: approvalStatus,
                    createdAt: new Date().toISOString(),
                    settings: {
                        wallpaper: 'wall-1',
                        theme: 'dark'
                    },
                    files: [],
                    apps: []
                });
            }

            return credential.user;
        } catch (error) {
            console.error('Google login error:', error);
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

    const updateUserData = async (data) => {
        if (!user) return;

        if (!db) {
            console.warn('Firestore not available. Cannot update user data in demo mode.');
            return;
        }

        try {
            await setDoc(doc(db, 'users', user.uid), data, { merge: true });
            setUserData(data);
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
