
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, WorkItem, Team } from '../types';
import * as calendarService from '../services/calendarService';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';
import { useLocale } from '../context/LocaleContext';
import { CalendarGrid } from './CalendarGrid';
import { CloudIcon, ChevronRightIcon } from './icons';
import { DayEventsModal } from './DayEventsModal';

interface EventsViewProps {
    workItems: WorkItem[];
    teams: Team[];
    events: CalendarEvent[];
    onViewEvent: (event: CalendarEvent) => void;
    onAddNewEvent: () => void;
    setEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>; 
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ workItems, teams, events, onViewEvent, onAddNewEvent, setEvents, onEventDrop }) => {
    const { user } = useAuth();
    const { can } = useBoard();
    const { t, locale } = useLocale();
    
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [scope, setScope] = useState<'my' | 'all'>('my');
    const isScrumMaster = can('sprint.manage');
    
    const [dayModalData, setDayModalData] = useState<{ date: Date, events: CalendarEvent[] } | null>(null);

    const handleSelectEvent = (event: CalendarEvent) => {
        setDayModalData(null);
        onViewEvent(event);
    };
    
    const handleOpenDayView = (date: Date, dayEvents: CalendarEvent[]) => {
        setDayModalData({ date, events: dayEvents });
    };
    
    const ViewButton: React.FC<{ mode: 'calendar' | 'list', label: string }> = ({ mode, label }) => (
         <button 
            onClick={() => setView(mode)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${view === mode ? 'bg-[#486966] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    const filteredEvents = useMemo(() => {
        if (!user) return [];
        const effectiveScope = isScrumMaster ? scope : 'my';
        if (effectiveScope === 'my') {
            return events.filter(e =>
                e.createdBy.id === user.id || e.attendees.some(a => a.id === user.id)
            );
        }
        return events; 
    }, [events, scope, isScrumMaster, user]);

    const groupedEvents = useMemo(() => {
        const groups: Record<string, CalendarEvent[]> = {};
        const sorted = [...filteredEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        
        sorted.forEach(event => {
            const dateKey = new Date(event.start).toDateString();
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(event);
        });
        return groups;
    }, [filteredEvents]);

    return (
        <div className="p-4 bg-white rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div className="flex items-center gap-4">
                     <h2 className="text-xl font-bold text-[#3B3936]">{t('eventsView')}</h2>
                     {isScrumMaster && (
                        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                             <button onClick={() => setScope('my')} className={`px-3 py-1 text-sm rounded-md ${scope === 'my' ? 'bg-white shadow-sm' : ''}`}>{t('my_events')}</button>
                             <button onClick={() => setScope('all')} className={`px-3 py-1 text-sm rounded-md ${scope === 'all' ? 'bg-white shadow-sm' : ''}`}>{t('all_events')}</button>
                        </div>
                     )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                        <ViewButton mode="calendar" label={t('calendar_view')} />
                        <ViewButton mode="list" label={t('list_view')} />
                    </div>
                    <button onClick={onAddNewEvent} className="py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                        {t('newEvent')}
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
                {view === 'calendar' ? (
                     <CalendarGrid 
                        events={filteredEvents} 
                        onSelectEvent={handleSelectEvent}
                        onOpenDayView={handleOpenDayView}
                        onEventDrop={onEventDrop}
                     />
                ) : (
                    <div className="overflow-y-auto h-full p-2">
                        {Object.keys(groupedEvents).length > 0 ? (
                            Object.entries(groupedEvents).map(([dateString, dayEvents]) => {
                                const date = new Date(dateString);
                                return (
                                    <div key={dateString} className="mb-8 last:mb-0">
                                        <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur border-y border-slate-200 py-2 px-4 mb-4 flex items-center gap-2 shadow-sm">
                                            <div className="font-bold text-slate-800 text-lg">
                                                {date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric' })}
                                            </div>
                                        </div>

                                        <div className="relative ml-4 pl-8 border-l-2 border-slate-200 space-y-6">
                                            {(dayEvents as CalendarEvent[]).map(event => {
                                                const startTime = new Date(event.start);
                                                const endTime = new Date(event.end);
                                                return (
                                                    <div key={event.id} className="relative group">
                                                        <div className="absolute -left-[39px] top-3 w-4 h-4 rounded-full border-4 border-white bg-[#486966] shadow-sm z-10 group-hover:scale-125 transition-transform"></div>
                                                        
                                                        <div className="absolute -left-[85px] top-3 text-xs font-mono text-slate-500 text-right w-10">
                                                            {startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}
                                                        </div>

                                                        <div 
                                                            onClick={() => handleSelectEvent(event)}
                                                            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:translate-x-1 ${event.source === 'GOOGLE_CALENDAR' ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className={`font-bold text-base ${event.source === 'GOOGLE_CALENDAR' ? 'text-blue-800' : 'text-slate-800'}`}>
                                                                    {event.source === 'GOOGLE_CALENDAR' && <CloudIcon className="w-4 h-4 inline mr-2" />}
                                                                    {event.title}
                                                                </h4>
                                                                {event.hasConflict && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t('conflict_badge')}</span>}
                                                            </div>
                                                            
                                                            <div className="text-xs text-slate-500 flex gap-2 mb-2">
                                                                <span>{startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                                <span>•</span>
                                                                <span>{event.attendees.length} attendees</span>
                                                            </div>

                                                            {event.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3 bg-black/5 p-2 rounded">{event.description}</p>}
                                                            
                                                            <div className="flex -space-x-2">
                                                                {event.attendees.slice(0, 5).map(att => (
                                                                    <img key={att.id} src={att.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white" title={att.name} />
                                                                ))}
                                                                {event.attendees.length > 5 && <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">+{event.attendees.length - 5}</div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <h3 className="text-base font-semibold text-slate-800">No Events Scheduled</h3>
                                <p className="mt-2 text-sm text-slate-600">Create an event to see it on your calendar or list.</p>
                                <button onClick={onAddNewEvent} className="mt-4 py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                                    {t('newEvent')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {dayModalData && (
                <DayEventsModal 
                    date={dayModalData.date} 
                    events={dayModalData.events} 
                    onClose={() => setDayModalData(null)} 
                    onEditEvent={handleSelectEvent} 
                />
            )}
        </div>
    );
};
