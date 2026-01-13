
import React, { Component } from 'react';

export class Calendar extends Component {
    constructor() {
        super();
        this.state = {
            currentDate: new Date(), // for navigation
            selectedDate: new Date(), // for selection
            animating: false,
            direction: 'next',
            // Data structure: { "2023-10-27": [{ id: 1, title: "...", time: "...", color: "...", completed: false }] }
            events: {},
            // Form state
            newEventTitle: '',
            newEventTime: '',
            newEventColor: 'bg-blue-500',
            isAddingEvent: false
        };
    }

    componentDidMount() {
        // Load events from localStorage
        try {
            const savedEvents = localStorage.getItem('calendar_events');
            if (savedEvents) {
                this.setState({ events: JSON.parse(savedEvents) });
            } else {
                // Initial dummy data
                const todayKey = this.getDateKey(new Date());
                this.setState({
                    events: {
                        [todayKey]: [
                            { id: Date.now(), title: 'Install Alphery OS', time: '10:00 AM', color: 'bg-blue-500', completed: true },
                            { id: Date.now() + 1, title: 'Explore Features', time: '11:00 AM', color: 'bg-purple-500', completed: false }
                        ]
                    }
                });
            }
        } catch (e) {
            console.error("Failed to load events", e);
        }
    }

    saveEvents = (updatedEvents) => {
        this.setState({ events: updatedEvents });
        localStorage.setItem('calendar_events', JSON.stringify(updatedEvents));
    }

    getDateKey = (date) => {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }

    daysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    firstDayOfMonth(month, year) {
        return new Date(year, month, 1).getDay();
    }

    changeMonth = (delta) => {
        if (this.state.animating) return;

        this.setState({
            animating: true,
            direction: delta > 0 ? 'next' : 'prev'
        });

        setTimeout(() => {
            this.setState(prev => ({
                currentDate: new Date(prev.currentDate.getFullYear(), prev.currentDate.getMonth() + delta, 1),
                animating: false
            }));
        }, 300);
    }

    selectDate = (day) => {
        const { currentDate } = this.state;
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        this.setState({
            selectedDate: newDate,
            isAddingEvent: false, // Reset form when changing date
            newEventTitle: '',
            newEventTime: ''
        });
    }

    isToday(day, month, year) {
        const today = new Date();
        return day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
    }

    isSelected(day, month, year) {
        const { selectedDate } = this.state;
        return day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();
    }

    // --- CRUD Operations ---

    handleAddEvent = (e) => {
        e.preventDefault();
        const { selectedDate, newEventTitle, newEventTime, newEventColor, events } = this.state;

        if (!newEventTitle.trim()) return;

        const key = this.getDateKey(selectedDate);
        const currentDayEvents = events[key] || [];

        const newEvent = {
            id: Date.now(),
            title: newEventTitle,
            time: newEventTime || 'All Day',
            color: newEventColor,
            completed: false
        };

        const updatedEvents = {
            ...events,
            [key]: [...currentDayEvents, newEvent]
        };

        this.saveEvents(updatedEvents);
        this.setState({
            newEventTitle: '',
            newEventTime: '',
            isAddingEvent: false
        });
    }

    toggleTodo = (eventId) => {
        const { selectedDate, events } = this.state;
        const key = this.getDateKey(selectedDate);
        if (!events[key]) return;

        const updatedDayEvents = events[key].map(evt =>
            evt.id === eventId ? { ...evt, completed: !evt.completed } : evt
        );

        this.saveEvents({ ...events, [key]: updatedDayEvents });
    }

    deleteEvent = (eventId) => {
        const { selectedDate, events } = this.state;
        const key = this.getDateKey(selectedDate);
        if (!events[key]) return;

        const updatedDayEvents = events[key].filter(evt => evt.id !== eventId);

        // If empty, maybe remove the key entirely? Optional. Keeping it simple.
        this.saveEvents({ ...events, [key]: updatedDayEvents });
    }

