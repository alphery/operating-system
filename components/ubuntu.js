import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import BootingScreen from './screen/booting_screen';
import Desktop from './screen/desktop';
import LockScreen from './screen/lock_screen';
import FirebaseAuthScreen from './screen/firebase_auth_screen';
import PendingApprovalScreen from './screen/pending_approval_screen';
import Navbar from './screen/navbar';
import ReactGA from 'react-ga';
import SessionManager from './util components/session';

export default function Ubuntu() {
	const { user, userData, updateUserData } = useAuth();
	const [screenLocked, setScreenLocked] = useState(false);
	const [bgImageName, setBgImageName] = useState('wall-8');
	const [bootingScreen, setBootingScreen] = useState(true);
	const [shutDownScreen, setShutDownScreen] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);
	const [showFirebaseAuth, setShowFirebaseAuth] = useState(false);

	useEffect(() => {
		getLocalData();
	}, []);

	// Memoize approval status check to prevent unnecessary re-renders
	const isApproved = useMemo(() => {
		if (!user || !userData) return false;
		return userData.approvalStatus === 'approved';
	}, [user, userData?.approvalStatus]);

	const isPending = useMemo(() => {
		if (!user || !userData) return false;
		return userData.approvalStatus !== 'approved';
	}, [user, userData?.approvalStatus]);

	// Update currentUser when Firebase user changes
	useEffect(() => {
		if (user && userData && isApproved) {
			// User is approved - proceed normally
			const firebaseUser = {
				username: user.email,
				displayName: userData.displayName || user.displayName,
				image: userData.photoURL || user.photoURL,
				password: '' // Not needed for Firebase users
			};
			setCurrentUser(firebaseUser);
			setScreenLocked(false);
			setShowFirebaseAuth(false);

			// Load user's wallpaper from Firebase
			if (userData.settings?.wallpaper) {
				setBgImageName(userData.settings.wallpaper);
			}
		} else if (user && userData && !isApproved) {
			// User not approved
			setShowFirebaseAuth(false);
			setCurrentUser(null);
		}
	}, [user, userData, isApproved]);

	const setTimeOutBootScreen = () => {
		setTimeout(() => {
			setBootingScreen(false);
		}, 4000);
	};

	const getLocalData = () => {
		setTimeOutBootScreen();

		let shutDown = localStorage.getItem('shut-down');
		if (shutDown !== null && shutDown !== undefined && shutDown === 'true') {
			shutDown();
		} else {
			// Show Firebase auth if user is not logged in
			// Otherwise show lock screen for local users
			setShowFirebaseAuth(true);
		}
	};

	const lockScreen = () => {
		ReactGA.pageview('/lock-screen');
		if (document.getElementById('status-bar')) {
			document.getElementById('status-bar').blur();
		}
		setTimeout(() => {
			if (user) {
				// Firebase users - just lock to lock screen
				setScreenLocked(true);
			} else {
				// Local users - show lock screen
				setScreenLocked(true);
			}
		}, 100);
	};

	const unLockScreen = (localUser) => {
		ReactGA.pageview('/desktop');
		window.removeEventListener('click', unLockScreen);
		window.removeEventListener('keypress', unLockScreen);

		// Set Session for local users
		if (localUser && localUser.username) {
			SessionManager.setCurrentUser(localUser.username);
			const userBg = SessionManager.getBackgroundImage(localUser.username);
			setCurrentUser(localUser);
			setBgImageName(userBg);
		}

		setScreenLocked(false);
	};

	const handleFirebaseAuthSuccess = () => {
		ReactGA.pageview('/desktop');
		setShowFirebaseAuth(false);
		setScreenLocked(false);
	};

	const changeBackgroundImage = async (imgName) => {
		setBgImageName(imgName);

		// Save to Firebase if user is logged in
		if (user && userData && updateUserData) {
			await updateUserData({
				...userData,
				settings: {
					...userData.settings,
					wallpaper: imgName
				}
			});
		}
		// Save to local session for local users
		else if (currentUser) {
			SessionManager.setItem('bg-image', imgName);
		}
	};

	const shutDown = () => {
		ReactGA.pageview('/switch-off');
		ReactGA.event({
			category: `Screen Change`,
			action: `Switched off the Ubuntu`
		});

		if (document.getElementById('status-bar')) {
			document.getElementById('status-bar').blur();
		}
		setShutDownScreen(true);
		localStorage.setItem('shut-down', true);
	};

	const turnOn = () => {
		ReactGA.pageview('/desktop');
		setShutDownScreen(false);
		setBootingScreen(true);
		setTimeOutBootScreen();
		localStorage.setItem('shut-down', false);
	};

	return (
		<div className="w-screen h-screen overflow-hidden" id="monitor-screen">
			{/* Pending Approval Screen - shows if user is logged in but not approved */}
			{user && userData && userData.approvalStatus !== 'approved' && (
				<PendingApprovalScreen />
			)}

			{/* Firebase Auth Screen - shows if user not authenticated */}
			{!user && showFirebaseAuth && (
				<FirebaseAuthScreen onAuthSuccess={handleFirebaseAuthSuccess} />
			)}

			{/* Lock Screen - for local users or locked Firebase users */}
			{!showFirebaseAuth && user && userData && userData.approvalStatus === 'approved' && (
				<LockScreen
					isLocked={screenLocked}
					bgImgName={bgImageName}
					unLockScreen={unLockScreen}
				/>
			)}

			<BootingScreen
				visible={bootingScreen}
				isShutDown={shutDownScreen}
				turnOn={turnOn}
			/>
			<Navbar
				lockScreen={lockScreen}
				shutDown={shutDown}
				user={currentUser}
			/>
			<Desktop
				bg_image_name={bgImageName}
				changeBackgroundImage={changeBackgroundImage}
				user={currentUser}
			/>
		</div>
	);
}
