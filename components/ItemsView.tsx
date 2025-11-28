
// components/ItemsView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { WorkItem, Epic, Sprint, SprintState, User, WorkItemType, Status, Priority } from '../types';
import { useLocale } from '../context/LocaleContext';
import { MagnifyingGlassIcon, MilestoneIcon, ChevronRightIcon, FlagIcon, TrashIcon } from './icons';
import { KANBAN_COLUMNS, WORK_ITEM_TYPES, PRIORITIES } from '../constants';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const AssigneeAvatars: React.FC<{ assignees: User[] }> = ({ assignees }) => {
    if (assignees.length === 0) return <span className="text-slate-400">-</span>;
    return (
        <div className="flex -space-x-2">
            {assignees.slice(0, 3).map(user => (
                <img key={user.id} src={user.avatarUrl} alt={user.name} title={user.name} className="w-6 h-6 rounded-full border-2 border-white"/>
            ))}
            {assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                    +{assignees.length - 3}
                </div>
            )}
        </div>
    );
};

const QuickScopePill: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${isActive ? 'bg-[#486966] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
        {label}
    </button>
);

const StatusBadge: React.FC<{ status: string, t: Function }> = ({ status, t }) => {
    let classes = 'bg-slate-100 text-slate-700';
    if (status === 'Done') classes = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    else if (status === 'In Progress') classes = 'bg-blue-50 text-blue-700 border border-blue-100';
    else if (status === 'To Do') classes = 'bg-gray-100 text-gray-700 border border-gray-200';
    else if (status === 'Backlog') classes = 'bg-slate-50 text-slate-500 border border-slate-200 dashed';
    
    const localizedStatus = t(`status_${status.replace(' ', '_').toUpperCase()}`) || status;

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${classes}`}>
            {localizedStatus}
        </span>
    );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const colorMap: Record<string, string> = {
        [Priority.URGENT]: 'text-red-600',
        [Priority.HIGH]: 'text-orange-500',
        [Priority.MEDIUM]: 'text-yellow-600',
        [Priority.LOW]: 'text-slate-500',
    };
    return (
        <div className="flex items-center gap-1">
            <FlagIcon className={`w-3 h-3 ${colorMap[priority] || 'text-slate-400'}`} />
            <span className={`text-xs ${colorMap[priority] || 'text-slate-600'}`}>{priority}</span>
        </div>
    );
};

interface ItemsViewProps {
    workItems: WorkItem[];
    epics: Epic[];
    sprints: Sprint[];
    onItemUpdate: (item: WorkItem) => void;
    onSelectWorkItem: (workItem: WorkItem) => void;
    onDeleteItem?: (item: WorkItem) => void;
}

type SortKey = 'id' | 'title' | 'status' | 'priority' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export const ItemsView: React.FC<ItemsViewProps> = ({ workItems, epics, sprints, onItemUpdate, onSelectWorkItem, onDeleteItem }) => {
    const { t, locale } = useLocale();
    const { user } = useAuth();
    const { can } = useBoard();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCell, setEditingCell] = useState<{ itemId: string; column: 'epic' | 'sprint' | 'status' | 'priority' } | null>(null);
    
    const [quickScope, setQuickScope] = useState<'ALL' | 'NO_EPIC' | 'WITH_EPIC'>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'updatedAt', direction: 'desc' });

    const debouncedSearch = useDebounce(searchQuery, 300);

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedItems = useMemo(() => {
        let items = [...workItems];

        // Apply quick scope
        if (quickScope === 'NO_EPIC') {
            items = items.filter(item => !item.epicId);
        } else if (quickScope === 'WITH_EPIC') {
            items = items.filter(item => !!item.epicId);
        }

        // Apply type filter
        if (typeFilter !== 'ALL') {
            items = items.filter(item => item.type === typeFilter);
        }

        // Apply status filter
        if (statusFilter !== 'ALL') {
            items = items.filter(item => item.status === statusFilter);
        }

        // Apply search query
        if (debouncedSearch) {
            const lowerQuery = debouncedSearch.toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(lowerQuery) || 
                item.id.toLowerCase().includes(lowerQuery)
            );
        }
        
        // Apply Sorting
        return items.sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];

            if (sortConfig.key === 'updatedAt') {
                valA = new Date(a.updatedAt).getTime();
                valB = new Date(b.updatedAt).getTime();
            } else if (sortConfig.key === 'priority') {
                // Custom priority sort
                const priorityOrder = { [Priority.URGENT]: 3, [Priority.HIGH]: 2, [Priority.MEDIUM]: 1, [Priority.LOW]: 0 };
                valA = priorityOrder[a.priority];
                valB = priorityOrder[b.priority];
            }

            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
        });

    }, [workItems, debouncedSearch, quickScope, typeFilter, statusFilter, sortConfig]);

    const handleInlineSave = (item: WorkItem, column: 'epic' | 'sprint' | 'status' | 'priority', value: string) => {
        let updatedItem = { ...item };
        if (column === 'epic') {
            const epic = epics.find(e => e.id === value);
            updatedItem = { ...updatedItem, epicId: epic?.id, epicInfo: epic ? { id: epic.id, name: epic.name, color: epic.color } : undefined };
        } else if (column === 'sprint') {
            updatedItem = { ...updatedItem, sprintId: value || undefined };
        } else if (column === 'status') {
            updatedItem = { ...updatedItem, status: value as Status };
        } else if (column === 'priority') {
            updatedItem = { ...updatedItem, priority: value as Priority };
        }
        onItemUpdate(updatedItem);
        setEditingCell(null);
    };

    // Corrected delete handler with strict event management
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

    const selectableSprints = useMemo(() => sprints.filter(s => s.state === SprintState.ACTIVE || s.state === SprintState.PLANNED), [sprints]);
    
    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity"><ChevronRightIcon className="w-3 h-3 rotate-90" /></div>;
        return (
            <div className={`w-4 h-4 transition-transform ${sortConfig.direction === 'asc' ? '-rotate-90' : 'rotate-90'}`}>
                <ChevronRightIcon className="w-3 h-3 text-[#486966]" />
            </div>
        );
    };

    const HeaderCell: React.FC<{ label: string, sortKey?: SortKey, className?: string }> = ({ label, sortKey, className }) => (
        <th 
            scope="col" 
            onClick={() => sortKey && handleSort(sortKey)}
            className={`px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider group select-none ${sortKey ? 'cursor-pointer hover:bg-slate-100 hover:text-gray-700' : ''} ${className}`}
        >
            <div className="flex items-center gap-1">
                {label}
                {sortKey && <SortIcon column={sortKey} />}
            </div>
        </th>
    );

    const getLocalizedStatusTitle = (status: Status) => {
        return t(`status_${status.replace(' ', '_').toUpperCase()}` as any) || status;
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow h-full flex flex-col">
            <header className="flex-shrink-0 pb-4 border-b">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('itemsView')}</h2>
                    <div className="text-xs text-slate-500">{t('items_count_suffix').replace('{count}', filteredAndSortedItems.length.toString())}</div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                     <div className="flex items-center gap-2">
                        <QuickScopePill label={t('items_quickScope_all')} isActive={quickScope === 'ALL'} onClick={() => setQuickScope('ALL')} />
                        <QuickScopePill label={t('items_quickScope_noEpic')} isActive={quickScope === 'NO_EPIC'} onClick={() => setQuickScope('NO_EPIC')} />
                        <QuickScopePill label={t('items_quickScope_withEpic')} isActive={quickScope === 'WITH_EPIC'} onClick={() => setQuickScope('WITH_EPIC')} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486966]">
                            <option value="ALL">{t('all_item_types')}</option>
                            {WORK_ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486966]">
                            <option value="ALL">{t('all_statuses')}</option>
                            {KANBAN_COLUMNS.map(col => <option key={col.status} value={col.status}>{getLocalizedStatusTitle(col.status)}</option>)}
                        </select>
                        <div className="relative w-full sm:w-56">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486966] placeholder-slate-500"
                            />
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 overflow-auto mt-4 border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <HeaderCell label="ID" sortKey="id" className="w-20" />
                            <HeaderCell label={t('title')} sortKey="title" />
                            <HeaderCell label={t('type')} />
                            <HeaderCell label={t('status')} sortKey="status" className="w-32" />
                            <HeaderCell label={t('priority')} sortKey="priority" className="w-28" />
                            <HeaderCell label={t('assignee')} />
                            <HeaderCell label={t('epic')} className="w-40" />
                            <HeaderCell label={t('sprint')} className="w-36" />
                            <HeaderCell label={t('lastModified')} sortKey="updatedAt" className="w-32" />
                            <HeaderCell label="" className="w-10" />
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedItems.map(item => (
                            <tr key={item.id} onClick={() => onSelectWorkItem(item)} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-500">{item.id}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate" title={item.title}>{item.title}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{item.type}</td>
                                
                                {/* Status - Editable */}
                                <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                    {editingCell?.itemId === item.id && editingCell?.column === 'status' ? (
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleInlineSave(item, 'status', e.target.value)}
                                            onBlur={() => setEditingCell(null)}
                                            autoFocus
                                            className="text-xs p-1 border rounded bg-white shadow-sm focus:ring-2 focus:ring-[#486966]"
                                        >
                                            {KANBAN_COLUMNS.map(col => <option key={col.status} value={col.status}>{getLocalizedStatusTitle(col.status)}</option>)}
                                        </select>
                                    ) : (
                                        <div onClick={() => setEditingCell({ itemId: item.id, column: 'status' })} className="cursor-pointer">
                                            <StatusBadge status={item.status} t={t} />
                                        </div>
                                    )}
                                </td>

                                {/* Priority - Editable */}
                                <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                     {editingCell?.itemId === item.id && editingCell?.column === 'priority' ? (
                                        <select
                                            value={item.priority}
                                            onChange={(e) => handleInlineSave(item, 'priority', e.target.value)}
                                            onBlur={() => setEditingCell(null)}
                                            autoFocus
                                            className="text-xs p-1 border rounded bg-white shadow-sm focus:ring-2 focus:ring-[#486966]"
                                        >
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    ) : (
                                        <div onClick={() => setEditingCell({ itemId: item.id, column: 'priority' })} className="cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5">
                                            <PriorityBadge priority={item.priority} />
                                        </div>
                                    )}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap"><AssigneeAvatars assignees={item.assignees} /></td>
                                
                                {/* Epic - Editable */}
                                <td className="px-3 py-2 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                                    {editingCell?.itemId === item.id && editingCell?.column === 'epic' ? (
                                        <select
                                            value={item.epicId || ''}
                                            onChange={(e) => handleInlineSave(item, 'epic', e.target.value)}
                                            onBlur={() => setEditingCell(null)}
                                            autoFocus
                                            className="text-xs p-1 border rounded bg-white shadow-sm focus:ring-2 focus:ring-[#486966] w-full"
                                        >
                                            <option value="">{t('noEpic')}</option>
                                            {epics.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    ) : (
                                        <button onClick={() => setEditingCell({ itemId: item.id, column: 'epic' })} className="flex items-center gap-1.5 rounded-full px-2 py-0.5 hover:bg-slate-200 w-full text-start truncate max-w-[150px] text-slate-800 text-xs">
                                            {item.epicInfo ? <><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.epicInfo.color }}></div> <span className="truncate">{item.epicInfo.name}</span></> : <span className="text-slate-400 italic">{t('items_assignEpic')}</span>}
                                        </button>
                                    )}
                                </td>

                                {/* Sprint - Editable */}
                                <td className="px-3 py-2 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                                     {editingCell?.itemId === item.id && editingCell?.column === 'sprint' ? (
                                        <select
                                            value={item.sprintId || ''}
                                            onChange={(e) => handleInlineSave(item, 'sprint', e.target.value)}
                                            onBlur={() => setEditingCell(null)}
                                            autoFocus
                                            className="text-xs p-1 border rounded bg-white shadow-sm focus:ring-2 focus:ring-[#486966] w-full"
                                        >
                                            <option value="">{t('noSprint')}</option>
                                            {selectableSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        <button onClick={() => setEditingCell({ itemId: item.id, column: 'sprint' })} className="flex items-center gap-1.5 rounded-full px-2 py-0.5 hover:bg-slate-200 w-full text-start truncate max-w-[150px] text-slate-800 text-xs">
                                            {item.sprintId ? <><MilestoneIcon className="w-3 h-3 text-slate-500" /> <span className="truncate">{sprints.find(s=>s.id === item.sprintId)?.name || '...'}</span></> : <span className="text-slate-400 italic">{t('items_assignSprint')}</span>}
                                        </button>
                                    )}
                                </td>
                                
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatDate(item.updatedAt, locale)}</td>
                                
                                <td className="px-3 py-2 text-right relative">
                                    {onDeleteItem && checkPermission(item) && (
                                        <button 
                                            type="button"
                                            onClick={(e) => onDeleteClick(e, item)}
                                            onMouseDown={(e) => e.stopPropagation()} 
                                            className="p-1 text-gray-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity relative z-20"
                                            title={t('delete')}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredAndSortedItems.length === 0 && (
                    <div className="text-center py-10 text-slate-500">{t('items_table_empty')}</div>
                )}
            </div>
        </div>
    );
};