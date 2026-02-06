import { useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext-new';

/**
 * Custom hook to sync data between Firebase and local state
 * Automatically saves to Firestore when data changes
 * Automatically loads from Firestore on mount
 */
export const useFirebaseSync = (dataKey, localStorageKey) => {
    const { user } = useAuth();

    // Save data to Firebase
    const saveToFirebase = useCallback(async (data) => {
        if (!user) return;

        try {
            await setDoc(
                doc(db, 'users', user.uid),
                { [dataKey]: data },
                { merge: true }
            );
        } catch (error) {
            console.error(`Error saving ${dataKey} to Firebase:`, error);
        }
    }, [user, dataKey]);

    // Load data from Firebase (real-time listener)
    const loadFromFirebase = useCallback((callback) => {
        if (!user) return () => { };

        const unsubscribe = onSnapshot(
            doc(db, 'users', user.uid),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data()[dataKey];
                    if (data) {
                        callback(data);
                    }
                }
            },
            (error) => {
                console.error(`Error loading ${dataKey} from Firebase:`, error);
            }
        );

        return unsubscribe;
    }, [user, dataKey]);

    // Fallback to localStorage when user is not authenticated
    const saveToLocalStorage = useCallback((data) => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${dataKey} to localStorage:`, error);
        }
    }, [localStorageKey, dataKey]);

    const loadFromLocalStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem(localStorageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error(`Error loading ${dataKey} from localStorage:`, error);
            return null;
        }
    }, [localStorageKey, dataKey]);

    return {
        saveData: user ? saveToFirebase : saveToLocalStorage,
        loadData: user ? loadFromFirebase : loadFromLocalStorage,
        isCloudSync: !!user
    };
};

/**
 * Hook specifically for user settings
 */
export const useUserSettings = () => {
    return useFirebaseSync('settings', 'alphery-os-settings');
};

/**
 * Hook specifically for user files
 */
export const useUserFiles = () => {
    return useFirebaseSync('files', 'alphery-os-files');
};

/**
 * Hook specifically for desktop state (open apps, positions, etc.)
 */
export const useDesktopState = () => {
    return useFirebaseSync('desktopState', 'alphery-os-desktop-state');
};
