
// components/CalendarGrid.tsx
import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CloudIcon } from './icons';
import { useLocale } from '../context/LocaleContext';
import { toJalali, toGregorian, isLeapJalali, JALALI_MONTH_LENGTHS } from '../utils/dateUtils';

interface CalendarGridProps {
    events: CalendarEvent[];
    onSelectEvent: (event: CalendarEvent) => void;
    onOpenDayView?: (date: Date, events: CalendarEvent[]) => void;
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ events, onSelectEvent, onOpenDayView, onEventDrop }) => {
    const { locale, t } = useLocale();
    const [currentDate, setCurrentDate] = useState(new Date());

    const { year, month, daysInGrid, header, weekDays } = useMemo(() => {
        const [gYear, gMonth, gDay] = [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()];
        const isJalali = locale === 'fa-IR';

        if (isJalali) {
            const [jYear, jMonth] = toJalali(gYear, gMonth + 1, gDay);
            const firstDayGregorian = new Date(...toGregorian(jYear, jMonth, 1));
            const firstDayOfWeek = firstDayGregorian.getDay(); // 0 (Sun) to 6 (Sat)
            const shamsiOffset = (firstDayOfWeek + 1) % 7;
            
            let monthLength = JALALI_MONTH_LENGTHS[jMonth];
            if (jMonth === 12 && isLeapJalali(jYear)) monthLength = 30;

            const days = Array(shamsiOffset).fill(null);
            for (let i = 1; i <= monthLength; i++) {
                const [gy, gm, gd] = toGregorian(jYear, jMonth, i);
                days.push(new Date(gy, gm - 1, gd));
            }
            
            const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric' });
            const weekDayFormat = new Intl.DateTimeFormat('fa-IR', { weekday: 'short' });
            const shamsiWeekDays = Array.from({ length: 7 }, (_, i) => {
                 const d = new Date(2023, 0, 7 + i); // 7th is a Saturday
                 return weekDayFormat.format(d);
            });
            
            return { year: jYear, month: jMonth, daysInGrid: days, header: formatter.format(currentDate), weekDays: shamsiWeekDays };
        } else { // Gregorian logic
            const date = new Date(gYear, gMonth, 1);
            const days = [];
            const firstDayIndex = date.getDay();
            for (let i = 0; i < firstDayIndex; i++) days.push(null);
            while (date.getMonth() === gMonth) {
                days.push(new Date(date));
                date.setDate(date.getDate() + 1);
            }
            const formatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
            const weekDayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });
            const gregorianWeekDays = Array.from({length: 7}, (_, i) => {
                 const d = new Date(2023, 0, 1 + i); // 1st is a Sunday
                 return weekDayFormat.format(d);
            });

            return { year: gYear, month: gMonth, daysInGrid: days, header: formatter.format(currentDate), weekDays: gregorianWeekDays };
        }
    }, [currentDate, locale]);
    
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach(event => {
            const dateKey = new Date(event.start).toDateString();
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(event);
        });
        return map;
    }, [events]);

    const changeMonth = (delta: number) => {
        const isJalali = locale === 'fa-IR';
        if (isJalali) {
            const [jYear, jMonth] = toJalali(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
            let newJMonth = jMonth + delta;
            let newJYear = jYear;

            if (newJMonth > 12) {
                newJMonth = 1;
                newJYear += 1;
            } else if (newJMonth < 1) {
                newJMonth = 12;
                newJYear -= 1;
            }

            const [gy, gm, gd] = toGregorian(newJYear, newJMonth, 15);
            setCurrentDate(new Date(gy, gm - 1, gd));
        } else {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 15));
        }
    };

    // DnD Handlers
    const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
        e.dataTransfer.setData('eventId', event.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, day: Date) => {
        e.preventDefault();
        const eventId = e.dataTransfer.getData('eventId');
        const event = events.find(e => e.id === eventId);
        if (event && onEventDrop) {
            // Preserve time, change date
            const newStart = new Date(day);
            const originalStart = new Date(event.start);
            newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
            onEventDrop(event, newStart);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden">
            <header className="flex items-center justify-between p-2 border-b flex-shrink-0 bg-white z-10">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100"><ChevronLeftIcon className="w-5 h-5 rtl:scale-x-[-1]"/></button>
                <h2 className="font-semibold">{header}</h2>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-5 h-5 rtl:scale-x-[-1]"/></button>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-600 border-b bg-gray-50 sticky top-0 z-20 border-l rtl:border-l-0 rtl:border-r">
                    {weekDays.map(day => <div key={day} className="py-2 border-r rtl:border-r-0 rtl:border-l">{day}</div>)}
                </div>

                <div className="grid grid-cols-7 auto-rows-[minmax(120px,_1fr)] border-l rtl:border-l-0 rtl:border-r">
                    {daysInGrid.map((day, index) => {
                        if (!day) return <div key={`pad-${index}`} className="border-r border-b rtl:border-r-0 rtl:border-l bg-gray-50/70" />;

                        const isCurrentMonth = (locale === 'fa-IR' && toJalali(day.getFullYear(), day.getMonth() + 1, day.getDate())[1] === month) || (locale !== 'fa-IR' && day.getMonth() === month);
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayEvents = eventsByDate.get(day.toDateString()) || [];
                        const dayNumber = locale === 'fa-IR' ? toJalali(day.getFullYear(), day.getMonth() + 1, day.getDate())[2] : day.getDate();
                        
                        return (
                            <div 
                                key={index} 
                                className={`relative p-1 border-r border-b rtl:border-r-0 rtl:border-l min-h-[120px] ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/70'}`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, day)}
                            >
                                <time
                                    dateTime={day.toISOString()}
                                    className={`text-xs font-semibold flex items-center justify-center h-6 w-6 rounded-full absolute top-1 right-1 rtl:right-auto rtl:left-1 ${isToday ? 'bg-primary text-white' : isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}
                                >
                                    {dayNumber}
                                </time>
                                <div className="mt-8 space-y-1 h-full">
                                    {dayEvents.slice(0, 3).map(event => {
                                        const isGoogle = event.source === 'GOOGLE_CALENDAR';
                                        return (
                                            <div
                                                key={event.id}
                                                draggable={!isGoogle}
                                                onDragStart={(e) => handleDragStart(e, event)}
                                                onClick={() => onSelectEvent(event)}
                                                className={`w-full text-left text-xs p-1 rounded truncate flex items-center gap-1 cursor-pointer ${
                                                    isGoogle 
                                                        ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200' 
                                                        : 'bg-[#486966]/10 text-[#486966] hover:bg-[#486966]/20 border border-[#486966]/20'
                                                } ${!isGoogle ? 'active:cursor-grabbing' : ''}`}
                                                title={event.title}
                                            >
                                                {isGoogle ? <CloudIcon className="w-3 h-3 flex-shrink-0" /> : <div className="w-2 h-2 bg-[#486966] rounded-full flex-shrink-0"></div>}
                                                <span className="truncate">{event.title}</span>
                                                {event.hasConflict && <span className="text-red-500 font-bold ml-auto">!</span>}
                                            </div>
                                        );
                                    })}
                                    {dayEvents.length > 3 && (
                                        <button 
                                            onClick={() => onOpenDayView && onOpenDayView(day, dayEvents)}
                                            className="w-full text-xs text-center text-gray-500 pt-1 hover:text-[#486966] hover:bg-gray-50 rounded"
                                        >
                                            {t('calendar_moreEvents').replace('{count}', (dayEvents.length - 3).toString())}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
