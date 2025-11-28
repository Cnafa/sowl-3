
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent } from '../types';
import { VideoIcon, XMarkIcon, ClockIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface MeetingHUDProps {
    events: CalendarEvent[];
    onDismiss: (eventId: string) => void;
}

export const MeetingHUD: React.FC<MeetingHUDProps> = ({ events, onDismiss }) => {
    const { t } = useLocale();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Update every 30s
        return () => clearInterval(timer);
    }, []);

    const activeMeeting = useMemo(() => {
        const now = currentTime.getTime();
        const upcoming = events.filter(e => {
            if (dismissedIds.has(e.id)) return false;
            const start = new Date(e.start).getTime();
            const end = new Date(e.end).getTime();
            // Show if starts within 15 mins OR is currently ongoing
            const startsSoon = (start - now) <= 15 * 60 * 1000 && (start - now) > -5 * 60 * 1000; 
            const isOngoing = start <= now && end > now;
            return (startsSoon || isOngoing);
        }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
        
        return upcoming;
    }, [events, currentTime, dismissedIds]);

    if (!activeMeeting) return null;

    const start = new Date(activeMeeting.start);
    const end = new Date(activeMeeting.end);
    const diffMinutes = Math.ceil((start.getTime() - currentTime.getTime()) / 60000);
    
    let statusText = '';
    let containerClass = '';
    let pillClass = '';
    let textClass = '';

    // Upcoming (starts in > 0 min) vs In Progress
    if (diffMinutes > 0) {
        statusText = t('hud_starts_in').replace('{time}', `${diffMinutes} min`);
        containerClass = 'bg-indigo-50 border-b border-indigo-200 text-indigo-900';
        pillClass = 'bg-indigo-200 text-indigo-800';
        textClass = 'text-indigo-900';
    } else {
        const duration = Math.ceil((end.getTime() - currentTime.getTime()) / 60000);
        statusText = t('hud_in_progress_left').replace('{time}', `${duration} min`);
        containerClass = 'bg-emerald-50 border-b border-emerald-200 text-emerald-900';
        pillClass = 'bg-emerald-200 text-emerald-800';
        textClass = 'text-emerald-900';
    }

    const handleDismiss = () => {
        setDismissedIds(prev => new Set(prev).add(activeMeeting.id));
        onDismiss(activeMeeting.id);
    };

    return (
        <div className={`sticky top-0 z-[40] w-full shadow-sm animate-fade-in-out-gentle ${containerClass}`}>
            <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-hidden">
                    {/* Slim Countdown Pill */}
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${pillClass}`}>
                        <ClockIcon className="w-3 h-3" />
                        <span className="whitespace-nowrap">{statusText}</span>
                    </div>
                    
                    <span className={`font-bold text-sm truncate ${textClass}`}>{activeMeeting.title}</span>
                    
                    {activeMeeting.description && (
                        <span className="hidden md:inline text-xs opacity-70 border-l border-current pl-3 truncate max-w-[300px]">
                            {activeMeeting.description}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    {activeMeeting.onlineLink ? (
                        <a 
                            href={activeMeeting.onlineLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white border border-current hover:opacity-80 text-xs font-bold px-3 py-1 rounded-full transition-all shadow-sm"
                        >
                            <VideoIcon className="w-3.5 h-3.5" />
                            {t('join_meeting')}
                        </a>
                    ) : (
                        <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-1 bg-white/50 rounded border border-transparent">
                            {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    )}
                    
                    <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-white/30 transition-colors" title="Dismiss">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
