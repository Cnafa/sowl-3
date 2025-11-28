
// components/EventEditorModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalendarEvent, WorkItem, User, Team, Conflict, Epic } from '../types';
import { XMarkIcon, WandIcon, RepeatIcon, MagnifyingGlassIcon } from './icons';
import { ALL_USERS } from '../constants';
import * as calendarService from '../services/calendarService';
import { useLocale } from '../context/LocaleContext';
import { DateField } from './DateField';
import { useAuth } from '../context/AuthContext';
import { AvailabilityHeatmap } from './AvailabilityHeatmap';

interface EventEditorModalProps {
    event: Partial<CalendarEvent> | null;
    workItems: WorkItem[];
    epics?: Epic[];
    teams: Team[];
    allEvents?: CalendarEvent[];
    onSave: (event: Partial<CalendarEvent> & { recurrence?: { type: 'DAILY' | 'WEEKLY' | 'CUSTOM', interval: number, endDate: string } }) => void;
    onClose: () => void;
}

const formatTimeForInput = (date: Date): string => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

export const EventEditorModal: React.FC<EventEditorModalProps> = ({ event, workItems, epics = [], teams, allEvents = [], onSave, onClose }) => {
    const { t } = useLocale();
    const { user } = useAuth();
    
    const defaultEvent: Partial<CalendarEvent> = {
        title: '',
        start: new Date(),
        end: new Date(new Date().getTime() + 60 * 60 * 1000),
        allDay: false,
        attendees: user ? [user] : [],
        source: 'INTERNAL',
        linkedWorkItemIds: [],
        teamIds: []
    };

    const [localEvent, setLocalEvent] = useState<Partial<CalendarEvent>>({
        ...defaultEvent,
        ...(event || {})
    });
    
    const [recurrenceType, setRecurrenceType] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'CUSTOM'>('NONE');
    const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
    const [recurrenceEnd, setRecurrenceEnd] = useState<string | null>(null);

    const [workItemSearch, setWorkItemSearch] = useState('');
    const [isWorkItemDropdownOpen, setIsWorkItemDropdownOpen] = useState(false);
    const workItemDropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(workItemDropdownRef, () => setIsWorkItemDropdownOpen(false));

    const [attendeeTab, setAttendeeTab] = useState<'users' | 'teams'>('users');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set(localEvent.attendees?.map(u => u.id) || []));
    const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set(localEvent.teamIds || []));

    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
    const [suggestedSlots, setSuggestedSlots] = useState<Date[]>([]); 
    const [isFindingSmartSlot, setIsFindingSmartSlot] = useState(false);
    const [dateError, setDateError] = useState('');
    const [hasUnresolvedConflicts, setHasUnresolvedConflicts] = useState(false);

    const allLinkableItems = useMemo(() => {
        const items = workItems.map(i => ({ id: i.id, title: i.title, type: i.type, original: i }));
        const epicItems = epics.map(e => ({ id: e.id, title: e.name, type: 'Epic', original: e }));
        return [...items, ...epicItems];
    }, [workItems, epics]);

    const filteredLinkableItems = useMemo(() => {
        if (!workItemSearch) return allLinkableItems.slice(0, 10);
        const lowercasedQuery = workItemSearch.toLowerCase();
        return allLinkableItems.filter(item => item.title.toLowerCase().includes(lowercasedQuery) || item.id.toLowerCase().includes(lowercasedQuery)).slice(0, 20);
    }, [allLinkableItems, workItemSearch]);

    const linkedItems = useMemo(() => {
        const ids = new Set(localEvent.linkedWorkItemIds || []);
        if (localEvent.linkedWorkItemId && !ids.has(localEvent.linkedWorkItemId)) {
            ids.add(localEvent.linkedWorkItemId);
        }
        return allLinkableItems.filter(item => ids.has(item.id));
    }, [localEvent.linkedWorkItemIds, localEvent.linkedWorkItemId, allLinkableItems]);

    useEffect(() => {
        const selectedUsers = ALL_USERS.filter(u => selectedUserIds.has(u.id));
        setLocalEvent(prev => ({ ...prev, attendees: selectedUsers, teamIds: Array.from(selectedTeamIds) }));
    }, [selectedUserIds, selectedTeamIds]);

    useEffect(() => {
        if (localEvent.start && localEvent.end && localEvent.start > localEvent.end) {
            setDateError(t('eventEditor_error_endDate'));
        } else {
            setDateError('');
        }
        
        setSuggestedSlots([]);
        setHasUnresolvedConflicts(false);
        
        if (!localEvent.start || !localEvent.end || localEvent.start > localEvent.end) return;

        const runCheck = async () => {
            setIsCheckingConflicts(true);
            const previewConflicts = await calendarService.getConflictsPreview(localEvent, allEvents, teams);
            setConflicts(previewConflicts);
            
            if (previewConflicts.length > 0) {
                calculateSuggestions(localEvent);
            }
            
            setIsCheckingConflicts(false);
        };
        
        const timer = setTimeout(runCheck, 500);
        return () => clearTimeout(timer);

    }, [localEvent.start, localEvent.end, localEvent.attendees, localEvent.teamIds]);

    const handleFieldChange = (name: string, value: any) => {
        const newEventData = { ...localEvent, [name]: value };
        setLocalEvent(newEventData);
    };
    
    const handleDatePartChange = (dateStr: string | null) => {
        if (!dateStr) return;
        const newDate = new Date(dateStr);
        const newStart = new Date(localEvent.start || new Date());
        const newEnd = new Date(localEvent.end || new Date());

        newStart.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        newEnd.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        
        setLocalEvent(prev => ({...prev, start: newStart, end: newEnd }));
    };
    
    const handleTimePartChange = (field: 'start' | 'end', timeString: string) => {
        if (!timeString) return;
        const [hours, minutes] = timeString.split(':').map(Number);
        const dateToUpdate = new Date(localEvent[field] || localEvent.start || new Date());
        dateToUpdate.setHours(hours, minutes, 0, 0);

        setLocalEvent(prev => ({ ...prev, [field]: dateToUpdate }));
    };

    const handleToggleLinkedItem = (itemId: string) => {
        setLocalEvent(prev => {
            const currentIds = new Set(prev.linkedWorkItemIds || []);
            if (prev.linkedWorkItemId) currentIds.add(prev.linkedWorkItemId);
            
            if (currentIds.has(itemId)) {
                currentIds.delete(itemId);
            } else {
                currentIds.add(itemId);
            }
            return { 
                ...prev, 
                linkedWorkItemIds: Array.from(currentIds),
                linkedWorkItemId: undefined
            };
        });
    };
    
    const calculateSuggestions = async (currentEvent: Partial<CalendarEvent>) => {
        if (!currentEvent.start || !currentEvent.end) return;
        setIsFindingSmartSlot(true);
        
        const duration = new Date(currentEvent.end).getTime() - new Date(currentEvent.start).getTime();
        const searchStart = new Date(currentEvent.start);
        
        const foundSlots: Date[] = [];
        for (let i = 1; i <= 96 && foundSlots.length < 3; i++) { 
            const proposedStart = new Date(searchStart.getTime() + (i * 30 * 60000));
            const hour = proposedStart.getHours();
            if (hour < 8 || hour > 18) continue;

            const proposedEnd = new Date(proposedStart.getTime() + duration);
            
            const testEvent = { ...currentEvent, start: proposedStart, end: proposedEnd };
            if (event?.id) testEvent.id = event.id;
            
            const foundConflicts = await calendarService.getConflictsPreview(testEvent, allEvents, teams);
            
            if (foundConflicts.length === 0) {
                foundSlots.push(proposedStart);
            }
        }

        setSuggestedSlots(foundSlots);
        setIsFindingSmartSlot(false);
    };

    const applySuggestion = (start: Date) => {
        if (!localEvent.start || !localEvent.end) return;
        const duration = new Date(localEvent.end).getTime() - new Date(localEvent.start).getTime();
        const newEnd = new Date(start.getTime() + duration);
        setLocalEvent(prev => ({ ...prev, start: start, end: newEnd }));
        setHasUnresolvedConflicts(false);
        setConflicts([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(dateError) return;
        
        const finalConflicts = await calendarService.getConflictsPreview(localEvent, allEvents, teams);

        if (finalConflicts.length > 0) {
            setConflicts(finalConflicts);
            calculateSuggestions(localEvent);
            if (!hasUnresolvedConflicts) {
                setHasUnresolvedConflicts(true);
                return;
            }
        }

        let recurrenceData;
        if (recurrenceType !== 'NONE' && recurrenceEnd) {
            let interval = 1;
            if (recurrenceType === 'WEEKLY') interval = 7;
            if (recurrenceType === 'CUSTOM') interval = recurrenceInterval;
            
            recurrenceData = {
                type: recurrenceType,
                interval,
                endDate: recurrenceEnd
            };
        }

        onSave({ ...localEvent, recurrence: recurrenceData });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[80]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <header className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
                        <h2 className="text-xl font-bold text-[#3B3936]">{event?.id ? t('editEvent') : t('newEvent')}</h2>
                        <button type="button" onClick={onClose}><XMarkIcon className="w-6 h-6 text-[#889C9B]" /></button>
                    </header>
                    <main className="p-6 space-y-5 flex-1 overflow-y-auto bg-white">
                        
                        {conflicts.length > 0 && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in-out-gentle">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-100 rounded-full text-red-600 mt-1">!</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-800 flex items-center gap-2">
                                            {t('conflict_warning_title')}
                                        </h4>
                                        <p className="text-sm text-red-700 mt-1">{t('conflict_warning_body')}</p>
                                        
                                        <div className="mt-4">
                                            <p className="text-xs font-bold text-red-800 uppercase mb-2 flex items-center gap-1">
                                                <WandIcon className="w-3 h-3" /> 
                                                {isFindingSmartSlot ? t('event_smart_finding') : t('conflict_suggestions_label')}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestedSlots.map((slot, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => applySuggestion(slot)}
                                                        className="px-3 py-1.5 bg-white border border-green-500 text-green-700 text-xs font-bold rounded-full hover:bg-green-50 transition-colors shadow-sm flex items-center gap-1"
                                                    >
                                                        <span>{slot.toLocaleDateString([], {weekday: 'short'})}</span>
                                                        <span>{slot.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {dateError && (
                            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">
                                <p className="text-sm font-bold">{dateError}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-1">{t('title')}</label>
                            <input 
                                type="text" 
                                id="title" 
                                name="title" 
                                value={localEvent.title || ''} 
                                onChange={(e) => handleFieldChange('title', e.target.value)} 
                                required 
                                className="w-full h-11 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#486966] focus:border-transparent placeholder-slate-400"
                                placeholder="e.g., Sprint Review"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date & Time</label>
                            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                                <div className="mb-4">
                                    <DateField 
                                        value={localEvent.start || null} 
                                        onChange={handleDatePartChange} 
                                        className="border-slate-300 bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="startTime" className="block text-xs font-semibold text-slate-500 mb-1">{t('startTime')}</label>
                                        <input 
                                            type="time" 
                                            id="startTime" 
                                            value={localEvent.start ? formatTimeForInput(localEvent.start) : ''} 
                                            onChange={e => handleTimePartChange('start', e.target.value)} 
                                            className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-[#486966] focus:outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="endTime" className="block text-xs font-semibold text-slate-500 mb-1">{t('endTime')}</label>
                                        <input 
                                            type="time" 
                                            id="endTime" 
                                            value={localEvent.end ? formatTimeForInput(localEvent.end) : ''} 
                                            onChange={e => handleTimePartChange('end', e.target.value)} 
                                            className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-[#486966] focus:outline-none" 
                                        />
                                    </div>
                                </div>
                                
                                {/* Availability Heatmap Integration */}
                                {localEvent.attendees && localEvent.attendees.length > 0 && localEvent.start && (
                                    <AvailabilityHeatmap 
                                        date={localEvent.start} 
                                        attendees={localEvent.attendees} 
                                        allEvents={allEvents}
                                        onSlotSelect={applySuggestion}
                                    />
                                )}
                            </div>
                        </div>

                        {!event?.id && (
                            <div className="p-4 bg-white border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <RepeatIcon className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-bold text-slate-700">{t('event_repeat')}</span>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <select 
                                        value={recurrenceType} 
                                        onChange={e => setRecurrenceType(e.target.value as any)} 
                                        className="h-9 text-sm border border-slate-300 rounded-md bg-white px-3 focus:ring-2 focus:ring-[#486966] focus:outline-none"
                                    >
                                        <option value="NONE">{t('event_repeat_none')}</option>
                                        <option value="DAILY">{t('event_repeat_daily')}</option>
                                        <option value="WEEKLY">{t('event_repeat_weekly')}</option>
                                        <option value="CUSTOM">{t('event_repeat_custom')}</option>
                                    </select>
                                    
                                    {recurrenceType === 'CUSTOM' && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">Every</span>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={recurrenceInterval} 
                                                onChange={e => setRecurrenceInterval(parseInt(e.target.value))} 
                                                className="w-16 h-9 text-sm border border-slate-300 rounded-md text-center focus:ring-2 focus:ring-[#486966] focus:outline-none"
                                            />
                                            <span className="text-sm">days</span>
                                        </div>
                                    )}

                                    {recurrenceType !== 'NONE' && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500">{t('event_repeat_until')}</span>
                                            <div className="w-40">
                                                <DateField 
                                                    value={recurrenceEnd} 
                                                    onChange={setRecurrenceEnd} 
                                                    minDate={localEvent.start ? new Date(localEvent.start) : new Date()}
                                                    className="border-slate-300 h-9"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                         <div>
                            <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-1">{t('description')}</label>
                            <textarea 
                                id="description" 
                                name="description" 
                                value={localEvent.description || ''} 
                                onChange={(e) => handleFieldChange('description', e.target.value)} 
                                rows={3} 
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#486966] focus:outline-none resize-none placeholder-slate-400"
                                placeholder="Add details..."
                            />
                        </div>
                        
                        <div>
                           <label htmlFor="onlineLink" className="block text-sm font-bold text-slate-700 mb-1">{t('online_meeting_link')}</label>
                           <input 
                                type="url" 
                                id="onlineLink" 
                                name="onlineLink" 
                                value={localEvent.onlineLink || ''} 
                                onChange={(e) => handleFieldChange('onlineLink', e.target.value)} 
                                placeholder="https://meet.google.com/..." 
                                className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#486966] focus:outline-none"
                            />
                        </div>

                        <div ref={workItemDropdownRef}>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Linked Items & Epics</label>
                           <div className="flex flex-wrap gap-1 mb-2">
                               {linkedItems.map(item => (
                                   <span key={item.id} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full text-xs text-slate-700">
                                       <span className="font-bold text-[10px] px-1 rounded bg-slate-200">{item.type === 'Epic' ? 'EPIC' : 'ITEM'}</span>
                                       <span className="truncate max-w-[150px]">{item.title}</span>
                                       <button type="button" onClick={() => handleToggleLinkedItem(item.id)} className="hover:text-red-500 ml-1"><XMarkIcon className="w-3 h-3"/></button>
                                   </span>
                               ))}
                           </div>
                           <div className="relative">
                               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                   <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                               </div>
                               <input 
                                    type="text" 
                                    value={workItemSearch} 
                                    onChange={(e) => setWorkItemSearch(e.target.value)} 
                                    onFocus={() => setIsWorkItemDropdownOpen(true)} 
                                    placeholder="Search Work Items or Epics..." 
                                    className="w-full h-10 pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#486966] focus:outline-none"
                                />
                               {isWorkItemDropdownOpen && (
                                   <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                       {filteredLinkableItems.map(item => (
                                           <li 
                                                key={item.id} 
                                                onClick={() => handleToggleLinkedItem(item.id)} 
                                                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 ${linkedItems.find(i => i.id === item.id) ? 'bg-slate-50' : ''}`}
                                            >
                                                <span className="truncate">
                                                    <span className="font-bold text-slate-500 mr-2 text-[10px] inline-block w-10">
                                                        {item.type === 'Epic' ? 'EPIC' : item.type.substring(0, 4).toUpperCase()}
                                                    </span> 
                                                    {item.title}
                                                </span>
                                                {linkedItems.find(i => i.id === item.id) && <span className="text-[#486966] font-bold">✓</span>}
                                           </li>
                                       ))}
                                       {filteredLinkableItems.length === 0 && <li className="px-3 py-2 text-sm text-slate-400 italic text-center">No items found</li>}
                                   </ul>
                               )}
                           </div>
                        </div>

                        <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">{t('attendees')}</label>
                             <div className="border border-slate-300 rounded-lg overflow-hidden">
                                 <div className="flex border-b border-slate-200 bg-slate-50">
                                     <button type="button" onClick={() => setAttendeeTab('users')} className={`flex-1 p-2 text-sm font-medium ${attendeeTab === 'users' ? 'bg-white border-b-2 border-[#486966] text-[#486966]' : 'text-slate-600 hover:bg-slate-100'}`}>{t('users')}</button>
                                     <button type="button" onClick={() => setAttendeeTab('teams')} className={`flex-1 p-2 text-sm font-medium ${attendeeTab === 'teams' ? 'bg-white border-b-2 border-[#486966] text-[#486966]' : 'text-slate-600 hover:bg-slate-100'}`}>{t('teams')}</button>
                                 </div>
                                 <div className="p-2 max-h-40 overflow-y-auto bg-white">
                                     {attendeeTab === 'users' && ALL_USERS.map(user => (
                                         <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-slate-900">
                                             <input 
                                                type="checkbox" 
                                                checked={selectedUserIds.has(user.id)} 
                                                onChange={() => setSelectedUserIds(prev => { const n = new Set(prev); n.has(user.id) ? n.delete(user.id) : n.add(user.id); return n; })} 
                                                className="h-4 w-4 text-[#486966] focus:ring-[#486966] rounded border-gray-300"
                                             />
                                             <img src={user.avatarUrl} className="w-6 h-6 rounded-full" />
                                             <span className="text-sm">{user.name}</span>
                                         </label>
                                     ))}
                                     {attendeeTab === 'teams' && teams.map(team => (
                                         <label key={team.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-slate-900">
                                             <input 
                                                type="checkbox" 
                                                checked={selectedTeamIds.has(team.id)} 
                                                onChange={() => setSelectedTeamIds(prev => { const n = new Set(prev); n.has(team.id) ? n.delete(team.id) : n.add(team.id); return n; })} 
                                                className="h-4 w-4 text-[#486966] focus:ring-[#486966] rounded border-gray-300"
                                             />
                                             <span className="text-sm font-medium">{team.name}</span>
                                             <span className="text-xs text-slate-500">({team.members.length} members)</span>
                                         </label>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </main>
                    <footer className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors">{t('cancel')}</button>
                        <button 
                            type="submit" 
                            disabled={!!dateError} 
                            className={`py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-colors ${hasUnresolvedConflicts ? 'bg-red-600 hover:bg-red-700' : 'bg-[#486966] hover:bg-[#3a5a58] disabled:bg-slate-300 disabled:cursor-not-allowed'}`}
                        >
                            {hasUnresolvedConflicts ? 'Force Save (Ignore Conflicts)' : t('save')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};
