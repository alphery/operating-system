import React, { Component } from 'react';

export class Calendar extends Component {
    constructor() {
        super();
        this.state = {
            date: new Date(),
            selectedDate: new Date()
        };
    }

    daysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    firstDayOfMonth(month, year) {
        return new Date(year, month, 1).getDay();
    }

    prevMonth = () => {
        this.setState(prev => ({
            date: new Date(prev.date.getFullYear(), prev.date.getMonth() - 1, 1)
        }));
    }

    nextMonth = () => {
        this.setState(prev => ({
            date: new Date(prev.date.getFullYear(), prev.date.getMonth() + 1, 1)
        }));
    }

    isToday(day) {
        const today = new Date();
        return day === today.getDate() &&
            this.state.date.getMonth() === today.getMonth() &&
            this.state.date.getFullYear() === today.getFullYear();
    }

    render() {
        const { date } = this.state;
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysCount = this.daysInMonth(month, year);
        const startingDay = this.firstDayOfMonth(month, year);

        const days = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        for (let i = 1; i <= daysCount; i++) {
            const today = this.isToday(i);
            days.push(
                <div key={i} className={`
                    p-2 flex items-center justify-center cursor-pointer rounded-full transition aspect-square
                    ${today
                        ? 'bg-red-500 text-white font-bold shadow-md transform scale-105'
                        : 'hover:bg-gray-100 text-slate-700'}
                `}>
                    {i}
                </div>
            );
        }

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

        return (
            <div className="w-full h-full bg-white flex flex-col p-4 select-none">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">
                        {monthNames[month]} <span className="font-light text-slate-500">{year}</span>
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={this.prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition">◀</button>
                        <button onClick={() => this.setState({ date: new Date() })} className="px-3 py-1 hover:bg-slate-100 rounded-full text-xs font-bold text-red-500 transition border border-transparent hover:border-slate-200">Today</button>
                        <button onClick={this.nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition">▶</button>
                    </div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(d => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide py-2">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 flex-grow content-start">
                    {days}
                </div>

                {/* Events Footer (Placeholder for now) */}
                <div className="mt-4 border-t border-slate-100 pt-4 text-center">
                    <p className="text-xs text-slate-400">No events for today</p>
                </div>
            </div>
        )
    }
}

export const displayCalendar = () => {
    return <Calendar />;
};

export default Calendar;
