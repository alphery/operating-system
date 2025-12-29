import React, { Component } from "react";

export class SideBarApp extends Component {
    constructor() {
        super();
        this.id = null;
        this.state = {
            showTitle: false,
            scaleImage: false,
        };
    }

    componentDidMount() {
        this.id = this.props.id;
    }

    scaleImage = () => {
        setTimeout(() => {
            this.setState({ scaleImage: false });
        }, 1000);
        this.setState({ scaleImage: true });
    }

    openApp = () => {
        if (!this.props.isMinimized[this.props.id] && this.props.isClose[this.props.id]) {
            this.scaleImage();
        }
        this.props.openApp(this.props.id);
        this.setState({ showTitle: false });
    };

    render() {
        const scale = this.props.dockScale || 1;
        const baseSize = 48; // Base width/height in px
        const size = baseSize * scale;

        return (
            <div
                tabIndex="0"
                onClick={this.openApp}
                onMouseEnter={() => {
                    this.setState({ showTitle: true });
                    if (this.props.onHover) this.props.onHover();
                }}
                onMouseLeave={() => {
                    this.setState({ showTitle: false });
                    // Optional: trigger onLeave() if you want snap-back behavior immediately
                }}
                className={(this.props.isClose[this.props.id] === false && this.props.isFocus[this.props.id] ? "bg-white bg-opacity-10 " : "") + " outline-none relative transition-all duration-200 ease-out transform rounded-xl m-1 flex justify-center items-center"}
                id={"sidebar-" + this.props.id}
                style={{ width: `${size}px`, height: `${size}px` }}
            >
                <img
                    width={`${28 * scale}px`}
                    height={`${28 * scale}px`}
                    className="w-full h-full object-contain p-1.5"
                    src={this.props.icon}
                    alt="Ubuntu App Icon"
                />

                {
                    (
                        this.props.isClose[this.props.id] === false
                            ? <div className=" w-1.5 h-1.5 absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-gray-200 rounded-full shadow-sm"></div>
                            : null
                    )
                }
                <div
                    className={
                        (this.state.showTitle ? " visible " : " invisible ") +
                        " w-max py-0.5 px-2 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 text-gray-100 font-medium text-xs bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-md shadow-lg z-50 whitespace-nowrap"
                    }
                >
                    {this.props.title}
                </div>
            </div>
        );
    }
}

export default SideBarApp;
