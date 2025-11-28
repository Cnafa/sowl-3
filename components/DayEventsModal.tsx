
// components/DayEventsModal.tsx
import React from 'react';
import { CalendarEvent } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon, CloudIcon } from './icons';

interface DayEventsModalProps {
    date: Date;
    events: CalendarEvent[];
    onClose: () => void;
    onEditEvent: (event: CalendarEvent) => void;
}

export const DayEventsModal: React.FC<DayEventsModalProps> = ({ date, events, onClose, onEditEvent }) => {
    const { t, locale } = useLocale();
    
    const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    // Generate hours for the timeline
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-lg">
                    <h2 className="text-lg font-bold text-slate-800">
                        {t('event_day_view').replace('{date}', date.toLocaleDateString(locale))}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-slate-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-4 relative">
                    {/* Timeline Grid */}
                    <div className="absolute left-14 top-4 bottom-4 w-px bg-slate-200"></div>
                    
                    <div className="space-y-6 relative">
                        {sortedEvents.map((event, idx) => {
                            const startTime = new Date(event.start);
                            const endTime = new Date(event.end);
                            return (
                                <div key={event.id} className="flex gap-4 relative group">
                                    <div className="w-10 text-xs text-slate-500 font-medium text-right pt-1">
                                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </div>
                                    
                                    {/* Dot on timeline */}
                                    <div className="absolute left-[35px] top-2 w-3 h-3 rounded-full border-2 border-white bg-[#486966] shadow-sm z-10"></div>
                                    
                                    <div 
                                        onClick={() => onEditEvent(event)}
                                        className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${event.source === 'GOOGLE_CALENDAR' ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={`font-bold text-sm ${event.source === 'GOOGLE_CALENDAR' ? 'text-blue-800' : 'text-slate-800'}`}>
                                                {event.source === 'GOOGLE_CALENDAR' && <CloudIcon className="w-3 h-3 inline mr-1" />}
                                                {event.title}
                                            </h4>
                                            {event.hasConflict && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Conflict</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">
                                            {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                        {event.description && <p className="text-xs text-slate-600 line-clamp-2">{event.description}</p>}
                                        
                                        <div className="mt-2 flex -space-x-1">
                                            {event.attendees.slice(0, 3).map(att => (
                                                <img key={att.id} src={att.avatarUrl} className="w-5 h-5 rounded-full border border-white" title={att.name} />
                                            ))}
                                            {event.attendees.length > 3 && <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] text-slate-500">+{event.attendees.length - 3}</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {sortedEvents.length === 0 && <p className="text-center text-slate-400 py-10">No events scheduled for this day.</p>}
                    </div>
                </main>
            </div>
        </div>
    );
};
