import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext-new';
import BootingScreen from './screen/booting_screen';
import Desktop from './screen/desktop';
import LockScreen from './screen/lock_screen';
import FirebaseAuthScreen from './screen/firebase_auth_screen';
import PendingApprovalScreen from './screen/pending_approval_screen';
import Navbar from './screen/navbar';
import ReactGA from 'react-ga';
import SessionManager from './util components/session';
import PerformanceManager from '../utils/PerformanceManager';

// Define a local user interface that matches how it's used in the component
interface LocalUser {
	username: string | null;
	displayName: string | null;
	image: string | null;
	password?: string;
	uid?: string; // Added uid for correct app management
}

export default function Ubuntu() {
	const { user, platformUser, currentTenant, signOut } = useAuth();
	const [screenLocked, setScreenLocked] = useState<boolean>(false);
	const [bgImageName, setBgImageName] = useState<string>('wall-8');
	const [bootingScreen, setBootingScreen] = useState<boolean>(true);
	const [shutDownScreen, setShutDownScreen] = useState<boolean>(false);
	const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
	const [showFirebaseAuth, setShowFirebaseAuth] = useState<boolean>(false);
	const [demoMode, setDemoMode] = useState<boolean>(false);

	// --- STICKY FULLSCREEN PERSISTENCE ---
	useEffect(() => {
		const handleFullscreenChange = () => {
			const isFS = !!document.fullscreenElement;
			localStorage.setItem('sticky-fullscreen', isFS ? 'true' : 'false');
		};

		const restoreFullscreen = () => {
			if (localStorage.getItem('sticky-fullscreen') === 'true' && !document.fullscreenElement) {
				const docElm = document.documentElement as any;
				try {
					if (docElm.requestFullscreen) docElm.requestFullscreen();
					else if (docElm.mozRequestFullScreen) docElm.mozRequestFullScreen();
					else if (docElm.webkitRequestFullScreen) docElm.webkitRequestFullScreen();
					else if (docElm.msRequestFullscreen) docElm.msRequestFullscreen();
				} catch (e) { }
			}
			// One-time restoration, remove after first click
			window.removeEventListener('mousedown', restoreFullscreen);
		};

		// Sync current state
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		// If we were fullscreen before refresh, wait for first interaction to restore
		if (localStorage.getItem('sticky-fullscreen') === 'true') {
			window.addEventListener('mousedown', restoreFullscreen);
		}

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			window.removeEventListener('mousedown', restoreFullscreen);
		};
	}, []);

	// Initialize Performance Manager
	useEffect(() => {
		const perfManager = PerformanceManager.getInstance();
		console.log('[Ubuntu] Performance Level:', perfManager.getPerformanceLevel());
	}, []);

	const handleLogout = async () => {
		ReactGA.pageview('/logout');
		try {
			// Clear fullscreen flag on logout
			localStorage.removeItem('sticky-fullscreen');
			await signOut();
			setCurrentUser(null);
			setDemoMode(false);
			setScreenLocked(false);
			setShowFirebaseAuth(true);
		} catch (e) {
			console.error('Logout failed:', e);
			// Only reload if logout throws error
			window.location.reload();
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

	useEffect(() => {
		getLocalData();
	}, []);

	// In the new system, if we have a platformUser, they are basic-approved
	const isApproved = useMemo(() => {
		return !!platformUser;
	}, [platformUser]);

	const isPending = useMemo(() => {
		return !!user && !platformUser;
	}, [user, platformUser]);

	useEffect(() => {
		console.log('[UBUNTU] Auth state changed:', {
			hasUser: !!user,
			hasPlatformUser: !!platformUser,
			isApproved,
			isPending
		});

		if (!user && !platformUser) {
			console.log('[UBUNTU] No session detected, showing auth screen');
			setCurrentUser(null);
			setDemoMode(false);
			// Show Firebase auth screen instead of redirecting
			if (!bootingScreen) {
				setShowFirebaseAuth(true);
			}
			return;
		}

		if (platformUser && isApproved) {
			// User is approved - proceed normally
			const firebaseUser: LocalUser = {
				uid: platformUser.id, // Use UUID from backend
				username: platformUser.email,
				displayName: platformUser.displayName || (user ? user.displayName : 'Admin'),
				image: platformUser.photoUrl || (user ? user.photoURL : null),
				password: '' // Not needed
			};
			console.log('[UBUNTU] Session active, setting current user:', firebaseUser);
			setCurrentUser(firebaseUser);
			setScreenLocked(false);
			setShowFirebaseAuth(false);
		}
	}, [user, platformUser, isApproved, bootingScreen]);

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
		}
		// Don't automatically show Firebase auth - let useEffect handle redirect
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

		// Save to backend if user is logged in
		if (user && platformUser) {
			// TODO: Implement updatePlatformUser in AuthContext-new
			// await updatePlatformUser({ settings: { ...platformUser.settings, wallpaper: imgName } });
		}
		// Save to local session for local users
		else if (currentUser) {
			SessionManager.setItem('bg-image', imgName);
		}
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
			{/* Pending Approval Screen - shows if user is logged in but not approved */}
			{isPending && !bootingScreen && (
				<PendingApprovalScreen />
			)}

			{/* Firebase Auth Screen - shows if user not authenticated */}
			{!user && showFirebaseAuth && !bootingScreen && (
				<FirebaseAuthScreen onAuthSuccess={handleFirebaseAuthSuccess} />
			)}

			{/* Lock Screen - for local users or locked Firebase users */}
			{((!user && !platformUser && !showFirebaseAuth) || isApproved || demoMode) && (
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
			{(user || platformUser || demoMode) && (
				<Navbar
					lockScreen={lockScreen}
					shutDown={shutDown}
					logOut={handleLogout}
					user={currentUser}
					showInstallPrompt={showInstallPrompt}
					handleInstallClick={handleInstallClick}
				/>
			)}
			<Desktop
				bg_image_name={bgImageName}
				changeBackgroundImage={changeBackgroundImage}
				user={currentUser}
				userData={platformUser}
				currentTenant={currentTenant}
			/>
		</div>
	);
}
