
import React, { useMemo, useState, useEffect } from 'react';
import { WorkItem, Status, Epic, Sprint, FilterSet, WorkItemType, EpicStatus } from '../types';
import { WorkItemCard } from './WorkItemCard';
import { KANBAN_COLUMNS, WORKFLOW_RULES } from '../constants';
import { useLocale } from '../context/LocaleContext';
import { useNavigation } from '../context/NavigationContext';
import { MountainIcon, ChevronRightIcon } from './icons';
import { BugPoolSection } from './BugPoolSection';
import { SprintHealthWidget } from './SprintHealthWidget';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';

interface KanbanBoardProps {
  workItems: WorkItem[];
  allItemsInSprint: WorkItem[];
  onSelectWorkItem: (workItem: WorkItem) => void;
  // Refactored: Single handler for atomic moves (Status + Sprint + potentially Order)
  onItemMove: (itemId: string, newStatus: Status, targetSprintId?: string) => void;
  groupBy: 'status' | 'epic';
  epics: Epic[];
  collapsedEpics: Set<string>;
  onToggleEpic: (epicId: string) => void;
  activeSprint: Sprint | null;
  filterSet: FilterSet;
  onNewItem: (options?: { epicId?: string; }) => void;
  onDeleteItem?: (item: WorkItem) => void;
}

const EpicGroupHeader: React.FC<{ epic?: Epic; onToggle: () => void; isCollapsed: boolean, itemsCount: number }> = ({ epic, onToggle, isCollapsed, itemsCount }) => {
    const { t } = useLocale();
    return (
        <button 
            onClick={onToggle} 
            className="w-full flex items-center gap-3 text-start p-2 border-b hover:bg-slate-100"
        >
             <ChevronRightIcon className={`h-4 w-4 transition-transform text-slate-500 rtl:scale-x-[-1] ${isCollapsed ? '' : 'rotate-90'}`} />
            {epic ? <div className="w-2 h-5 rounded-full" style={{backgroundColor: epic.color}}></div> : <MountainIcon className="w-5 h-5 text-slate-500" />}
            <span className="font-semibold text-slate-800 text-sm">{epic ? epic.name : t('kanban_itemsWithoutEpic')}</span>
            <span className="text-xs font-normal text-slate-500">({itemsCount})</span>
        </button>
    );
};


