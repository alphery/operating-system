import React, { Component } from 'react';
import Clock from '../util components/clock';
import Status from '../util components/status';
import StatusCard from '../util components/status_card';

export default class Navbar extends Component {
	constructor() {
		super();
		this.state = {
			status_card: false
		};
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
				<div tabIndex="0" className="hidden md:flex items-center pl-4 pr-4 h-full outline-none transition duration-100 ease-in-out border-b-2 border-transparent focus:border-white/50">
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

					{/* App Name */}
					<span className="font-bold mr-5 cursor-default text-[13px] tracking-wide drop-shadow-sm">Forums</span>

					{/* Menus */}
					<div className="flex gap-5 text-[13px] font-medium tracking-wide opacity-90 drop-shadow-sm">
						<span className="cursor-default hover:opacity-70 transition-opacity">File</span>
						<span className="cursor-default hover:opacity-70 transition-opacity">Edit</span>
						<span className="cursor-default hover:opacity-70 transition-opacity">View</span>
						<span className="cursor-default hover:opacity-70 transition-opacity">Go</span>
						<span className="cursor-default hover:opacity-70 transition-opacity">Tools</span>
						<span className="cursor-default hover:opacity-70 transition-opacity">Help</span>
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
						tabIndex="0"
						onFocus={() => {
							this.setState({ status_card: true });
						}}
						// removed onBlur from here
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
					toggleVisible={() => {
						// this prop is used in statusCard component in handleClickOutside callback using react-onclickoutside
						this.setState({ status_card: false });
					}}
					showInstallPrompt={this.props.showInstallPrompt}
					handleInstallClick={this.props.handleInstallClick}
				/>
			</div>
		);
	}
}
