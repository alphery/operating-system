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
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const signup = async (email, password, displayName) => {
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile
            await updateProfile(credential.user, {
                displayName: displayName || 'User',
                photoURL: './images/logos/boy.png' // Default avatar
            });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', credential.user.uid), {
                uid: credential.user.uid,
                email: email,
                displayName: displayName || 'User',
                photoURL: './images/logos/boy.png',
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
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            return credential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(auth, provider);

            // Check if user document exists, if not create it
            const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', credential.user.uid), {
                    uid: credential.user.uid,
                    email: credential.user.email,
                    displayName: credential.user.displayName || 'User',
                    photoURL: credential.user.photoURL || './images/logos/boy.png',
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
