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
            calendarDays.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
        }

        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

        // Days of the month
        for (let i = 1; i <= totalDays; i++) {
            const isToday = isCurrentMonth && today.getDate() === i;
            calendarDays.push(
                <div
                    key={i}
                    className={`w-8 h-8 flex items-center justify-center text-sm rounded-full cursor-default
                        ${isToday ? 'bg-blue-500 text-white font-bold' : 'hover:bg-white hover:bg-opacity-20 text-gray-200'}
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
            className="absolute top-10 right-2 w-72 bg-gray-900 bg-opacity-80 backdrop-blur-2xl rounded-xl shadow-2xl border border-white border-opacity-10 p-4 text-white z-50 select-none animation-fade-in"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="font-bold text-lg">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {days.map(day => (
                    <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>

            <style jsx>{`
                .animation-fade-in {
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