    render() {
        const { currentDate, selectedDate, animating, direction, events, isAddingEvent, newEventColor } = this.state;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysCount = this.daysInMonth(month, year);
        const startingDay = this.firstDayOfMonth(month, year);

        const prevMonthDaysCount = this.daysInMonth(month - 1, year);

        const days = [];

        // Previous month filler
        for (let i = 0; i < startingDay; i++) {
            days.push(
                <div key={`prev-${i}`} className="p-2 opacity-30 text-sm flex items-center justify-center pointer-events-none">
                    {prevMonthDaysCount - startingDay + i + 1}
                </div>
            );
        }

        // Current month
        for (let i = 1; i <= daysCount; i++) {
            const today = this.isToday(i, month, year);
            const selected = this.isSelected(i, month, year); // Visual selection state

            // Check for events
            const dateKey = this.getDateKey(new Date(year, month, i));
            const dayEvents = events[dateKey] || [];
            const hasEvents = dayEvents.length > 0;

            days.push(
                <div key={i}
                    onClick={() => this.selectDate(i)}
                    className={`
                        relative w-full aspect-square flex items-center justify-center text-sm rounded-full cursor-pointer transition-all duration-200 group
                        ${today ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/50 hover:bg-blue-500' : ''}
                        ${!today && selected ? 'bg-white/20 text-white font-semibold backdrop-blur-sm border border-white/30' : ''}
                        ${!today && !selected ? 'text-white/80 hover:bg-white/10' : ''}
                    `}
                >
                    {i}
                    {/* Event Dots */}
                    {hasEvents && !today && !selected && (
                        <div className="absolute bottom-1.5 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((evt, idx) => (
                                <div key={idx} className={`w-1 h-1 rounded-full ${evt.color}`}></div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Next month filler
        const totalSlots = days.length;
        const remainingSlots = 42 - totalSlots;
        for (let i = 1; i <= remainingSlots; i++) {
            days.push(
                <div key={`next-${i}`} className="p-2 opacity-30 text-sm flex items-center justify-center pointer-events-none">
                    {i}
                </div>
            );
        }

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
        const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];

        // Selected Date Events
        const selectedKey = this.getDateKey(selectedDate);
        const currentEvents = events[selectedKey] || [];

        return (
            <div className="w-full h-full flex flex-col md:flex-row bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-md text-white select-none overflow-hidden font-sans">

                {/* --- Left Sidebar (Events & Todos) --- */}
                <div className="w-full md:w-5/12 flex flex-col border-b md:border-b-0 md:border-r border-white/10 bg-black/20 p-6 relative overflow-hidden group">
                    {/* Background blob */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h3 className="text-white/50 uppercase tracking-widest text-xs font-semibold mb-1">{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                                <h1 className="text-5xl font-light tracking-tighter">{selectedDate.getDate()}</h1>
                                <span className="text-sm font-medium text-white/60">{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</span>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={() => this.setState({ isAddingEvent: !isAddingEvent })}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAddingEvent ? 'bg-red-500/20 text-red-400 rotate-45' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                            >
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>

                        {/* Add Event Form */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAddingEvent ? 'max-h-64 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                            <form onSubmit={this.handleAddEvent} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Event Title..."
                                    value={this.state.newEventTitle}
                                    onChange={(e) => this.setState({ newEventTitle: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Time (e.g. 2pm)"
                                        value={this.state.newEventTime}
                                        onChange={(e) => this.setState({ newEventTime: e.target.value })}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                    <div className="flex gap-1 items-center bg-black/20 border border-white/10 rounded-lg px-2">
                                        {colors.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => this.setState({ newEventColor: c })}
                                                className={`w-4 h-4 rounded-full ${c} ${newEventColor === c ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                            ></button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg text-sm font-medium transition-colors">Add Event</button>
                            </form>
                        </div>

                        {/* Events List */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Agenda</h4>

                            {currentEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {currentEvents.map((evt) => (
                                        <div key={evt.id} className="group relative flex gap-3 items-center bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-all">
                                            {/* Checkbox / Color Indicator */}
                                            <button
                                                onClick={() => this.toggleTodo(evt.id)}
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${evt.completed
                                                        ? `bg-white border-transparent`
                                                        : `border-white/20 hover:border-white/40`
                                                    }`}
                                            >
                                                {evt.completed && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </button>

                                            <div className={`flex flex-col flex-1 transition-opacity ${evt.completed ? 'opacity-40 line-through decoration-white/50' : ''}`}>
                                                <span className="text-sm font-medium leading-tight">{evt.title}</span>
                                                <span className={`text-xs ${evt.completed ? 'text-white/40' : evt.color.replace('bg-', 'text-')}`}>{evt.time}</span>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => this.deleteEvent(evt.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 text-red-200 transition-all"
                                            >
                                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 opacity-30">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 text-xl">☕</div>
                                    <p className="text-sm">No plans yet</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-white/30">
                            <span>{currentEvents.filter(e => e.completed).length}/{currentEvents.length} Completed</span>
                            <button onClick={() => this.setState({ currentDate: new Date(), selectedDate: new Date() })} className="hover:text-white transition">Go to Today</button>
                        </div>
                    </div>
                </div>

                {/* --- Main Calendar Grid --- */}
                <div className="w-full md:w-7/12 flex flex-col p-6 relative">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold tracking-tight pl-2">
                            {monthNames[month]} <span className="opacity-40 font-light ml-1">{year}</span>
                        </h2>
                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5">
                            <button onClick={() => this.changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white text-white/70 transition">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => this.changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white text-white/70 transition">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {dayNames.map((d, i) => (
                            <div key={d} className={`text-center text-xs font-bold uppercase tracking-wider py-2 ${i > 4 ? 'text-red-400/70' : 'text-white/40'}`}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className={`grid grid-cols-7 gap-1 md:gap-2 flex-grow auto-rows-fr transition-all duration-300 ${animating ? (direction === 'next' ? 'opacity-0 -translate-x-4' : 'opacity-0 translate-x-4') : 'opacity-100 translate-x-0'}`}>
                        {days}
                    </div>

                </div>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                `}</style>
            </div>
        )
    }
}

export const displayCalendar = () => {
    return <Calendar />;
};

export default Calendar;
