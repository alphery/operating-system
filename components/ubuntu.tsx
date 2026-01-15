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

// Define a local user interface that matches how it's used in the component
interface LocalUser {
	username: string | null;
	displayName: string | null;
	image: string | null;
	password?: string;
	uid?: string; // Added uid for correct app management
}

export default function Ubuntu() {
	const { user, userData, updateUserData } = useAuth();
	const [screenLocked, setScreenLocked] = useState<boolean>(false);
	const [bgImageName, setBgImageName] = useState<string>('wall-8');
	const [bootingScreen, setBootingScreen] = useState<boolean>(true);
	const [shutDownScreen, setShutDownScreen] = useState<boolean>(false);
	const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
	const [showFirebaseAuth, setShowFirebaseAuth] = useState<boolean>(false);
	const [demoMode, setDemoMode] = useState<boolean>(false);

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
		console.log('[UBUNTU] Auth state changed:', {
			hasUser: !!user,
			hasUserData: !!userData,
			approvalStatus: userData?.approvalStatus,
			isApproved,
			isPending
		});

		if (user && userData && isApproved) {
			// User is approved - proceed normally
			const firebaseUser: LocalUser = {
				uid: user.uid, // PASS UID HERE
				username: user.email,
				displayName: userData.displayName || user.displayName,
				image: userData.photoURL || user.photoURL,
				password: '' // Not needed for Firebase users
			};
			console.log('[UBUNTU] User approved, setting current user:', firebaseUser);
			setCurrentUser(firebaseUser);
			setScreenLocked(false);
			setShowFirebaseAuth(false);

			// Load user's wallpaper from Firebase
			if (userData.settings?.wallpaper) {
				setBgImageName(userData.settings.wallpaper);
			}
		} else if (user && userData && !isApproved) {
			// User not approved
			console.log('[UBUNTU] User pending approval');
			setShowFirebaseAuth(false);
			setCurrentUser(null);
		}
	}, [user, userData, isApproved]);

	const setTimeOutBootScreen = () => {
		setTimeout(() => {
			setBootingScreen(false);
		}, 2000);
	};

	const getLocalData = () => {
		setTimeOutBootScreen();

		let isShutDown = localStorage.getItem('shut-down');
		if (isShutDown !== null && isShutDown !== undefined && isShutDown === 'true') {
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

	const unLockScreen = (localUser: LocalUser) => {
		ReactGA.pageview('/desktop');
		window.removeEventListener('click', unLockScreen as any);
		window.removeEventListener('keypress', unLockScreen as any);

		// Set Session for local users
		if (localUser && localUser.username) {
			SessionManager.setCurrentUser(localUser.username);
			const userBg = SessionManager.getBackgroundImage(localUser.username);
			setCurrentUser(localUser);
			setBgImageName(userBg);
		}

		setScreenLocked(false);
	};

	const handleFirebaseAuthSuccess = (options: { demoMode?: boolean } = {}) => {
		ReactGA.pageview('/desktop');
		setShowFirebaseAuth(false);

		if (options.demoMode) {
			// Demo mode - show lock screen with demo user only
			console.log('[UBUNTU] Demo mode activated');
			setDemoMode(true);
			setScreenLocked(true);
		} else {
			// Normal Firebase login - wait for approval check
			setDemoMode(false);
			setScreenLocked(false);
		}
	};

	const changeBackgroundImage = async (imgName: string) => {
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
			document.getElementById('status-bar')?.blur();
		}
		setShutDownScreen(true);
		localStorage.setItem('shut-down', 'true');
	};

	const turnOn = () => {
		ReactGA.pageview('/desktop');
		setShutDownScreen(false);
		setBootingScreen(true);
		setTimeOutBootScreen();
		localStorage.setItem('shut-down', 'false');
	};

	// PWA Install Prompt
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
	const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);

	useEffect(() => {
		const handler = (e: any) => {
			e.preventDefault();
			setDeferredPrompt(e);
			setShowInstallPrompt(true);
		};
		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			setDeferredPrompt(null);
		}
		setShowInstallPrompt(false);
	};

	return (
		<div className="w-screen h-screen overflow-hidden" id="monitor-screen">
			{/* PWA Install Modal */}
			{showInstallPrompt && (
				<div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-gray-900 bg-opacity-80 backdrop-blur-2xl border border-gray-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 transition-all duration-500 animate-in slide-in-from-top-4 fade-in">
					<img src="/images/logos/Dark Logo H.png" className="w-10 h-10 object-contain drop-shadow-lg" alt="Logo" />
					<div>
						<h3 className="font-bold text-sm tracking-wide">Install Alphery OS</h3>
						<p className="text-xs text-gray-400">Experience full performance app</p>
					</div>
					<div className="flex gap-2 ml-2 pl-2 border-l border-gray-700">
						<button
							onClick={() => setShowInstallPrompt(false)}
							className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition"
						>
							Later
						</button>
						<button
							onClick={handleInstallClick}
							className="px-4 py-1.5 text-xs font-bold bg-white text-black hover:bg-gray-200 rounded-lg shadow-lg active:scale-95 transition"
						>
							Install App
						</button>
					</div>
				</div>
			)}

			{/* Pending Approval Screen - shows if user is logged in but not approved */}
			{user && userData && isPending && !bootingScreen && (
				<PendingApprovalScreen />
			)}

			{/* Firebase Auth Screen - shows if user not authenticated */}
			{!user && showFirebaseAuth && !bootingScreen && (
				<FirebaseAuthScreen onAuthSuccess={handleFirebaseAuthSuccess} />
			)}

			{/* Lock Screen - for local users or locked Firebase users */}
			{((!user && !showFirebaseAuth) || (user && userData && isApproved) || demoMode) && (
				<LockScreen
					isLocked={screenLocked}
					bgImgName={bgImageName}
					unLockScreen={unLockScreen}
					demoMode={demoMode}
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
				userData={userData}
				updateUserData={updateUserData}
			/>
		</div>
	);
}