export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    workItems,
    allItemsInSprint,
    onSelectWorkItem,
    onItemMove, 
    groupBy, 
    epics, 
    collapsedEpics, 
    onToggleEpic, 
    activeSprint,
    filterSet,
    onNewItem,
    onDeleteItem
}) => {
  const { t } = useLocale();
  const { setCurrentView } = useNavigation();
  const { can } = useBoard();
  const { user } = useAuth();

  // --- Drag & Drop State ---
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  const [isBugPoolCollapsed, setIsBugPoolCollapsed] = useState(() => {
    try {
        const storedValue = localStorage.getItem('bugPoolCollapsed');
        return storedValue ? JSON.parse(storedValue) : true;
    } catch {
        return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('bugPoolCollapsed', JSON.stringify(isBugPoolCollapsed));
  }, [isBugPoolCollapsed]);

  const bugItems = useMemo(() =>
    workItems.filter(item => item.type === WorkItemType.BUG_MINOR || item.type === WorkItemType.BUG_URGENT),
  [workItems]);

  const showBugPool = useMemo(() => {
    if (filterSet.typeIds.length > 0 && !filterSet.typeIds.includes(WorkItemType.BUG_MINOR) && !filterSet.typeIds.includes(WorkItemType.BUG_URGENT)) {
        return false;
    }
    if (bugItems.length === 0) {
        return false;
    }
    return true;
  }, [filterSet.typeIds, bugItems.length]);

  const itemsByEpic = useMemo(() => {
        const grouped: Record<string, WorkItem[]> = { 'no-epic': [] };
        epics.forEach(e => grouped[e.id] = []);
        
        workItems.forEach(item => {
            if (item.epicId && grouped.hasOwnProperty(item.epicId)) {
                grouped[item.epicId].push(item);
            } else {
                grouped['no-epic'].push(item);
            }
        });
        return grouped;
    }, [workItems, epics]);

    const epicsWithItems = useMemo(() => {
        return epics
            .filter(e => itemsByEpic[e.id]?.length > 0)
            .sort((a,b) => b.iceScore - a.iceScore);
    }, [epics, itemsByEpic]);

  // Helper to check delete permission per item
  const checkDeletePermission = (item: WorkItem) => {
      if (!onDeleteItem) return false;
      return can('item.delete') || (can('item.edit.own') && item.reporter.id === user?.id);
  };

  if (!activeSprint) {
        return (
             <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 bg-white/60 rounded-lg">
                    <h3 className="text-base font-semibold text-slate-800">{t('no_active_sprint_title')}</h3>
                    <p className="mt-2 text-sm text-slate-600">{t('kanban_noActiveSprint_selectPrompt')}</p>
                    <button onClick={() => setCurrentView('SPRINTS')} className="mt-2 text-sm text-primary hover:underline">
                        {t('no_active_sprint_cta')}
                    </button>
                </div>
            </div>
        );
    }
    
    if (workItems.length === 0 && allItemsInSprint.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 bg-white/60 rounded-lg">
                    <h3 className="text-base font-semibold text-slate-800">{t('kanban_emptySprint_title')}</h3>
                    <p className="mt-2 text-sm text-slate-600">{t('kanban_emptySprint_body')}</p>
                    <button onClick={() => onNewItem()} className="mt-4 py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                        {t('newItem')}
                    </button>
                </div>
            </div>
        );
    }

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('workItemId', id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        setDraggedItemId(id);
    }, 0);
  };

  const onDragEnd = () => {
      setDraggedItemId(null);
      setActiveDropZone(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragEnterZone = (e: React.DragEvent, zoneId: string) => {
      e.preventDefault();
      if (draggedItemId && activeDropZone !== zoneId) {
          setActiveDropZone(zoneId);
      }
  };

  const onDrop = (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    e.stopPropagation();
    const workItemId = e.dataTransfer.getData('workItemId');
    const item = workItems.find((i) => i.id === workItemId);
    
    setDraggedItemId(null);
    setActiveDropZone(null);

    if (!item) return;

    // Backend Integrity Check:
    // If dropping onto a board column, the item MUST belong to the active sprint.
    // If it was in backlog (no sprintId or different sprintId), we implicitly assign it to activeSprint.
    const targetSprintId = activeSprint?.id;

    const allowedTransitions = WORKFLOW_RULES[item.status];
    if (allowedTransitions && allowedTransitions.includes(newStatus)) {
        onItemMove(workItemId, newStatus, targetSprintId);
    } else if (item.status === newStatus) {
        // Same status drop - just ensure sprint binding if needed
        if (item.sprintId !== targetSprintId) {
             onItemMove(workItemId, newStatus, targetSprintId);
        }
    } else {
        console.warn("Invalid status transition attempted.");
    }
  };
  
  const getLocalizedColumnTitle = (status: Status) => {
      const key = `status_${status.replace(' ', '_').toUpperCase()}`;
      return t(key as any) || status;
  };
  
  const renderColumns = (items: WorkItem[], zonePrefix: string) => {
      return (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {KANBAN_COLUMNS.map((column) => {
                const zoneId = `${zonePrefix}_${column.status}`;
                const isActiveZone = activeDropZone === zoneId;
                // Backend integration note: We should sort items by item.orderIndex here
                const sortedItems = [...items].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                
                return (
                    <div
                        key={column.status}
                        className={`
                            rounded-lg p-2 flex flex-col transition-all duration-200 border-2
                            ${isActiveZone 
                                ? 'bg-blue-50 border-dashed border-blue-300 shadow-inner' 
                                : 'bg-slate-100/70 border-transparent'
                            }
                        `}
                        onDragOver={onDragOver}
                        onDragEnter={(e) => onDragEnterZone(e, zoneId)}
                        onDrop={(e) => onDrop(e, column.status)}
                        onDragEnd={onDragEnd}
                    >
                        <h2 className="text-base font-semibold text-slate-700 mb-3 px-1">
                            {getLocalizedColumnTitle(column.status)} 
                            <span className="text-sm font-normal text-slate-500 ml-1">
                                ({items.filter(item => item.status === column.status).length})
                            </span>
                        </h2>
                        <div className="flex-1 space-y-2 overflow-y-auto h-full pr-1 min-h-[100px]">
                            {sortedItems
                            .filter((item) => item.status === column.status)
                            .map((item) => (
                                <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)} onDragEnd={onDragEnd}>
                                    <WorkItemCard 
                                        workItem={item} 
                                        onSelect={() => onSelectWorkItem(item)}
                                        isDragging={draggedItemId === item.id}
                                        onDelete={checkDeletePermission(item) ? onDeleteItem : undefined}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      );
  };

  if (groupBy === 'status') {
    return (
        <div className="flex-1 flex flex-col gap-3">
            <SprintHealthWidget sprint={activeSprint} workItems={allItemsInSprint} onClick={() => setCurrentView('REPORTS')} />
            
            {showBugPool && (
                 <BugPoolSection
                    isCollapsed={isBugPoolCollapsed}
                    onToggle={() => setIsBugPoolCollapsed(prev => !prev)}
                    bugItems={bugItems}
                    onSelectWorkItem={onSelectWorkItem}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    onDeleteItem={onDeleteItem}
                />
            )}
            
            {renderColumns(workItems, 'STATUS_GROUP')}
        </div>
    );
  }

  const noEpicItems = itemsByEpic['no-epic'];

  return (
    <div className="flex-1 flex flex-col gap-3">
        <SprintHealthWidget sprint={activeSprint} workItems={allItemsInSprint} onClick={() => setCurrentView('REPORTS')} />

        {showBugPool && (
            <BugPoolSection
                isCollapsed={isBugPoolCollapsed}
                onToggle={() => setIsBugPoolCollapsed(prev => !prev)}
                bugItems={bugItems}
                onSelectWorkItem={onSelectWorkItem}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onDeleteItem={onDeleteItem}
            />
        )}
        {epicsWithItems.map(epic => {
            const isCollapsed = collapsedEpics.has(epic.id);
            return (
                <div key={epic.id} className="bg-white/80 rounded-lg">
                    <EpicGroupHeader epic={epic} onToggle={() => onToggleEpic(epic.id)} isCollapsed={isCollapsed} itemsCount={itemsByEpic[epic.id].length} />
                    {!isCollapsed && (
                        <div className="p-2">
                            {renderColumns(itemsByEpic[epic.id], `EPIC_${epic.id}`)}
                        </div>
                    )}
                </div>
            )
        })}
        {noEpicItems.length > 0 && (
            <div className="bg-white/80 rounded-lg">
                <EpicGroupHeader onToggle={() => onToggleEpic('no-epic')} isCollapsed={collapsedEpics.has('no-epic')} itemsCount={noEpicItems.length} />
                {!collapsedEpics.has('no-epic') && (
                     <div className="p-2">
                        {renderColumns(noEpicItems, 'EPIC_NONE')}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
