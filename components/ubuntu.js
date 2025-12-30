import React, { Component } from 'react';
import BootingScreen from './screen/booting_screen';
import Desktop from './screen/desktop';
import LockScreen from './screen/lock_screen';
import Navbar from './screen/navbar';
import ReactGA from 'react-ga';
import SessionManager from './util components/session';

export default class Ubuntu extends Component {
	constructor() {
		super();
		this.state = {
			screen_locked: false,
			bg_image_name: 'wall-8',
			booting_screen: true,
			shutDownScreen: false,
			currentUser: null
		};
	}

	componentDidMount() {
		this.getLocalData();
	}

	setTimeOutBootScreen = () => {
		setTimeout(() => {
			this.setState({ booting_screen: false });
		}, 4000);
	};

	getLocalData = () => {
		// Global system state (not per user yet, as we don't know who is logged in until they unlock)
		// However, we can check if a session was active? 
		// For security, we always start locked if we are "rebooting" or refreshing.

		let booting_screen = localStorage.getItem('booting_screen');
		this.setTimeOutBootScreen();

		let shut_down = localStorage.getItem('shut-down');
		if (shut_down !== null && shut_down !== undefined && shut_down === 'true') this.shutDown();
		else {
			this.setState({ screen_locked: true });
		}
	};

	lockScreen = () => {
		ReactGA.pageview('/lock-screen');
		document.getElementById('status-bar').blur();
		setTimeout(() => {
			this.setState({ screen_locked: true });
		}, 100);
		// We don't save 'screen-locked' to local storage globally anymore because we want to force login on refresh
	};

	unLockScreen = (user) => {
		ReactGA.pageview('/desktop');
		window.removeEventListener('click', this.unLockScreen);
		window.removeEventListener('keypress', this.unLockScreen);

		// Set Session
		SessionManager.setCurrentUser(user.username);

		// Load User Preferences
		const userBg = SessionManager.getBackgroundImage(user.username);

		this.setState({
			screen_locked: false,
			currentUser: user,
			bg_image_name: userBg
		});
	};

	changeBackgroundImage = (img_name) => {
		this.setState({ bg_image_name: img_name });
		// Save to User Session
		if (this.state.currentUser) {
			SessionManager.setItem('bg-image', img_name);
		}
	};

	shutDown = () => {
		ReactGA.pageview('/switch-off');
		ReactGA.event({
			category: `Screen Change`,
			action: `Switched off the Ubuntu`
		});

		document.getElementById('status-bar').blur();
		this.setState({ shutDownScreen: true });
		localStorage.setItem('shut-down', true);
	};

	turnOn = () => {
		ReactGA.pageview('/desktop');

		this.setState({ shutDownScreen: false, booting_screen: true });
		this.setTimeOutBootScreen();
		localStorage.setItem('shut-down', false);
	};

	render() {
		return (
			<div className="w-screen h-screen overflow-hidden" id="monitor-screen">
				<LockScreen
					isLocked={this.state.screen_locked}
					bgImgName={this.state.bg_image_name}
					unLockScreen={this.unLockScreen}
				/>
				<BootingScreen
					visible={this.state.booting_screen}
					isShutDown={this.state.shutDownScreen}
					turnOn={this.turnOn}
				/>
				<Navbar
					lockScreen={this.lockScreen}
					shutDown={this.shutDown}
					user={this.state.currentUser}
				/>
				<Desktop
					bg_image_name={this.state.bg_image_name}
					changeBackgroundImage={this.changeBackgroundImage}
					user={this.state.currentUser}
				/>
			</div>
		);
	}
}
