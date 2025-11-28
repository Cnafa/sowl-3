
// components/EventViewModal.tsx
import React, { useMemo } from 'react';
import { CalendarEvent, WorkItem, User, Epic } from '../types';
import { XMarkIcon, ArrowTopRightOnSquareIcon, CloudIcon } from './icons';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';

interface EventViewModalProps {
  event: CalendarEvent;
  workItems: WorkItem[];
  epics?: Epic[];
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onOpenWorkItem: (itemId: string) => void;
}

const DetailField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <p className="text-sm font-medium text-[#889C9B] mb-1">{label}</p>
        <div className="text-sm text-[#3B3936]">{children}</div>
    </div>
);

const UserChip: React.FC<{ user: User }> = ({ user }) => (
    <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
        <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
        <span className="text-sm text-slate-800">{user.name}</span>
    </div>
);


export const EventViewModal: React.FC<EventViewModalProps> = ({ event, workItems, epics = [], onClose, onEdit, onOpenWorkItem }) => {
    const { t } = useLocale();
    const { user } = useAuth();
    const { can } = useBoard();

    const canEditEvent = user && (event.createdBy.id === user.id || can('sprint.manage')) && event.source !== 'GOOGLE_CALENDAR';
    
    const linkedItems = useMemo(() => {
        const ids = new Set(event.linkedWorkItemIds || []);
        if (event.linkedWorkItemId && !ids.has(event.linkedWorkItemId)) ids.add(event.linkedWorkItemId);
        
        const allItems = [
            ...workItems.map(w => ({ id: w.id, title: w.title, kind: 'item' })),
            ...epics.map(e => ({ id: e.id, title: e.name, kind: 'epic' }))
        ];
        return allItems.filter(i => ids.has(i.id));
    }, [event, workItems, epics]);
    
    const formattedDate = (start: Date, end: Date) => {
        return `${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}`;
    };

    const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]" onMouseDown={handleBackdropMouseDown}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-[#3B3936] flex items-center gap-2">
                            {event.source === 'GOOGLE_CALENDAR' && <CloudIcon className="w-5 h-5 text-blue-500" />}
                            {event.title}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEditEvent && (
                             <button onClick={() => onEdit(event)} className="py-2 px-3 text-sm font-medium rounded-md text-[#3B3936] border border-[#889C9B] hover:bg-gray-100">{t('edit')}</button>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                            <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <DetailField label={t('eventView_source')}>
                        {event.source === 'GOOGLE_CALENDAR' ? (
                            <span className="inline-flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                <CloudIcon className="w-4 h-4" />
                                {t('eventView_source_google')}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[#486966] font-medium bg-[#486966]/10 px-2 py-1 rounded">
                                <div className="w-3 h-3 bg-[#486966] rounded-full"></div>
                                {t('eventView_source_internal')}
                            </span>
                        )}
                    </DetailField>

                    {event.onlineLink && (
                        <a 
                            href={event.onlineLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58]"
                            aria-label={`Join online meeting for ${event.title}`}
                        >
                            {t('join_meeting')}
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                    )}
                    <DetailField label={t('eventView_time')}>
                        {formattedDate(event.start, event.end)}
                    </DetailField>
                    
                    {event.description && (
                        <DetailField label={t('description')}>
                            <p className="p-3 bg-gray-50 rounded-md">{event.description}</p>
                        </DetailField>
                    )}

                    {linkedItems.length > 0 && (
                        <DetailField label="Linked Items">
                            <div className="flex flex-wrap gap-2">
                                {linkedItems.map(item => (
                                    <button 
                                        key={item.id}
                                        onClick={() => onOpenWorkItem(item.id)}
                                        className="inline-flex items-center gap-1.5 text-sm text-[#486966] hover:underline bg-slate-50 border border-slate-200 px-2 py-1 rounded"
                                    >
                                        <span className="font-bold text-[10px] px-1 bg-slate-200 rounded text-slate-600 uppercase">{item.kind}</span>
                                        <span className="truncate max-w-[200px]">{item.title}</span>
                                        <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                                    </button>
                                ))}
                            </div>
                        </DetailField>
                    )}

                    <DetailField label={t('attendees')}>
                        <div className="flex flex-wrap gap-2">
                            {event.attendees.map(attendee => <UserChip key={attendee.id} user={attendee} />)}
                        </div>
                    </DetailField>

                     <DetailField label={t('eventView_createdBy')}>
                        <UserChip user={event.createdBy} />
                    </DetailField>
                </main>
            </div>
        </div>
    );
};