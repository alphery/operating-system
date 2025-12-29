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
			<div className="absolute top-0 right-0 w-screen h-8 shadow-sm flex flex-nowrap justify-between items-center bg-gray-900 bg-opacity-90 backdrop-blur-md text-gray-200 text-sm select-none z-50">
				{/* Left Side: Apple Menu */}
				<div tabIndex="0" className="flex items-center pl-4 pr-4 h-full outline-none transition duration-100 ease-in-out border-b-2 border-transparent focus:border-ubb-orange">
					{/* Apple Logo */}
					<div className="mr-5 cursor-default hover:text-white relative group">
						<img className="h-5 object-contain opacity-90 transition-opacity duration-200 hover:opacity-100" src="./images/logos/Dark Logo H.png" alt="Q-OS Logo" />
						{/* Fake Dropdown for "About QUBO" */}
						<div className="absolute top-full left-0 mt-1 w-56 bg-gray-800 bg-opacity-95 backdrop-blur-xl rounded-md shadow-2xl py-1 hidden group-hover:block border border-gray-700">
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">About QUBO</div>
							<div className="h-px bg-gray-700 my-1"></div>
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">System Preferences...</div>
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">Force Quit...</div>
							<div className="h-px bg-gray-700 my-1"></div>
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">Sleep</div>
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">Restart...</div>
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">Shut Down...</div>
							<div className="h-px bg-gray-700 my-1"></div>
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">Lock Screen</div>
							<div className="px-4 py-1 hover:bg-blue-600 cursor-default">Log Out</div>
						</div>
					</div>

					{/* App Name */}
					<span className="font-bold mr-5 cursor-default text-[13px] tracking-wide">Forums</span>

					{/* Menus */}
					<div className="hidden md:flex gap-5 text-[13px] font-medium tracking-wide opacity-90">
						<span className="cursor-default hover:text-white">File</span>
						<span className="cursor-default hover:text-white">Edit</span>
						<span className="cursor-default hover:text-white">View</span>
						<span className="cursor-default hover:text-white">Go</span>
						<span className="cursor-default hover:text-white">Tools</span>
						<span className="cursor-default hover:text-white">Help</span>
					</div>
				</div>

				{/* Right Side: Status Items */}
				<div className="flex items-center h-full">
					<div
						tabIndex="0"
						className={
							'pl-2 pr-2 text-xs md:text-sm outline-none transition duration-100 ease-in-out border-b-2 border-transparent focus:border-ubb-orange py-1'
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
							'relative pr-3 pl-3 outline-none transition duration-100 ease-in-out border-b-2 border-transparent focus:border-ubb-orange py-1 '
						}
					>
						<Status />
						<StatusCard
							shutDown={this.props.shutDown}
							lockScreen={this.props.lockScreen}
							visible={this.state.status_card}
							toggleVisible={() => {
								// this prop is used in statusCard component in handleClickOutside callback using react-onclickoutside
								this.setState({ status_card: false });
							}}
						/>
					</div>
				</div>
			</div>
		);
	}
}
