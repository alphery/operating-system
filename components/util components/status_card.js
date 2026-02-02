import React, { Component } from 'react';
import SmallArrow from './small_arrow';
import onClickOutside from 'react-onclickoutside';

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
			sound_level: 75, // better of setting default values from localStorage
			brightness_level: 100 // setting default value to 100 so that by default its always full.
		};
	}
	handleClickOutside = () => {
		this.props.toggleVisible();
	};
	componentDidMount() {
		this.setState({
			sound_level: localStorage.getItem('sound-level') || 75,
			brightness_level: localStorage.getItem('brightness-level') || 100
		}, () => {
			document.getElementById('monitor-screen').style.filter = `brightness(${3 / 400 * this.state.brightness_level +
				0.25})`;
		})
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
		document.getElementById('monitor-screen').style.filter = `brightness(${3 / 400 * val + 0.25})`;

		// Pitch maps to brightness (low=deep, high=sharp)
		// Volume fixed at current sound level
		this.playTone(this.state.sound_level, 200 + (val * 5));
	};

	handleSound = (e) => {
		const val = e.target.value;
		this.setState({ sound_level: val });
		localStorage.setItem('sound-level', val);
		this.playTone(val, 440); // Fixed pitch A4
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
				{' '}
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
								{/* <button className="text-[10px] text-gray-400 font-medium hover:text-white transition">Later</button> */}
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
				<div className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20">
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/network-wireless-signal-good-symbolic.svg" alt="ubuntu wifi" />
					</div>
					<div className="w-2/3 flex items-center justify-between text-gray-400">
						<span>WiFi</span>
						<SmallArrow angle="right" />
					</div>
				</div>
				<div className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20">
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/bluetooth-symbolic.svg" alt="ubuntu bluetooth" />
					</div>
					<div className="w-2/3 flex items-center justify-between text-gray-400">
						<span>Off</span>
						<SmallArrow angle="right" />
					</div>
				</div>
				<div className="w-64 py-1.5 flex items-center justify-center bg-ub-cool-grey hover:bg-ub-warm-grey hover:bg-opacity-20">
					<div className="w-8">
						<img width="16px" height="16px" src="./themes/Yaru/status/battery-good-symbolic.svg" alt="ubuntu battery" />
					</div>
					<div className="w-2/3 flex items-center justify-between text-gray-400">
						<span>2:40 Remaining (69%)</span>
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

export default onClickOutside(StatusCard);
