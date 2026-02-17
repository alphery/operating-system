import React, { Component } from 'react';
import Clock from '../util components/clock';
import Status from '../util components/status';
import StatusCard from '../util components/status_card';

export default class Navbar extends Component {
	constructor() {
		super();
		this.state = {
			status_card: false,
			active_menu: null
		};
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClickOutside);
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClickOutside);
	}

	handleClickOutside = (e) => {
		if (this.state.active_menu && !e.target.closest('.navbar-menu-item')) {
			this.setState({ active_menu: null });
		}
	}

	handleMenuClick = (e, menu) => {
		e.stopPropagation();
		this.setState({ active_menu: this.state.active_menu === menu ? null : menu });
	}

	openApp = (appId) => {
		window.dispatchEvent(new CustomEvent('open_app', { detail: { appId: appId } }));
		this.setState({ active_menu: null });
	}

	renderMenuDropdown = (menuName) => {
		if (this.state.active_menu !== menuName) return null;

		const commonClasses = "absolute top-full left-0 mt-1 min-w-[200px] bg-white/90 backdrop-blur-2xl rounded-xl shadow-2xl py-1.5 border border-white/20 text-slate-800 animate-in fade-in zoom-in-95 duration-150 z-50";

		const itemClasses = "px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium flex justify-between items-center text-sm";
		const separatorClasses = "h-px bg-slate-200 my-1 mx-2";

		const renderItems = (items) => {
			return items.map((item, idx) => {
				if (item.type === 'separator') return <div key={idx} className={separatorClasses}></div>;
				return (
					<div
						key={idx}
						className={itemClasses}
						onClick={(e) => {
							e.stopPropagation();
							if (item.action) item.action();
							this.setState({ active_menu: null });
						}}
					>
						<span>{item.label}</span>
						{item.shortcut && <span className="opacity-50 text-xs ml-4">{item.shortcut}</span>}
					</div>
				);
			});
		};

		let items = [];
		switch (menuName) {
			case 'File':
				items = [
					{ label: 'New Window', action: () => this.openApp('terminal') },
					{ label: 'New Folder', action: () => alert("New Folder action") },
					{ type: 'separator' },
					{ label: 'Close', shortcut: '⌘W', action: () => alert("Close Window") },
				];
				break;
			case 'Edit':
				items = [
					{ label: 'Undo', shortcut: '⌘Z', action: () => { } },
					{ label: 'Redo', shortcut: '⇧⌘Z', action: () => { } },
					{ type: 'separator' },
					{ label: 'Cut', shortcut: '⌘X', action: () => { } },
					{ label: 'Copy', shortcut: '⌘C', action: () => { } },
					{ label: 'Paste', shortcut: '⌘V', action: () => { } },
					{ check: true, label: 'Select All', shortcut: '⌘A', action: () => { } },
				];
				break;
			case 'View':
				items = [
					{ label: 'Enter Full Screen', shortcut: '⌃⌘F', action: () => document.documentElement.requestFullscreen().catch(() => { }) },
					{ type: 'separator' },
					{ label: 'Actual Size', action: () => { } },
					{ label: 'Zoom In', action: () => { } },
					{ label: 'Zoom Out', action: () => { } },
				];
				break;
			case 'Go':
				items = [
					{ label: 'Home', shortcut: '⇧⌘H', action: () => this.openApp('file-manager') },
					{ label: 'Desktop', shortcut: '⇧⌘D', action: () => { } },
					{ label: 'Downloads', shortcut: '⌥⌘L', action: () => this.openApp('file-manager') },
					{ type: 'separator' },
					{ label: 'Applications', shortcut: '⇧⌘A', action: () => { } },
					{ label: 'Utilities', shortcut: '⇧⌘U', action: () => this.openApp('settings') },
				];
				break;
			case 'Tools':
				items = [
					{ label: 'Terminal', action: () => this.openApp('terminal') },
					{ label: 'Calculator', action: () => this.openApp('calculator') },
					{ label: 'Settings', action: () => this.openApp('settings') },
				];
				break;
			case 'Help':
				items = [
					{ label: 'Alphery OS Help', action: () => this.openApp('chrome') },
					{ type: 'separator' },
					{ label: 'Report an Issue', action: () => { } },
				];
				break;
			default:
				return null;
		}

		return (
			<div className={commonClasses}>
				{renderItems(items)}
			</div>
		);
	}

	handleMouseEnter = (menu) => {
		if (this.state.active_menu) {
			this.setState({ active_menu: menu });
		}
	}

	render() {
		return (
			<div className="absolute top-0 right-0 w-screen h-10 md:h-8 shadow-none md:shadow-md flex flex-nowrap justify-between items-center bg-[#0a0f1c] md:bg-white/10 md:backdrop-blur-2xl border-b border-white/5 md:border-white/10 text-white text-sm select-none z-50 transition-all duration-300">

				{/* --- MOBILE STATUS BAR LAYOUT (Android/iOS Style) --- */}
				<div
					className="flex md:hidden w-full justify-between items-center px-6 h-full cursor-pointer active:bg-white/5 transition-colors"
					onClick={() => this.setState({ status_card: !this.state.status_card })}
				>
					{/* Left: Time */}
					<div className="font-bold text-sm tracking-wide">
						<Clock />
					</div>

					{/* Center: Dynamic Island / Notch Placeholder (Optional visual) */}
					{/* <div className="w-24 h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-0"></div> */}

					{/* Right: Status Icons */}
					<div className="flex items-center gap-4">
						<Status />
					</div>
				</div>

				{/* --- DESKTOP LAYOUT --- */}
				<div className="hidden md:flex flex-1 items-center pl-4 pr-4 h-full outline-none justify-between">

					{/* Left Side: Logo & Menus */}
					<div className="flex items-center gap-6">
						{/* Logo & Dropdown */}
						<div className="relative group cursor-default">
							<img className="h-4 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" src="./images/logos/Dark_Logo_H.png" alt="Alphery OS Logo" />

							{/* Dropdown Menu */}
							<div className="absolute top-full left-0 mt-2 w-64 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl py-2 hidden group-hover:block animate-in fade-in zoom-in duration-200 z-50">
								<div className="px-4 py-2 hover:bg-blue-600 cursor-pointer transition-colors"
									onClick={() => window.dispatchEvent(new CustomEvent('open_app', { detail: { appId: 'about-alphery' } }))}>
									About Alphery OS
								</div>
								<div className="h-px bg-white/10 my-1 mx-3"></div>
								<div className="px-4 py-2 hover:bg-blue-600 cursor-pointer transition-colors"
									onClick={() => window.dispatchEvent(new CustomEvent('open_app', { detail: { appId: 'settings' } }))}>
									System Settings...
								</div>
								<div className="h-px bg-white/10 my-1 mx-3"></div>
								<div className="px-4 py-2 hover:bg-blue-600 cursor-pointer transition-colors" onClick={this.props.lockScreen}>Lock Screen</div>
								<div className="px-4 py-2 hover:bg-blue-600 cursor-pointer transition-colors" onClick={this.props.logOut}>Log Out...</div>
								<div className="px-4 py-2 hover:bg-red-600 cursor-pointer transition-colors text-red-300 hover:text-white" onClick={this.props.shutDown}>Shut Down</div>
							</div>
						</div>

						{/* App Menus (File, Edit, etc.) */}
						<div className="flex gap-1 text-[13px] font-medium tracking-wide text-gray-200">
							{['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map(menu => (
								<div
									key={menu}
									className="relative navbar-menu-item"
									onMouseEnter={() => this.handleMouseEnter(menu)}
								>
									<span
										className={`cursor-default px-3 py-1 rounded-md transition-all ${this.state.active_menu === menu ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'}`}
										onClick={(e) => this.handleMenuClick(e, menu)}
									>
										{menu}
									</span>
									{this.renderMenuDropdown(menu)}
								</div>
							))}
						</div>
					</div>

					{/* Right Side: Clock & Status */}
					<div className="flex items-center gap-4 h-full">
						<div className="text-xs font-medium opacity-90 hover:opacity-100 transition-opacity">
							<Clock />
						</div>
						<div
							id="status-bar"
							onClick={() => this.setState({ status_card: !this.state.status_card })}
							className="h-6 px-2 flex items-center justify-center rounded-md hover:bg-white/10 cursor-pointer transition-colors active:bg-white/20"
						>
							<Status />
						</div>
					</div>
				</div>

				{/* Control Center / Status Card */}
				<StatusCard
					shutDown={this.props.shutDown}
					logOut={this.props.logOut}
					lockScreen={this.props.lockScreen}
					visible={this.state.status_card}
					toggleVisible={(e) => {
						if (e && document.getElementById('status-bar') && document.getElementById('status-bar').contains(e.target)) return;
						this.setState({ status_card: false });
					}}
					showInstallPrompt={this.props.showInstallPrompt}
					handleInstallClick={this.props.handleInstallClick}
				/>
			</div>
		);
	}
}
