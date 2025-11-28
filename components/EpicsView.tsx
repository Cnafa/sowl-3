import React, { useState, useMemo } from 'react';
import { Epic, WorkItem, EpicStatus, InvestmentHorizon, WorkItemType } from '../types';
import { useLocale } from '../context/LocaleContext';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { 
    ChevronRightIcon, 
    LayoutKanbanIcon, 
    PlusCircleIcon, 
    TrashIcon, 
    ArrowTopRightOnSquareIcon, 
    UsersRoundIcon, 
    MountainIcon, 
    CalendarRangeIcon, 
    GitBranchIcon, 
    LayersIcon, 
    TableIcon, 
    getIconByKey 
} from './icons';
import { 
    formatDate, 
    getContrastingColor, 
    toJalali, 
    toGregorian, 
    isLeapJalali, 
    JALALI_MONTH_LENGTHS, 
    JALALI_MONTH_NAMES, 
    JALALI_MONTH_NAMES_FA 
} from '../utils/dateUtils';
import { EpicEditor } from './EpicEditor';
import { DeleteEpicModal } from './DeleteEpicModal';
import { EPIC_COLORS } from '../constants';

interface EpicsViewProps {
    epics: Epic[];
    workItems: WorkItem[];
    onNewEpic: () => void;
    onEditEpic: (epic: Epic) => void;
    onUpdateStatus: (epicId: string, newStatus: EpicStatus) => void;
    onDeleteEpic: (epic: Epic) => void;
    onRestoreEpic: (epicId: string) => void;
    onNewItem: (options?: { epicId?: string }) => void;
    onBatchCreateItems: (items: Partial<WorkItem>[]) => void;
    onSelectWorkItem: (workItem: WorkItem) => void;
    onDeleteItem?: (item: WorkItem) => void;
}

type ViewTab = 'CARDS' | 'LIST' | 'ROADMAP' | 'DEPENDENCIES';

