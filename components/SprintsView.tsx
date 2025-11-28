
// components/SprintsView.tsx
import React, { useState, useMemo } from 'react';
import { Sprint, SprintState, Epic, WorkItem, Status } from '../types';
import { useLocale } from '../context/LocaleContext';
import { useBoard } from '../context/BoardContext';
import { SprintEditorModal } from './SprintEditorModal';
import { CompleteSprintModal } from './CompleteSprintModal';
import { TimerIcon, CheckCircleIcon, MountainIcon, MilestoneIcon, ClockIcon } from './icons';

interface SprintsViewProps {
    sprints: Sprint[];
    workItems: WorkItem[];
    onSaveSprint: (sprint: Partial<Sprint>) => void;
    onDeleteSprint: (sprint: Sprint) => void;
    onRestoreSprint: (sprintId: string) => void;
    epics: Epic[];
}

interface ExtendedSprintsViewProps extends SprintsViewProps {
    onCompleteSprint?: (sprintId: string, action: 'backlog' | 'move', targetSprintId?: string) => void;
}

type Tab = 'ACTIVE' | 'UPCOMING' | 'PAST' | 'DELETED';

const MOCK_TEAM_VELOCITY = 40;

export const SprintsView: React.FC<ExtendedSprintsViewProps> = ({ sprints, workItems, onSaveSprint, onDeleteSprint, onRestoreSprint, epics, onCompleteSprint }) => {
    const { t } = useLocale();
    const { can } = useBoard();
    const [activeTab, setActiveTab] = useState<Tab>('ACTIVE');
    const [editingSprint, setEditingSprint] = useState<Partial<Sprint> | null>(null);
    const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
    const canManage = can('sprint.manage');

    const filteredSprints = useMemo(() => {
        switch (activeTab) {
            case 'ACTIVE':
                return sprints.filter(s => s.state === SprintState.ACTIVE);
            case 'UPCOMING':
                return sprints.filter(s => s.state === SprintState.PLANNED).sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
            case 'PAST':
                 return sprints.filter(s => s.state === SprintState.CLOSED).sort((a,b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime());
            case 'DELETED':
                 return sprints.filter(s => s.state === SprintState.DELETED).sort((a,b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
            default:
                return [];
        }
    }, [sprints, activeTab]);
    
    // Include both PLANNED and ACTIVE sprints as potential targets (excluding the one being completed)
    const availableTargetSprints = useMemo(() => 
        sprints.filter(s => 
            (s.state === SprintState.PLANNED || s.state === SprintState.ACTIVE) && 
            s.id !== completingSprint?.id
        ).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()), 
    [sprints, completingSprint]);

    const handleNewSprint = () => {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 14);
        setEditingSprint({
            name: '',
            goal: '',
            startAt: startDate.toISOString(),
            endAt: endDate.toISOString(),
            state: SprintState.PLANNED,
            epicIds: []
        });
    };

    const handleSaveSprint = (sprintToSave: Partial<Sprint>) => {
        onSaveSprint(sprintToSave);
        setEditingSprint(null);
    };

    const handleCompleteConfirm = (sprintId: string, action: 'backlog' | 'move', targetSprintId?: string) => {
        if (onCompleteSprint) {
            onCompleteSprint(sprintId, action, targetSprintId);
        }
        setCompletingSprint(null);
    };

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
         <button 
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-[#486966] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    const renderTimeline = (sprint: Sprint) => {
        const now = new Date();
        const start = new Date(sprint.startAt);
        const end = new Date(sprint.endAt);
        const totalTime = end.getTime() - start.getTime();
        const elapsedTime = now.getTime() - start.getTime();
        
        let percent = 0;
        let dayLabel = '';

        if (totalTime > 0) {
            percent = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
            const daysTotal = Math.ceil(totalTime / (1000 * 60 * 60 * 24));
            const daysPassed = Math.ceil(elapsedTime / (1000 * 60 * 60 * 24));
            
            if (daysPassed <= 0) dayLabel = 'Starting soon';
            else if (daysPassed > daysTotal) dayLabel = 'Ended';
            else dayLabel = `Day ${daysPassed} of ${daysTotal}`;
        }

        return (
            <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Timeline</span>
                    <span className="font-medium">{dayLabel}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                    <div 
                        className="bg-blue-400 h-full rounded-full" 
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#3B3936]">{t('sprints')}</h2>
                {canManage && (
                    <button onClick={handleNewSprint} className="py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                        {t('newSprint')}
                    </button>
                )}
            </div>

            <div className="border-b border-gray-200">
                 <nav className="flex space-x-2">
                    <TabButton tab="ACTIVE" label={t('sprint_tab_active')} />
                    <TabButton tab="UPCOMING" label={t('sprint_tab_upcoming')} />
                    <TabButton tab="PAST" label={t('sprint_tab_past')} />
                    {canManage && <TabButton tab="DELETED" label={t('sprint_tab_deleted')} />}
                </nav>
            </div>
            
            <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase w-1/4">{t('sprintName')}</th>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('sprint_progress')}</th>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('epics')}</th>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase w-1/4">{t('goal')}</th>
                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {filteredSprints.map(sprint => {
                           const isActive = sprint.state === SprintState.ACTIVE;
                           const sprintItems = workItems.filter(i => i.sprintId === sprint.id);
                           const totalPoints = sprintItems.reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
                           const completedPoints = sprintItems.filter(i => i.status === Status.DONE).reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
                           const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
                           const isOverCapacity = totalPoints > MOCK_TEAM_VELOCITY;

                           // Calculate unique Epics count from items in sprint
                           const uniqueEpicIds = new Set(sprintItems.map(i => i.epicId).filter(Boolean));
                           const epicCount = uniqueEpicIds.size;

                           return (
                           <tr 
                                key={sprint.id} 
                                onClick={() => { if (sprint.state === SprintState.CLOSED || canManage) setEditingSprint(sprint); }}
                                className={`${isActive ? 'bg-green-50/40' : 'hover:bg-gray-50'} cursor-pointer relative group transition-colors`}
                            >
                               <td className="px-4 py-4 whitespace-nowrap align-top">
                                   {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>}
                                   <div className="flex items-center gap-2">
                                       <span className={`text-sm font-bold ${isActive ? 'text-green-800' : 'text-gray-900'}`}>{sprint.name}</span>
                                       {isActive && (
                                           <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 animate-pulse">LIVE</span>
                                       )}
                                   </div>
                                   <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                       <span>{new Date(sprint.startAt).toLocaleDateString()} – {new Date(sprint.endAt).toLocaleDateString()}</span>
                                   </div>
                               </td>
                               
                               {/* Progress Column + Mini Timeline */}
                               <td className="px-4 py-4 align-top w-56">
                                   <div className="w-full">
                                       <div className="flex justify-between text-xs mb-1">
                                           <span className="text-gray-600 font-medium">{completedPoints}/{totalPoints} pts</span>
                                           <span className="text-gray-500">{progress}%</span>
                                       </div>
                                       <div className="w-full bg-gray-200 rounded-full h-2">
                                           <div 
                                                className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-[#486966]'}`} 
                                                style={{ width: `${progress}%` }}
                                           ></div>
                                       </div>
                                       {isOverCapacity && sprint.state !== SprintState.CLOSED && (
                                           <div className="mt-1 flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                                               <TimerIcon className="w-3 h-3" />
                                               {t('sprint_capacity_warning')}
                                           </div>
                                       )}
                                       
                                       {isActive && renderTimeline(sprint)}
                                   </div>
                               </td>

                               {/* Epics Count Column (Simplified) */}
                               <td className="px-4 py-4 align-top text-sm text-gray-600">
                                   <div className="flex items-center gap-1.5">
                                       <MountainIcon className="w-4 h-4 text-gray-400" />
                                       <span className="font-semibold">{epicCount}</span> Epics
                                   </div>
                               </td>

                               <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-xs align-top">
                                   {sprint.goal || <span className="text-gray-300 italic">-</span>}
                               </td>

                               <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-end align-top">
                                   <div className="flex items-center justify-end gap-2">
                                       {isActive && canManage && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setCompletingSprint(sprint); }} 
                                                className="text-xs font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-200 mr-2"
                                            >
                                                {t('sprint_complete')}
                                            </button>
                                       )}
                                       
                                       {canManage && activeTab === 'DELETED' ? (
                                            <button onClick={(e) => { e.stopPropagation(); onRestoreSprint(sprint.id); }} className="text-indigo-600 hover:text-indigo-900 px-2 text-xs border border-indigo-200 rounded bg-indigo-50 hover:bg-indigo-100 py-1">
                                                Restore
                                            </button>
                                       ) : (
                                           canManage && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingSprint(sprint); }} className="text-gray-400 hover:text-[#486966] px-1 transition-colors">
                                                    {t('edit')}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteSprint(sprint); }} className="text-gray-400 hover:text-red-600 px-1 transition-colors">
                                                    {t('delete')}
                                                </button>
                                            </>
                                           )
                                       )}
                                   </div>
                               </td>
                           </tr>
                       )})}
                       {filteredSprints.length === 0 && (
                           <tr><td colSpan={5} className="text-center py-10 text-sm text-gray-500 bg-gray-50/30 rounded-b-lg">{t('noSprintsInCategory')}</td></tr>
                       )}
                    </tbody>
                 </table>
            </div>

            {editingSprint && (
                <SprintEditorModal 
                    sprint={editingSprint}
                    allEpics={epics}
                    onSave={handleSaveSprint}
                    onClose={() => setEditingSprint(null)}
                    readOnly={editingSprint.state === SprintState.CLOSED}
                />
            )}

            {completingSprint && (
                <CompleteSprintModal 
                    sprint={completingSprint}
                    workItems={workItems}
                    availableSprints={availableTargetSprints}
                    onClose={() => setCompletingSprint(null)}
                    onConfirm={handleCompleteConfirm}
                />
            )}
        </div>
    );
};
