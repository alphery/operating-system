import React, { Component } from 'react';
import SmallArrow from './small_arrow';

class Slider extends Component {
	render() {
		return (
			<input
				type="range"
				onChange={this.props.onChange}
				className={this.props.className}
				name={this.props.name}
				min="0"
				max="100"
				value={this.props.value}
				step="1"
			/>
		);
	}
}

export class StatusCard extends Component {
	constructor() {
		super();
		this.wrapperRef = React.createRef();
		this.state = {
			sound_level: 75,
			brightness_level: 100,
			battery_level: 100,
			battery_charging: false,
			bluetooth_status: 'Off',
			wifi_status: 'On'
		};
	}

	componentDidMount() {
		document.addEventListener('mousedown', this.handleClickOutside);

		this.setState({
			sound_level: localStorage.getItem('sound-level') || 75,
			brightness_level: localStorage.getItem('brightness-level') || 100
		}, () => {
			const screen = document.getElementById('monitor-screen');
			if (screen) {
				screen.style.filter = `brightness(${3 / 400 * this.state.brightness_level + 0.25})`;
			}
		});

		// Battery Status
		if (navigator.getBattery) {
			navigator.getBattery().then(battery => {
				this.updateBatteryStatus(battery);
				battery.addEventListener('levelchange', () => this.updateBatteryStatus(battery));
				battery.addEventListener('chargingchange', () => this.updateBatteryStatus(battery));
			});
		}

		// WiFi Status
		this.updateNetworkStatus();
		window.addEventListener('online', this.updateNetworkStatus);
		window.addEventListener('offline', this.updateNetworkStatus);

		// Bluetooth Availability
		// @ts-ignore
		if (navigator.bluetooth && navigator.bluetooth.getAvailability) {
			// @ts-ignore
			navigator.bluetooth.getAvailability().then(available => {
				this.setState({ bluetooth_status: available ? 'On' : 'Off' });
			});
		}
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.handleClickOutside);
		window.removeEventListener('online', this.updateNetworkStatus);
		window.removeEventListener('offline', this.updateNetworkStatus);
	}

	handleClickOutside = (event) => {
		if (this.wrapperRef && this.wrapperRef.current && !this.wrapperRef.current.contains(event.target)) {
			// Call the parent toggleVisible function to close the menu
			// We need to check if the click was not on the status bar icon itself to avoid double-toggling
			if (this.props.visible && !event.target.closest('#status-bar')) {
				this.props.toggleVisible();
			}
		}
	};

	updateBatteryStatus = (battery) => {
		this.setState({
			battery_level: Math.round(battery.level * 100),
			battery_charging: battery.charging
		});
	}

	updateNetworkStatus = () => {
		this.setState({ wifi_status: navigator.onLine ? 'On' : 'Off' });
	}

	playTone = (vol, freq) => {
		if (this.soundTimeout) clearTimeout(this.soundTimeout);
		this.soundTimeout = setTimeout(() => {
			if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

			const oscillator = this.audioCtx.createOscillator();
			const gainNode = this.audioCtx.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(this.audioCtx.destination);

			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

			gainNode.gain.setValueAtTime(vol / 100, this.audioCtx.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

			oscillator.start();
			oscillator.stop(this.audioCtx.currentTime + 0.1);
		}, 50);
	}

	handleBrightness = (e) => {
		const val = e.target.value;
		this.setState({ brightness_level: val });
		localStorage.setItem('brightness-level', val);
		const screen = document.getElementById('monitor-screen');
		if (screen) {
			screen.style.filter = `brightness(${3 / 400 * val + 0.25})`;
		}
		this.playTone(this.state.sound_level, 200 + (val * 5));
	};

	handleSound = (e) => {
		const val = e.target.value;
		this.setState({ sound_level: val });
		localStorage.setItem('sound-level', val);
		this.playTone(val, 440);
	};

	render() {
		return (
			<div
				ref={this.wrapperRef}
				className={
					'absolute bg-ub-cool-grey window-transparency window-blur rounded-md py-4 top-9 right-3 shadow border-black border border-opacity-20 status-card' +
					(this.props.visible ? ' visible animateShow' : ' invisible')
				}
			>
				{/* Status Card */}
				<div className="absolute w-0 h-0 -top-1 right-6 top-arrow-up" />

				{/* PWA Install Banner */}
				{this.props.showInstallPrompt && (
					<div className="w-64 pb-1">
						<div className="mx-2 mb-2 bg-[#1C1C1E] border border-white/10 rounded-xl p-3 shadow-lg flex flex-row items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<img src="./images/logos/Dark_Logo_H.png" className="w-8 h-8 object-contain" alt="Alphery Logo" />
								<div className="flex flex-col">
									<span className="text-xs font-bold text-white">Install Alphery OS</span>
									<span className="text-[10px] text-gray-400">Full performance app</span>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									onClick={this.props.handleInstallClick}
									className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition shadow-sm"
								>
									Install
								</button>
							</div>
						</div>
						<div className="w-full border-t border-black/20 my-1"></div>
					</div>
				)}

				<div className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20">
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/audio-headphones-symbolic.svg" alt="ubuntu headphone" />
					</div>
					<Slider
						onChange={this.handleSound}
						className="ubuntu-slider w-2/3"
						value={this.state.sound_level}
						name="headphone_range"
					/>
				</div>
				<div className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20">
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/display-brightness-symbolic.svg" alt="ubuntu brightness" />
					</div>
					<Slider
						onChange={this.handleBrightness}
						className="ubuntu-slider w-2/3"
						name="brightness_range"
						value={this.state.brightness_level}
					/>
				</div>
				<div className="w-64 flex content-center justify-center">
					<div className="w-2/4 border-black border-opacity-50 border-b my-2 border-solid" />
				</div>

				{/* WiFi */}
				<div className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20">
					<div className="w-8">
						<img width="16px" height="16px" src={`./themes/Yaru/status/network-wireless-signal-${this.state.wifi_status === 'On' ? 'good' : 'none'}-symbolic.svg`} alt="ubuntu wifi" />
					</div>
					<div className="w-2/3 flex items-center justify-between text-gray-400">
						<span>WiFi: {this.state.wifi_status}</span>
						<SmallArrow angle="right" />
					</div>
				</div>

				{/* Battery */}
				<div className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20">
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/battery-good-symbolic.svg" alt="ubuntu battery" />
					</div>
					<div className="w-2/3 flex items-center justify-between text-gray-400">
						<span>{this.state.battery_charging ? 'Charging' : 'Remaining'} ({this.state.battery_level}%)</span>
						<SmallArrow angle="right" />
					</div>
				</div>

				<div className="w-64 flex content-center justify-center">
					<div className="w-2/4 border-black border-opacity-50 border-b my-2 border-solid" />
				</div>
				<div
					id="open-settings"
					className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20"
				>
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/emblem-system-symbolic.svg" alt="ubuntu settings" />
					</div>
					<div className="w-2/3 flex items-center justify-between">
						<span>Settings</span>
					</div>
				</div>
				<div
					onClick={this.props.lockScreen}
					className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20"
				>
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/changes-prevent-symbolic.svg" alt="ubuntu lock" />
					</div>
					<div className="w-2/3 flex items-center justify-between">
						<span>Lock</span>
					</div>
				</div>
				<div
					onClick={(e) => {
						e.stopPropagation();
						if (this.props.logOut) {
							this.props.logOut();
						} else {
							console.error("logOut prop is missing");
						}
					}}
					className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20 cursor-pointer active:bg-opacity-40"
					role="button"
					tabIndex={0}
				>
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/system-shutdown-symbolic.svg" alt="ubuntu power" />
					</div>
					<div className="w-2/3 flex items-center justify-between">
						<span>Sign Out</span>
					</div>
				</div>
			</div >
		);
	}
}

export default StatusCard;
