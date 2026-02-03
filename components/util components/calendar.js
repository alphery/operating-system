import React, { useState, useEffect } from 'react';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const renderDays = () => {
        const totalDays = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const calendarDays = [];

        // Empty spaces for previous month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="w-9 h-9"></div>);
        }

        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

        // Days of the month
        for (let i = 1; i <= totalDays; i++) {
            const isToday = isCurrentMonth && today.getDate() === i;
            calendarDays.push(
                <div
                    key={i}
                    className={`w-9 h-9 flex items-center justify-center text-sm rounded-full cursor-default transition-all duration-200
                        ${isToday
                            ? 'bg-blue-600 text-white font-bold shadow-md transform scale-105'
                            : 'hover:bg-gray-200 text-slate-700 font-medium'
                        }
                    `}
                >
                    {i}
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <div
            className="absolute top-10 right-2 w-80 bg-white/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 p-5 text-slate-800 z-50 select-none animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6 pl-2 pr-1">
                <span className="font-bold text-xl tracking-tight text-slate-800">{monthNames[currentDate.getMonth()]} <span className="text-slate-500 font-normal">{currentDate.getFullYear()}</span></span>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-600 hover:text-slate-900 active:scale-95">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-600 hover:text-slate-900 active:scale-95">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {days.map(day => (
                    <div key={day} className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wide">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>

            {/* Optional: Event dots or small weather indicator could go here */}
            {/* <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center gap-2 text-xs text-slate-500 font-medium px-1">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span>2 Events today</span>
            </div> */}
        </div>
    );
}
