
// components/SprintEditorModal.tsx
import React, { useState, useMemo } from 'react';
import { Sprint, Epic, EpicStatus } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon, CheckSquareIcon, MountainIcon } from './icons';
import { DateField } from './DateField';

interface SprintEditorModalProps {
    sprint: Partial<Sprint>;
    allEpics: Epic[];
    onSave: (sprint: Partial<Sprint>) => void;
    onClose: () => void;
    readOnly?: boolean;
}

export const SprintEditorModal: React.FC<SprintEditorModalProps> = ({ sprint, allEpics, onSave, onClose, readOnly = false }) => {
    const { t } = useLocale();
    const [localSprint, setLocalSprint] = useState<Partial<Sprint>>(sprint);
    const [assignedEpicIds, setAssignedEpicIds] = useState<Set<string>>(new Set(sprint.epicIds || []));
    const [search, setSearch] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [nameError, setNameError] = useState('');
    const [dateError, setDateError] = useState('');

    const { availableEpics, assignedEpics } = useMemo(() => {
        const lowercasedSearch = search.toLowerCase();
        
        const relevantEpics = allEpics.filter(e => {
            const isArchived = e.status === EpicStatus.ARCHIVED;
            const isDeleted = e.status === EpicStatus.DELETED;
            const isDone = e.status === EpicStatus.DONE;
            if (isArchived || isDeleted) return false;
            if (isDone && !showCompleted) return false;
            return e.name.toLowerCase().includes(lowercasedSearch);
        });

        const available = relevantEpics
            .filter(e => !assignedEpicIds.has(e.id))
            .sort((a, b) => (b.iceScore || 0) - (a.iceScore || 0));

        const assigned = allEpics.filter(e => assignedEpicIds.has(e.id));
        
        return {
            availableEpics: available,
            assignedEpics: assigned,
        };
    }, [allEpics, assignedEpicIds, search, showCompleted]);

    const toggleEpic = (epicId: string) => {
        if (readOnly) return;
        setAssignedEpicIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(epicId)) newSet.delete(epicId);
            else newSet.add(epicId);
            return newSet;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'name') {
            setNameError('');
        }
        setLocalSprint(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (field: 'startAt' | 'endAt', value: string | null) => {
        setDateError('');
        const newSprint = { ...localSprint, [field]: value };

        // Validation logic
        if (newSprint.startAt && newSprint.endAt) {
            const start = new Date(newSprint.startAt);
            const end = new Date(newSprint.endAt);
            if (end <= start) {
                setDateError('End date must be after the start date.');
            }
        }
        setLocalSprint(newSprint);
    };

    const handleSave = () => {
        if (!localSprint.name?.trim()) {
            setNameError("Sprint name cannot be empty.");
            return;
        }
        if (dateError) return;
        onSave({ ...localSprint, epicIds: Array.from(assignedEpicIds) });
    };

    const minEndDate = useMemo(() => {
        if (!localSprint.startAt) return undefined;
        const start = new Date(localSprint.startAt);
        start.setDate(start.getDate() + 1); // must be at least one day after
        return start;
    }, [localSprint.startAt]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white w-full max-w-4xl h-[90vh] flex flex-col rounded-lg shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-[#3B3936]">
                        {sprint.id ? (readOnly ? t('sprintEditor_viewTitle').replace('{sprintName}', sprint.name!) : t('sprintEditor_editTitle').replace('{sprintName}', sprint.name!)) : t('newSprint')}
                    </h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-slate-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left: General Info */}
                    <div className="w-full md:w-5/12 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 bg-white">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                            <span className="w-6 h-6 bg-[#486966] text-white flex items-center justify-center text-xs rounded-full">1</span>
                            General Info
                        </h3>
                        
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">{t('sprintName')}</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    value={localSprint.name || ''} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={readOnly} 
                                    className={`w-full px-3 py-2 bg-white border rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${nameError ? 'border-red-500' : 'border-slate-300'}`} 
                                    placeholder="e.g., Sprint 42"
                                />
                                {nameError && <p className="text-red-600 text-xs mt-1">{t('sprintEditor_error_nameEmpty')}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('sprintDates')}</label>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs font-medium text-slate-500 mb-1 block">Starts</span>
                                            <DateField className="border-slate-300" value={localSprint.startAt!} onChange={(date) => handleDateChange('startAt', date)} disabled={readOnly} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-slate-500 mb-1 block">Ends</span>
                                            <DateField className="border-slate-300" value={localSprint.endAt!} onChange={(date) => handleDateChange('endAt', date)} minDate={minEndDate} disabled={readOnly} />
                                        </div>
                                    </div>
                                    {dateError && <p className="text-red-600 text-xs font-bold mt-2">{t('sprintEditor_error_endDate')}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="goal" className="block text-sm font-medium text-slate-700 mb-1">{t('sprintEditor_goal_optional')}</label>
                                <textarea 
                                    id="goal" 
                                    name="goal" 
                                    value={localSprint.goal || ''} 
                                    onChange={handleChange} 
                                    rows={4} 
                                    disabled={readOnly} 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed resize-none"
                                    placeholder="What is the main focus of this sprint?"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Epic Assignment */}
                    <div className="w-full md:w-7/12 flex flex-col bg-slate-50/50">
                        <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                                    <span className="w-6 h-6 bg-[#486966] text-white flex items-center justify-center text-xs rounded-full">2</span>
                                    {t('assignEpics')}
                                    <span className="text-sm font-normal text-slate-500 ml-2">({assignedEpicIds.size} selected)</span>
                                </h3>
                            </div>
                            
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="search" 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        placeholder={t('sprintEditor_searchEpics')} 
                                        disabled={readOnly} 
                                        className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100" 
                                    />
                                    <span className="absolute left-2 top-1.5 text-slate-400">🔍</span>
                                </div>
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none px-2 hover:bg-slate-100 rounded-md">
                                    <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} disabled={readOnly} className="w-4 h-4 rounded border-slate-300 text-[#486966] focus:ring-[#486966]" />
                                    Show Done
                                </label>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {/* Assigned Epics at Top */}
                            {assignedEpics.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-green-700 uppercase mb-2 pl-1">Assigned to Sprint</h4>
                                    {assignedEpics.map(epic => (
                                        <div 
                                            key={epic.id}
                                            onClick={() => toggleEpic(epic.id)}
                                            className={`group flex items-center p-2 mb-1 border border-green-200 bg-green-50 rounded-md cursor-pointer hover:bg-green-100 transition-colors ${readOnly ? 'cursor-default' : ''}`}
                                        >
                                            <div className="flex-shrink-0 mr-3">
                                                <CheckSquareIcon className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm truncate text-green-900">{epic.name}</span>
                                                    <span className="text-[10px] font-mono bg-white border border-green-200 px-1 rounded text-green-800">{epic.iceScore.toFixed(1)} ICE</span>
                                                </div>
                                                <div className="text-xs text-green-700 mt-0.5 flex gap-2">
                                                    <span>Items: {epic.openItemsCount} open / {epic.totalItemsCount} total</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Available Epics */}
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Available Epics</h4>
                            {availableEpics.map(epic => (
                                <div 
                                    key={epic.id}
                                    onClick={() => toggleEpic(epic.id)}
                                    className={`group flex items-center p-2 mb-1 border border-slate-200 rounded-md bg-white cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all ${readOnly ? 'cursor-default opacity-60' : ''}`}
                                >
                                    <div className="flex-shrink-0 mr-3 w-5 h-5 border border-slate-300 rounded-sm flex items-center justify-center bg-white">
                                        {/* Checkbox placeholder */}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: epic.color }}></div>
                                            <span className="font-medium text-sm truncate text-slate-800">{epic.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            ICE: {epic.iceScore.toFixed(1)} • {epic.openItemsCount} items open
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {availableEpics.length === 0 && assignedEpics.length === 0 && (
                                <div className="text-center py-8 text-slate-400 italic">No epics found matching criteria.</div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="p-4 border-t border-slate-200 bg-gray-50 rounded-b-lg flex justify-between items-center">
                    <div className="text-xs text-slate-500 font-medium">
                        {readOnly ? 'Read Only Mode' : '* Required fields'}
                    </div>
                    <div className="flex gap-3">
                        {readOnly ? (
                             <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-white text-slate-700">{t('close')}</button>
                        ) : (
                            <>
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-white text-slate-700">{t('cancel')}</button>
                                <button 
                                    type="button" 
                                    onClick={handleSave} 
                                    disabled={!!dateError || !!nameError} 
                                    className="px-4 py-2 text-sm font-medium bg-[#486966] text-white rounded-md hover:bg-[#3a5a58] shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {t('save')}
                                </button>
                            </>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};
