
import React, { useState, useEffect } from 'react';
import { CalendarEvent, User } from '../types';
import * as calendarService from '../services/calendarService';
import { useLocale } from '../context/LocaleContext';

interface AvailabilityHeatmapProps {
    date: Date;
    attendees: User[];
    allEvents: CalendarEvent[];
    onSlotSelect: (start: Date) => void;
}

export const AvailabilityHeatmap: React.FC<AvailabilityHeatmapProps> = ({ date, attendees, allEvents, onSlotSelect }) => {
    const { t } = useLocale();
    const [slots, setSlots] = useState<{ time: Date, busyCount: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const calculateAvailability = async () => {
            if (attendees.length === 0) return;
            setLoading(true);
            const baseDate = new Date(date);
            baseDate.setHours(9, 0, 0, 0); // Start at 9 AM
            
            const newSlots = [];
            // Generate 18 slots (9 AM to 6 PM, 30 min intervals)
            for (let i = 0; i < 18; i++) {
                const slotStart = new Date(baseDate.getTime() + i * 30 * 60000);
                const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
                
                // Create a dummy event to check conflicts
                const dummyEvent: Partial<CalendarEvent> = {
                    start: slotStart,
                    end: slotEnd,
                    attendees: attendees,
                    teamIds: []
                };
                
                // We use a modified conflict check logic here or reuse existing
                // Ideally pass teams as empty since we expanded users already in parent or don't care
                const conflicts = await calendarService.getConflictsPreview(dummyEvent, allEvents, []);
                newSlots.push({ time: slotStart, busyCount: conflicts.length });
            }
            setSlots(newSlots);
            setLoading(false);
        };

        calculateAvailability();
    }, [date, attendees, allEvents]);

    if (attendees.length === 0) return null;

    return (
        <div className="mt-4 p-3 border border-slate-200 rounded-lg bg-slate-50">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
                <span>Availability ({attendees.length} people)</span>
                <span>{date.toLocaleDateString()}</span>
            </h4>
            
            {loading ? (
                <div className="h-12 flex items-center justify-center text-xs text-slate-400">Calculating...</div>
            ) : (
                <div className="grid grid-cols-6 gap-1">
                    {slots.map((slot, idx) => {
                        const total = attendees.length;
                        const free = total - slot.busyCount;
                        const ratio = free / total;
                        
                        let bgClass = 'bg-gray-100'; // Default
                        if (ratio === 1) bgClass = 'bg-emerald-400 hover:bg-emerald-500';
                        else if (ratio >= 0.5) bgClass = 'bg-yellow-300 hover:bg-yellow-400';
                        else bgClass = 'bg-red-300 hover:bg-red-400';

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => onSlotSelect(slot.time)}
                                className={`h-8 rounded text-[10px] font-medium flex items-center justify-center transition-all ${bgClass} relative group`}
                            >
                                {slot.time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-xs p-1 rounded whitespace-nowrap z-10">
                                    {free} free, {slot.busyCount} busy
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
            <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-sm"></div> All Free</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-300 rounded-sm"></div> Most Free</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-300 rounded-sm"></div> Busy</span>
                </div>
            </div>
        </div>
    );
};
