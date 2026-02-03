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
			<div className="absolute top-0 right-0 w-screen h-8 shadow-md flex flex-nowrap justify-between items-center bg-white/10 backdrop-blur-2xl border-b border-white/10 text-white text-sm select-none z-50 transition-all duration-300">
				{/* Mobile Status Bar Layout (Hidden on Desktop) */}
				<div
					className="flex md:hidden w-full justify-between items-center px-4 h-full cursor-pointer active:bg-white/10 transition-colors"
					onClick={() => this.setState({ status_card: !this.state.status_card })}
				>
					<div className="flex items-center gap-2">
						<img className="h-5 w-auto object-contain mr-1 filter drop-shadow-sm" src="./images/logos/Dark_Logo_H.png" alt="logo" />
						{/* Time on left for mobile (Android style) */}
						<Clock />
					</div>
					{/* Signal/Battery System Icons on right */}
					<div className="flex items-center gap-3">
						<div className="flex items-center"><Status /></div>
					</div>
				</div>

				{/* Desktop Layout (Hidden on Mobile) */}
				<div className="hidden md:flex items-center pl-4 pr-4 h-full outline-none">
					{/* Apple Logo */}
					<div className="mr-5 cursor-default hover:opacity-80 relative group transition-opacity">
						<img className="h-5 w-auto object-contain drop-shadow-sm" src="./images/logos/Dark_Logo_H.png" alt="Alphery OS Logo" />
						{/* Dropdown for "About Alphery" */}
						<div className="absolute top-full left-0 mt-1 w-56 bg-white/80 backdrop-blur-2xl rounded-xl shadow-2xl py-1 hidden group-hover:block border border-white/20 text-slate-800 animate-in fade-in zoom-in duration-200">
							<div
								onClick={() => {
									window.dispatchEvent(new CustomEvent('open_app', { detail: { appId: 'about-alphery' } }));
								}}
								className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium"
							>
								About Alphery
							</div>
							<div className="h-px bg-slate-200 my-1 mx-2"></div>
							<div
								onClick={() => {
									window.dispatchEvent(new CustomEvent('open_app', { detail: { appId: 'settings' } }));
								}}
								className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium"
							>
								System Preferences...
							</div>
							<div
								onClick={() => window.location.reload()}
								className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium"
							>
								Force Quit...
							</div>
							<div className="h-px bg-slate-200 my-1 mx-2"></div>
							<div onClick={this.props.lockScreen} className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium">Sleep</div>
							<div onClick={this.props.shutDown} className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium">Restart...</div>
							<div onClick={this.props.shutDown} className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium">Shut Down...</div>
							<div className="h-px bg-slate-200 my-1 mx-2"></div>
							<div onClick={this.props.lockScreen} className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium">Lock Screen</div>
							<div onClick={this.props.lockScreen} className="px-4 py-1.5 hover:bg-blue-500 hover:text-white cursor-default rounded-md mx-1 transition-colors font-medium">Log Out</div>
						</div>
					</div>


					{/* Menus */}
					<div className="flex gap-5 text-[13px] font-medium tracking-wide opacity-90 drop-shadow-sm">
						{['File', 'Edit', 'View', 'Go', 'Tools', 'Help'].map(menu => (
							<div
								key={menu}
								className="relative navbar-menu-item"
								onMouseEnter={() => this.handleMouseEnter(menu)}
							>
								<span
									className={`cursor-default hover:opacity-100 transition-opacity px-2 py-1 rounded ${this.state.active_menu === menu ? 'bg-white/20' : 'hover:bg-white/10'}`}
									onClick={(e) => this.handleMenuClick(e, menu)}
								>
									{menu}
								</span>
								{this.renderMenuDropdown(menu)}
							</div>
						))}
					</div>
				</div>

				{/* Desktop Right Side: Status Items (Hidden on Mobile) */}
				<div className="hidden md:flex items-center h-full">
					<div
						tabIndex="0"
						className={
							'pl-2 pr-2 text-xs md:text-sm outline-none transition duration-100 ease-in-out border-b-2 border-transparent focus:border-white/50 py-1 font-medium drop-shadow-sm'
						}
					>
						{/* We could enhance Clock here to look more like QOS */}
						<Clock />
					</div>
					<div
						id="status-bar"
						onClick={() => {
							this.setState({ status_card: !this.state.status_card });
						}}
						className={
							'relative pr-3 pl-3 outline-none transition duration-100 ease-in-out border-b-2 border-transparent focus:border-white/50 py-1 '
						}
					>
						<Status />
					</div>
				</div>

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
