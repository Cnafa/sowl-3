
import React, { useState, useMemo } from 'react';
import { Sprint, WorkItem, Status, SprintState } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon } from './icons';

interface CompleteSprintModalProps {
    sprint: Sprint;
    workItems: WorkItem[];
    availableSprints: Sprint[];
    onClose: () => void;
    onConfirm: (sprintId: string, action: 'backlog' | 'move', targetSprintId?: string) => void;
}

export const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({ sprint, workItems, availableSprints, onClose, onConfirm }) => {
    const { t } = useLocale();
    const [action, setAction] = useState<'backlog' | 'move'>('backlog');
    const [targetSprintId, setTargetSprintId] = useState<string>(availableSprints[0]?.id || '');

    const { completedCount, openCount } = useMemo(() => {
        const sprintItems = workItems.filter(i => i.sprintId === sprint.id);
        const completed = sprintItems.filter(i => i.status === Status.DONE).length;
        return {
            completedCount: completed,
            openCount: sprintItems.length - completed
        };
    }, [workItems, sprint.id]);

    const handleConfirm = () => {
        onConfirm(sprint.id, action, targetSprintId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-200 rounded-t-lg">
                    <h2 className="text-xl font-bold text-[#3B3936]">Complete Sprint: {sprint.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-slate-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="p-6 space-y-6">
                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="flex-1 p-3 border border-green-200 bg-green-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-800">{completedCount}</div>
                            <div className="text-xs font-bold uppercase tracking-wider text-green-700">Completed</div>
                        </div>
                        <div className="flex-1 p-3 border border-red-200 bg-red-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-800">{openCount}</div>
                            <div className="text-xs font-bold uppercase tracking-wider text-red-700">Open</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="font-semibold text-slate-800">Move {openCount} open items to:</p>
                        
                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                            <input 
                                type="radio" 
                                name="moveAction" 
                                value="backlog" 
                                checked={action === 'backlog'} 
                                onChange={() => setAction('backlog')}
                                className="w-4 h-4 text-[#486966] focus:ring-[#486966]"
                            />
                            <span className="text-sm font-medium text-slate-700">Backlog</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                            <input 
                                type="radio" 
                                name="moveAction" 
                                value="move" 
                                checked={action === 'move'} 
                                onChange={() => setAction('move')}
                                disabled={availableSprints.length === 0}
                                className="w-4 h-4 text-[#486966] focus:ring-[#486966]"
                            />
                            <div className="flex-1">
                                <span className={`text-sm font-medium ${availableSprints.length === 0 ? 'text-gray-400' : 'text-slate-700'}`}>New Sprint</span>
                                {action === 'move' && (
                                    <select 
                                        value={targetSprintId} 
                                        onChange={(e) => setTargetSprintId(e.target.value)}
                                        className="mt-2 w-full p-2 border border-slate-300 rounded-md text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#486966] focus:border-transparent"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {availableSprints.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </label>
                        {availableSprints.length === 0 && (
                            <p className="text-xs text-red-600 font-medium px-1">No valid destination sprints available.</p>
                        )}
                    </div>
                </main>

                <footer className="p-4 border-t border-slate-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-white text-slate-700"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={action === 'move' && !targetSprintId} 
                        className="px-4 py-2 text-sm font-medium bg-[#486966] text-white rounded-md hover:bg-[#3a5a58] shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Complete Sprint
                    </button>
                </footer>
            </div>
        </div>
    );
};
