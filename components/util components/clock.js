import { Component } from 'react'
import Calendar from './calendar';

export default class Clock extends Component {
    constructor() {
        super();
        this.month_list = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        this.day_list = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        this.state = {
            hour_12: true,
            current_time: new Date()
        };
    }

    toggleCalendar = () => {
        this.setState(prevState => ({ calendarVisible: !prevState.calendarVisible }));
    }

    handleClickOutside = (e) => {
        if (this.clockRef && !this.clockRef.contains(e.target)) {
            this.setState({ calendarVisible: false });
        }
    }

    componentDidMount() {
        this.update_time = setInterval(() => {
            this.setState({ current_time: new Date() });
        }, 10 * 1000);
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        clearInterval(this.update_time);
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    render() {
        const { current_time, calendarVisible } = this.state;
        // ... (existing variable definitions logic remains same if I don't touch lines 27-39, but I am replacing render block)

        let day = this.day_list[current_time.getDay()];
        let hour = current_time.getHours();
        let minute = current_time.getMinutes();
        let month = this.month_list[current_time.getMonth()];
        let date = current_time.getDate().toLocaleString();
        let meridiem = (hour < 12 ? "AM" : "PM");

        if (minute.toLocaleString().length === 1) {
            minute = "0" + minute
        }

        if (this.state.hour_12 && hour > 12) hour -= 12;

        let display_time;
        if (this.props.onlyTime) {
            display_time = hour + ":" + minute + " " + meridiem;
        }
        else if (this.props.onlyDay) {
            display_time = day + " " + month + " " + date;
        }
        else display_time = day + " " + month + " " + date + " " + hour + ":" + minute + " " + meridiem;

        return (
            <div ref={node => this.clockRef = node} className="relative flex items-center justify-center">
                <span onClick={this.toggleCalendar} className="cursor-pointer hover:bg-white hover:bg-opacity-10 px-2 rounded transition-colors duration-200">
                    {display_time}
                </span>
                {calendarVisible && <Calendar />}
            </div>
        );
    }
}