const ICEPopover: React.FC<{ epic: Epic; onUpdate: (updates: Partial<Epic>) => void; onClose: () => void }> = ({ epic, onUpdate, onClose }) => {
    // Updates ICE score components instantly
    const handleUpdate = (field: 'impact' | 'confidence' | 'ease', value: number) => {
        const updates: Partial<Epic> = { [field]: value };
        // Recalculate total score for optimistic UI (though parent usually handles this on save/update if logic is there)
        // Here we just pass the partial update. The backend/service should ideally recalculate iceScore.
        // If onUpdate expects just the field, we pass it.
        onUpdate(updates);
    };

    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-4 z-20 w-56 animate-fade-in-up">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">ICE Score</h4>
                <button onClick={onClose}><span className="text-slate-400 hover:text-slate-600">&times;</span></button>
            </div>
            <div className="space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600"><span>Impact</span><span className="font-bold">{epic.impact}</span></div>
                    <input type="range" min="1" max="10" value={epic.impact} onChange={(e) => handleUpdate('impact', parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#486966]" />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600"><span>Confidence</span><span className="font-bold">{epic.confidence}</span></div>
                    <input type="range" min="1" max="10" value={epic.confidence} onChange={(e) => handleUpdate('confidence', parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#486966]" />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600"><span>Ease</span><span className="font-bold">{epic.ease}</span></div>
                    <input type="range" min="1" max="10" value={epic.ease} onChange={(e) => handleUpdate('ease', parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#486966]" />
                </div>
            </div>
        </div>
    );
};

const EpicTableRow: React.FC<{
    epic: Epic;
    items: WorkItem[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onUpdate: (updates: Partial<Epic>) => void;
    onEdit: () => void;
    onDelete: () => void;
    onNewItem: () => void;
    onDeleteItem?: (item: WorkItem) => void;
    locale: string;
    t: (key: any) => string;
}> = ({ epic, items, isExpanded, onToggleExpand, onUpdate, onEdit, onDelete, onNewItem, onDeleteItem, locale, t }) => {
    const { user } = useAuth();
    const { can } = useBoard();
    const [showIcePopover, setShowIcePopover] = useState(false);
    const doneCount = items.filter(i => i.status === 'Done').length;
    const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

    const onDeleteClick = (e: React.MouseEvent, item: WorkItem) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        
        if (onDeleteItem) {
            onDeleteItem(item);
        }
    };

    const checkPermission = (item: WorkItem) => {
        return can('item.delete') || (can('item.edit.own') && item.reporter.id === user?.id);
    };

    return (
        <>
            <tr className={`hover:bg-slate-50 group border-b border-gray-100 ${isExpanded ? 'bg-slate-50' : ''}`}>
                <td className="px-4 py-3 whitespace-nowrap w-8">
                    <button onClick={onToggleExpand} className="p-1 text-slate-400 hover:text-slate-600">
                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : 'rtl:rotate-180'}`} />
                    </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={onEdit}>
                        <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: epic.color }}></div>
                        <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-800 truncate max-w-[200px]">{epic.name}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">{epic.aiSummary || epic.description?.slice(0, 50) || 'No description'}</div>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                    <select
                        value={epic.status}
                        onChange={(e) => onUpdate({ status: e.target.value as EpicStatus })}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-none focus:ring-1 focus:ring-[#486966] cursor-pointer ${epic.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : epic.status === 'DONE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <option value="ACTIVE">{t('epic_tab_active')}</option>
                        <option value="ON_HOLD">{t('epic_action_hold')}</option>
                        <option value="DONE">{t('epic_tab_done')}</option>
                    </select>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                    <select
                        value={epic.investmentHorizon}
                        onChange={(e) => onUpdate({ investmentHorizon: e.target.value as InvestmentHorizon })}
                        className="px-2 py-1 rounded text-xs font-medium border border-gray-200 bg-white focus:ring-1 focus:ring-[#486966] cursor-pointer text-slate-600"
                        onClick={e => e.stopPropagation()}
                    >
                        <option value="NOW">NOW</option>
                        <option value="NEXT">NEXT</option>
                        <option value="LATER">LATER</option>
                    </select>
                </td>
                <td className="px-4 py-3 whitespace-nowrap w-32">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-[#486966] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-medium text-slate-600 w-6 text-right">{progress}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{items.length} items</div>
                    </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center relative">
                    <button 
                        onClick={() => setShowIcePopover(!showIcePopover)}
                        className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 border border-slate-200"
                    >
                        {epic.iceScore.toFixed(1)}
                    </button>
                    {showIcePopover && <ICEPopover epic={epic} onUpdate={onUpdate} onClose={() => setShowIcePopover(false)} />}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                    <div>{formatDate(epic.startDate, locale)}</div>
                    <div>{formatDate(epic.endDate, locale)}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={onEdit} className="text-indigo-600 hover:text-indigo-900 mr-3 opacity-0 group-hover:opacity-100 transition-opacity">{t('edit')}</button>
                    <button type="button" onClick={onDelete} className="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4 inline" /></button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-50/50">
                    <td colSpan={8} className="px-4 py-2 border-b border-gray-200">
                        <div className="pl-8 pr-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <LayoutKanbanIcon className="w-3 h-3" />
                                    {t('epic_table_items_list')}
                                </h4>
                                <button 
                                    onClick={onNewItem}
                                    className="text-xs flex items-center gap-1 text-[#486966] hover:text-[#3a5a58] font-medium px-2 py-1 rounded hover:bg-[#486966]/10 transition-colors"
                                >
                                    <PlusCircleIcon className="w-3 h-3" />
                                    {t('epic_table_add_item')}
                                </button>
                            </div>
                            {items.length > 0 ? (
                                <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                                    <table className="min-w-full text-left text-xs">
                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-3 py-2">ID</th>
                                                <th className="px-3 py-2">Title</th>
                                                <th className="px-3 py-2">Status</th>
                                                <th className="px-3 py-2">Assignee</th>
                                                <th className="px-3 py-2">Priority</th>
                                                <th className="px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50 group/item">
                                                    <td className="px-3 py-2 font-mono text-slate-500">{item.id}</td>
                                                    <td className="px-3 py-2 font-medium text-slate-800">{item.title}</td>
                                                    <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{item.status}</span></td>
                                                    <td className="px-3 py-2 flex items-center gap-1">
                                                        {item.assignee ? (
                                                            <>
                                                                <img src={item.assignee.avatarUrl} className="w-4 h-4 rounded-full" />
                                                                <span>{item.assignee.name}</span>
                                                            </>
                                                        ) : <span className="text-slate-400">-</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-500">{item.priority}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        {onDeleteItem && checkPermission(item) && (
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => onDeleteClick(e, item)} 
                                                                onMouseDown={(e) => e.stopPropagation()} 
                                                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                                title="Delete Item"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-300 rounded-md">
                                    No items linked to this epic yet.
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const EpicNodeCard: React.FC<{ epic: Epic; level: number; onEdit: () => void }> = ({ epic, level, onEdit }) => (
    <div 
        className="w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 rounded-lg flex flex-col gap-2 cursor-pointer hover:translate-y-[-2px] transition-transform"
        onClick={onEdit}
    >
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded border border-gray-300 text-black">
                {getIconByKey(epic.icon || 'mountain', { className: "w-4 h-4" })}
            </div>
            <span className="font-bold text-sm truncate">{epic.name}</span>
        </div>
        <div className="text-xs text-gray-500">Level {level}</div>
    </div>
);

const EpicCard: React.FC<{ epic: Epic; items: WorkItem[]; canManageEpics: boolean; onEdit: (e: Epic) => void; onUpdateStatus: (id: string, s: EpicStatus) => void; onDelete: (e: Epic) => void; onRestore: (id: string) => void, t: Function }> = ({ epic, items, canManageEpics, onEdit, onUpdateStatus, onDelete, onRestore, t }) => {
    const doneCount = items.filter(i => i.status === 'Done').length;
    const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
    const teamIds = new Set(items.map(i => i.teamId).filter(Boolean));
    const teamCount = teamIds.size;

    return (
        <div className={`bg-white rounded-xl border-2 shadow-sm flex flex-col transition-all hover:shadow-md ${epic.status === EpicStatus.DONE ? 'border-gray-200 opacity-75' : 'border-slate-200'}`}>
             <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-xl">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: epic.color }}
                    >
                        {getIconByKey(epic.icon || 'mountain', { className: "w-6 h-6" })}
                    </div>
                    <div>
                        <h3 
                            className="font-bold text-slate-800 leading-tight cursor-pointer hover:text-[#486966]"
                            onClick={() => onEdit(epic)}
                        >
                            {epic.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="font-mono bg-slate-200 px-1.5 rounded text-slate-700">ICE {epic.iceScore.toFixed(1)}</span>
                            <span>•</span>
                            <span>{epic.investmentHorizon}</span>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    {canManageEpics && (
                        <button onClick={() => onEdit(epic)} className="text-slate-400 hover:text-slate-700 p-1">
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4">
                <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5em]">{epic.aiSummary || epic.description || <span className="italic text-slate-400">No description provided.</span>}</p>
                
                <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-600">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, backgroundColor: epic.color }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2">
                    <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full" title="Associated Teams">
                        <UsersRoundIcon className="w-3 h-3" />
                        <span>{t('epic_teams_count').replace('{count}', teamCount.toString())}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                        <LayoutKanbanIcon className="w-3 h-3" />
                        <span>{t('epic_items_count').replace('{count}', items.length.toString())}</span>
                    </div>
                </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-xl">
                <div className="flex gap-2">
                    {canManageEpics && epic.status !== EpicStatus.ARCHIVED && (
                        <select 
                            value={epic.status} 
                            onChange={(e) => onUpdateStatus(epic.id, e.target.value as EpicStatus)}
                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-[#486966]"
                        >
                            <option value="ACTIVE">{t('epic_tab_active')}</option>
                            <option value="ON_HOLD">{t('epic_tab_on_hold')}</option>
                            <option value="DONE">{t('epic_tab_done')}</option>
                        </select>
                    )}
                </div>
                {canManageEpics && (
                    <div className="flex gap-2">
                        {epic.status === EpicStatus.DELETED || epic.status === EpicStatus.ARCHIVED ? (
                            <button onClick={() => onRestore(epic.id)} className="text-xs text-blue-600 hover:underline">Restore</button>
                        ) : (
                            <button type="button" onClick={() => onDelete(epic)} className="text-gray-400 hover:text-red-600 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const EpicsView: React.FC<EpicsViewProps> = ({ epics, workItems, onNewEpic, onEditEpic, onUpdateStatus, onDeleteEpic, onRestoreEpic, onNewItem, onBatchCreateItems, onSelectWorkItem, onDeleteItem }) => {
    const { t, locale } = useLocale();
    const { can } = useBoard();
    const [activeTab, setActiveTab] = useState<EpicStatus | 'ALL'>(EpicStatus.ACTIVE);
    const [viewTab, setViewTab] = useState<ViewTab>('CARDS');
    
    const [isGroupedByHorizon, setIsGroupedByHorizon] = useState(false);
    const [expandedEpicIds, setExpandedEpicIds] = useState<Set<string>>(new Set());
    
    const [sortConfig, setSortConfig] = useState<{ key: keyof Epic | 'progress'; direction: 'asc' | 'desc' }>({ key: 'updatedAt', direction: 'desc' });
    const [searchQuery, setSearchQuery] = useState('');

    const [editingEpic, setEditingEpic] = useState<Partial<Epic> | null>(null);
    const [deletingEpic, setDeletingEpic] = useState<Epic | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    const canManageEpics = can('epic.manage');

    const itemsByEpic = useMemo(() => {
        const map: Record<string, WorkItem[]> = {};
        workItems.forEach(item => {
            if (item.epicId) {
                if (!map[item.epicId]) map[item.epicId] = [];
                map[item.epicId].push(item);
            }
        });
        return map;
    }, [workItems]);

    const filteredEpics = useMemo(() => {
        let filtered = epics;
        if (activeTab !== 'ALL') {
            filtered = filtered.filter(e => e.status === activeTab);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(e => e.name.toLowerCase().includes(q));
        }
        
        return filtered.sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            let valA: any = a[sortConfig.key as keyof Epic];
            let valB: any = b[sortConfig.key as keyof Epic];

            if (sortConfig.key === 'progress') {
                const itemsA = itemsByEpic[a.id] || [];
                const doneA = itemsA.filter(i => i.status === 'Done').length;
                valA = itemsA.length ? doneA / itemsA.length : 0;

                const itemsB = itemsByEpic[b.id] || [];
                const doneB = itemsB.filter(i => i.status === 'Done').length;
                valB = itemsB.length ? doneB / itemsB.length : 0;
            }

            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
        });
    }, [epics, activeTab, searchQuery, sortConfig, itemsByEpic]);

    const ViewToggleButton: React.FC<{ view: ViewTab; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
        <button 
            onClick={() => setViewTab(view)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewTab === view ? 'bg-[#486966] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
            {icon}
            {label}
        </button>
    );

    const handleEditClick = (epic: Epic) => {
        setEditingEpic(epic);
        setIsCreatingNew(false);
    };

    const handleNewClick = () => {
        setEditingEpic({});
        setIsCreatingNew(true);
    };

    const handleSaveEpic = (epicData: Partial<Epic>) => {
        onEditEpic(epicData as Epic);
        setEditingEpic(null);
        setIsCreatingNew(false);
    };

    const handleInlineUpdate = (epic: Epic, updates: Partial<Epic>) => {
        onEditEpic({ ...epic, ...updates });
    };

    const handleDeleteClick = (epic: Epic) => {
        setDeletingEpic(epic);
    };

    const handleConfirmDelete = (epicId: string, itemAction: 'detach') => {
        if (deletingEpic) {
            onDeleteEpic(deletingEpic);
            setDeletingEpic(null);
        }
    };
    
    const handleSort = (key: keyof Epic | 'progress') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleExpandEpic = (epicId: string) => {
        setExpandedEpicIds(prev => {
            const next = new Set(prev);
            if (next.has(epicId)) next.delete(epicId);
            else next.add(epicId);
            return next;
        });
    };

    const renderRoadmap = () => {
        const validDates = filteredEpics
            .flatMap(e => [e.startDate, e.endDate])
            .filter(d => d)
            .map(d => new Date(d!).getTime());
        
        let rawMin = validDates.length ? Math.min(...validDates) : new Date().getTime();
        let rawMax = validDates.length ? Math.max(...validDates) : new Date().getTime() + 30 * 24 * 3600 * 1000;
        
        const dayMs = 24 * 3600 * 1000;
        rawMax += 7 * dayMs;

        const isJalali = locale === 'fa-IR';
        let minTime: number;
        let maxTime: number = rawMax;

        const pxPerDay = 30;
        const months: { name: string, width: number }[] = [];

        if (isJalali) {
            const d = new Date(rawMin);
            const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
            const [ngy, ngm, ngd] = toGregorian(jy, jm, 1);
            minTime = new Date(ngy, ngm - 1, ngd).getTime();

            let cjy = jy;
            let cjm = jm;
            let currentTime = minTime;

            while (currentTime <= maxTime) {
                const monthName = (JALALI_MONTH_NAMES_FA[cjm] || JALALI_MONTH_NAMES[cjm]) + ' ' + cjy;
                let daysInMonth = JALALI_MONTH_LENGTHS[cjm];
                if (cjm === 12 && isLeapJalali(cjy)) daysInMonth = 30;

                months.push({ name: monthName, width: daysInMonth * pxPerDay });

                cjm++;
                if (cjm > 12) {
                    cjm = 1;
                    cjy++;
                }
                const [nextGy, nextGm, nextGd] = toGregorian(cjy, cjm, 1);
                currentTime = new Date(nextGy, nextGm - 1, nextGd).getTime();
            }
        } else {
            const d = new Date(rawMin);
            d.setDate(1);
            d.setHours(0,0,0,0);
            minTime = d.getTime();

            let current = new Date(minTime);
            const end = new Date(maxTime);
            
            while(current <= end) {
                const monthName = current.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
                const year = current.getFullYear();
                const month = current.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                months.push({ name: monthName, width: daysInMonth * pxPerDay });
                
                current.setMonth(current.getMonth() + 1);
            }
        }

        const totalWidth = months.reduce((acc, m) => acc + m.width, 0);

        return (
            <div className="overflow-x-auto border rounded-lg bg-white h-[600px]">
                <div style={{ width: `${Math.max(totalWidth, 800)}px`, minWidth: '100%' }}>
                    <div className="flex border-b bg-slate-50 sticky top-0 z-10 shadow-sm">
                        {months.map((m, i) => (
                            <div key={i} className="border-r px-2 py-2 text-xs font-bold text-slate-600 text-center truncate bg-slate-50" style={{ width: m.width, flexShrink: 0 }}>
                                {m.name}
                            </div>
                        ))}
                    </div>
                    
                    <div className="py-4 relative space-y-3 px-0">
                        {filteredEpics.map(epic => {
                            const start = epic.startDate ? new Date(epic.startDate).getTime() : new Date(epic.createdAt).getTime();
                            const end = epic.endDate ? new Date(epic.endDate).getTime() : start + 14 * dayMs; 
                            
                            const left = Math.max(0, (start - minTime) / dayMs * pxPerDay);
                            const durationDays = Math.max(1, (end - start) / dayMs);
                            const width = Math.max(pxPerDay, durationDays * pxPerDay);
                            
                            const textColor = getContrastingColor(epic.color);

                            return (
                                <div key={epic.id} className="relative h-8 group hover:bg-slate-50 transition-colors flex items-center">
                                    <div 
                                        className="absolute h-6 rounded shadow-sm border flex items-center px-2 text-xs font-bold truncate cursor-pointer hover:brightness-110 hover:scale-[1.01] transition-all z-0"
                                        style={{ 
                                            left: `${left}px`, 
                                            width: `${width}px`,
                                            backgroundColor: epic.color,
                                            color: textColor
                                        }}
                                        onClick={() => handleEditClick(epic)}
                                        title={`${epic.name} (${formatDate(new Date(start).toISOString(), locale)} - ${formatDate(new Date(end).toISOString(), locale)})`}
                                    >
                                        <span className="sticky left-2">{epic.name}</span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="absolute inset-0 pointer-events-none z-[-1] flex">
                             {months.map((m, i) => (
                                <div key={i} className="border-r border-slate-100 h-full" style={{ width: m.width, flexShrink: 0 }}></div>
                            ))}
                        </div>
                        
                        {(() => {
                            const now = new Date().getTime();
                            if (now >= minTime && now <= rawMax) {
                                const left = (now - minTime) / dayMs * pxPerDay;
                                return (
                                    <div 
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-0 pointer-events-none" 
                                        style={{ left: `${left}px` }} 
                                        title="Today"
                                    />
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </div>
        );
    };

    const renderDependencies = () => {
        const levels: Epic[][] = [];
        const epicMap = new Map<string, Epic>(epics.map(e => [e.id, e]));

        const getDepth = (id: string, depth = 0): number => {
            if (depth > 10) return 10;
            const epic = epicMap.get(id);
            if (!epic || !epic.dependencies || epic.dependencies.length === 0) return depth;
            return Math.max(...epic.dependencies.map(d => getDepth(d, depth + 1)));
        };

        epics.forEach(e => {
            const depth = getDepth(e.id);
            if (!levels[depth]) levels[depth] = [];
            levels[depth].push(e);
        });

        return (
            <div className="p-8 bg-slate-50 min-h-[500px] overflow-auto flex gap-16 items-center justify-start border rounded-lg">
               {levels.map((levelEpics, lvlIdx) => (
                   <div key={lvlIdx} className="flex flex-col gap-6">
                       {levelEpics.map(epic => (
                           <EpicNodeCard key={epic.id} epic={epic} level={lvlIdx} onEdit={() => handleEditClick(epic)} />
                       ))}
                   </div>
               ))}
               {levels.length === 0 && <p className="text-gray-400 italic">No dependency data available.</p>}
            </div>
        );
    };

    const renderTable = () => (
        <div className="border rounded-lg overflow-hidden bg-white">
            <div className="p-2 border-b bg-slate-50 flex justify-between items-center">
                <input 
                    type="text" 
                    placeholder="Search epics..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 border rounded text-sm w-64 focus:ring-2 focus:ring-[#486966] focus:outline-none"
                />
                <span className="text-xs text-slate-500">{filteredEpics.length} epics</span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 w-8"></th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>Status</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('investmentHorizon')}>{t('epic_table_horizon')}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('progress')}>Progress</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('iceScore')}>ICE</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('startDate')}>Timeline</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEpics.map(epic => (
                        <EpicTableRow
                            key={epic.id}
                            epic={epic}
                            items={itemsByEpic[epic.id] || []}
                            isExpanded={expandedEpicIds.has(epic.id)}
                            onToggleExpand={() => toggleExpandEpic(epic.id)}
                            onUpdate={(updates) => handleInlineUpdate(epic, updates)}
                            onEdit={() => handleEditClick(epic)}
                            onDelete={() => handleDeleteClick(epic)}
                            onNewItem={() => onNewItem({ epicId: epic.id })}
                            onDeleteItem={onDeleteItem}
                            locale={locale}
                            t={t}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCards = () => {
        if (isGroupedByHorizon) {
            const horizons = [InvestmentHorizon.NOW, InvestmentHorizon.NEXT, InvestmentHorizon.LATER];
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {horizons.map(horizon => {
                        const horizonEpics = filteredEpics.filter(e => (e.investmentHorizon || InvestmentHorizon.NOW) === horizon);
                        return (
                            <div key={horizon} className="flex flex-col gap-4 bg-slate-100/50 p-3 rounded-xl border border-slate-200/60">
                                <h3 className="font-black text-sm uppercase text-slate-500 tracking-wider flex justify-between items-center px-1">
                                    {horizon}
                                    <span className="bg-slate-200 text-slate-600 rounded px-2 py-0.5 text-xs">{horizonEpics.length}</span>
                                </h3>
                                <div className="flex flex-col gap-3 overflow-y-auto">
                                    {horizonEpics.map(epic => (
                                        <EpicCard 
                                            key={epic.id} 
                                            epic={epic} 
                                            items={itemsByEpic[epic.id] || []}
                                            canManageEpics={canManageEpics}
                                            onEdit={handleEditClick}
                                            onUpdateStatus={onUpdateStatus}
                                            onDelete={handleDeleteClick}
                                            onRestore={onRestoreEpic}
                                            t={t}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEpics.map(epic => (
                    <EpicCard 
                        key={epic.id} 
                        epic={epic} 
                        items={itemsByEpic[epic.id] || []}
                        canManageEpics={canManageEpics}
                        onEdit={handleEditClick}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={handleDeleteClick}
                        onRestore={onRestoreEpic}
                        t={t}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow min-h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-[#3B3936] flex items-center gap-2">
                        <MountainIcon className="w-6 h-6 text-[#486966]" />
                        {t('epics')}
                    </h2>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <ViewToggleButton view="CARDS" icon={<LayoutKanbanIcon className="w-4 h-4"/>} label={t('epic_view_card')} />
                            <ViewToggleButton view="LIST" icon={<TableIcon className="w-4 h-4"/>} label={t('epic_view_list')} />
                            <ViewToggleButton view="ROADMAP" icon={<CalendarRangeIcon className="w-4 h-4"/>} label={t('epic_view_roadmap')} />
                            <ViewToggleButton view="DEPENDENCIES" icon={<GitBranchIcon className="w-4 h-4"/>} label={t('epic_graph_view')} />
                        </div>
                        
                        {viewTab === 'CARDS' && (
                            <button
                                onClick={() => setIsGroupedByHorizon(!isGroupedByHorizon)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${isGroupedByHorizon ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                title={t('epic_group_horizon')}
                            >
                                <LayersIcon className="w-4 h-4" />
                                {t('epic_group_horizon')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {['ACTIVE', 'ON_HOLD', 'DONE'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveTab(status as EpicStatus)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === status ? 'bg-white text-[#486966] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t(`epic_tab_${status.toLowerCase()}` as any)}
                            </button>
                        ))}
                    </div>

                    {canManageEpics && (
                        <button onClick={handleNewClick} className="flex items-center gap-2 py-2 px-4 text-sm font-bold rounded-md text-white bg-[#486966] hover:bg-[#3a5a58] shadow-sm">
                            <PlusCircleIcon className="w-5 h-5" />
                            {t('newEpic')}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1">
                {viewTab === 'CARDS' && renderCards()}
                {viewTab === 'LIST' && renderTable()}
                {viewTab === 'ROADMAP' && renderRoadmap()}
                {viewTab === 'DEPENDENCIES' && renderDependencies()}
                
                {filteredEpics.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 mt-4">
                        <MountainIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No epics found in this view.</p>
                    </div>
                )}
            </div>

            {(editingEpic) && (
                <EpicEditor 
                    epic={editingEpic} 
                    allEpics={epics}
                    onSave={handleSaveEpic} 
                    onCancel={() => { setEditingEpic(null); setIsCreatingNew(false); }}
                    isNew={isCreatingNew}
                    onCreateItems={onBatchCreateItems}
                />
            )}

            {deletingEpic && (
                <DeleteEpicModal 
                    epic={deletingEpic} 
                    workItems={workItems} 
                    onClose={() => setDeletingEpic(null)} 
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
};