
// components/AppShell.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FilterBar } from './FilterBar';
import { KanbanBoard } from './KanbanBoard';
import { EpicsView } from './EpicsView';
import { ItemsView } from './ItemsView';
import { MembersView } from './MembersView';
import { EventsView } from './EventsView';
import { SprintsView } from './SprintsView';
import { ReportsDashboard } from './ReportsDashboard';
import { DeletedItemsView } from './DeletedItemsView';
import { SettingsPlaceholder } from './SettingsPlaceholder';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { WorkItem, Notification, Epic, FilterSet, SavedView, ViewVisibility, Team, Sprint, SprintState, Status, EpicStatus, CalendarEvent, WorkItemType } from '../types';
import { SaveViewModal } from './SaveViewModal';
import { ManageViewsModal } from './ManageViewsModal';
import { faker } from 'https://cdn.skypack.dev/@faker-js/faker';
import { ALL_USERS, WORK_ITEM_TYPES, ALL_TEAMS } from '../constants';
import { TodaysMeetingsBanner } from './TodaysMeetingsBanner';
import { useBoard } from '../context/BoardContext';
import { useLocale } from '../context/LocaleContext';
import { MeetingHUD } from './MeetingHUD';

interface AppShellProps {
    workItems: WorkItem[];
    onItemUpdate: (item: WorkItem) => void;
    epics: Epic[];
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    sprints: Sprint[];
    onSaveSprint: (sprint: Partial<Sprint>) => void;
    onSelectWorkItem: (workItem: WorkItem) => void;
    notifications: Notification[];
    onMarkAllNotificationsRead: () => void;
    onShowNotification: (notification: Notification) => void;
    onOpenSettings: () => void;
    onNewItem: (options?: { epicId?: string }) => void;
    onBatchCreateItems: (items: Partial<WorkItem>[]) => void;
    onNewEpic: () => void;
    onEditEpic: (epic: Epic) => void;
    onUpdateEpicStatus: (epicId: string, newStatus: EpicStatus) => void;
    onDeleteEpic: (epic: Epic) => void;
    onRestoreEpic: (epicId: string) => void;
    onDeleteSprint: (sprint: Sprint) => void;
    onRestoreSprint: (sprintId: string) => void;
    onEditWorkItem: (workItem: WorkItem) => void;
    // Updated signature for atomic moves
    onItemStatusChange: (itemId: string, newStatus: Status, targetSprintId?: string) => void;
    realtimeStatus: any;
    selectedSprint: Sprint | null | undefined;
    setSelectedSprintId: (sprintId: string | null) => void;
    availableActiveSprints: Sprint[];
    onLogout: () => void;
    events: CalendarEvent[];
    todaysEvents: CalendarEvent[];
    onViewEvent: (event: CalendarEvent) => void;
    onAddNewEvent: () => void;
    savedViews: SavedView[];
    setSavedViews: React.Dispatch<React.SetStateAction<SavedView[]>>;
    setEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
    onDeleteItem: (item: WorkItem) => void; // New explicit prop
}

export const AppShell: React.FC<AppShellProps> = (props) => {
    const { user } = useAuth();
    const { can, activeBoardMembers } = useBoard();
    const { t, locale } = useLocale();
    const { currentView, setCurrentView } = useNavigation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
    const [isManageViewsModalOpen, setIsManageViewsModalOpen] = useState(false);

    const [filterSet, setFilterSet] = useState<FilterSet>({ 
        searchQuery: '', 
        assigneeIds: [], 
        assigneeMatch: 'any', 
        typeIds: [], 
        teamIds: [], 
        priorities: [], 
        labels: [],
        onlyMyItems: false,
        onlyOverdue: false
    });
    const [groupBy, setGroupBy] = useState<'status' | 'epic'>('epic');
    const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(new Set());
    const [includeUnassignedEpicItems, setIncludeUnassignedEpicItems] = useState(false);
    
    const [dismissedMeetingIds, setDismissedMeetingIds] = useState<Set<string>>(new Set());

    const boardUsers = useMemo(() => activeBoardMembers.map(m => m.user), [activeBoardMembers]);

    const { selectedSprint, savedViews, setSavedViews, epics: enrichedEpics, onDeleteItem } = props;

    // Separation of Active and Deleted Items
    const activeWorkItems = useMemo(() => props.workItems.filter(i => !i.deletedAt), [props.workItems]);
    const deletedWorkItems = useMemo(() => props.workItems.filter(i => i.deletedAt), [props.workItems]);

    const handleRestoreItem = (item: WorkItem) => {
        props.onItemUpdate({ ...item, deletedAt: undefined });
    };

    const allAvailableLabels = useMemo(() => {
        const labels = new Set<string>();
        activeWorkItems.forEach(item => item.labels?.forEach(l => labels.add(l)));
        return Array.from(labels).sort();
    }, [activeWorkItems]);

    const activeSprintItems = useMemo(() => {
        if (!selectedSprint) return [];
        return activeWorkItems.filter(item => item.sprintId === selectedSprint.id);
    }, [activeWorkItems, selectedSprint]);

    const sprintAndEpicFilteredItems = useMemo(() => {
        if (currentView !== 'KANBAN' || !selectedSprint) {
            return [];
        }

        const itemsInSprint = activeWorkItems.filter(item => item.sprintId === selectedSprint.id);

        if (groupBy === 'status') {
          return itemsInSprint;
        }
    
        return itemsInSprint.filter(item => {
            if (item.epicId) {
                return true;
            }
            return includeUnassignedEpicItems;
        });
    }, [activeWorkItems, selectedSprint, currentView, includeUnassignedEpicItems, groupBy]);

    const filteredWorkItems = useMemo(() => {
        return sprintAndEpicFilteredItems.filter(item => {
            const searchMatch = !filterSet.searchQuery ||
                item.title.toLowerCase().includes(filterSet.searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(filterSet.searchQuery.toLowerCase()) ||
                (item.summary && item.summary.toLowerCase().includes(filterSet.searchQuery.toLowerCase()));
            
            const typeMatch = filterSet.typeIds.length === 0 || filterSet.typeIds.includes(item.type);

            const teamMatch = filterSet.teamIds.length === 0 || (item.teamId ? filterSet.teamIds.includes(item.teamId) : false);
            
            const priorityMatch = filterSet.priorities.length === 0 || filterSet.priorities.includes(item.priority);

            const labelMatch = filterSet.labels.length === 0 || (item.labels && item.labels.some(l => filterSet.labels.includes(l)));

            let assigneeMatch = true;
            if (filterSet.assigneeIds.length > 0) {
                const itemAssigneeIds = new Set(item.assignees?.map(a => a.id) || []);
                if (filterSet.assigneeMatch === 'any') {
                    assigneeMatch = filterSet.assigneeIds.some(id => itemAssigneeIds.has(id));
                } else { 
                    assigneeMatch = filterSet.assigneeIds.every(id => itemAssigneeIds.has(id));
                }
            }
            
            const myItemsMatch = !filterSet.onlyMyItems || (user && item.assignees.some(a => a.id === user.id));
            const overdueMatch = !filterSet.onlyOverdue || (item.dueDate && new Date(item.dueDate) < new Date() && item.status !== Status.DONE);

            return searchMatch && assigneeMatch && typeMatch && teamMatch && priorityMatch && labelMatch && myItemsMatch && overdueMatch;
        });
    }, [sprintAndEpicFilteredItems, filterSet, user]);
    
    const handleFilterChange = (newFilters: FilterSet) => {
        setFilterSet(newFilters);
    };

    const handleResetFilters = () => {
        setFilterSet({ 
            searchQuery: '', 
            assigneeIds: [], 
            assigneeMatch: 'any', 
            typeIds: [], 
            teamIds: [], 
            priorities: [], 
            labels: [],
            onlyMyItems: false,
            onlyOverdue: false
        });
        setIncludeUnassignedEpicItems(false);
    };

    const handleToggleEpic = useCallback((epicId: string) => {
        setCollapsedEpics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(epicId)) {
                newSet.delete(epicId);
            } else {
                newSet.add(epicId);
            }
            return newSet;
        });
    }, []);
    
    const handleSaveView = (name: string, visibility: ViewVisibility) => {
        if (!user) return;
        const newView: SavedView = {
            id: `view-${Date.now()}`,
            name,
            visibility,
            ownerId: user.id,
            filterSet: { ...filterSet },
            isDefault: false,
            isPinned: false,
        };
        setSavedViews(prev => [...prev, newView]);
        setIsSaveViewModalOpen(false);
    };

    const handleDeleteView = (viewId: string) => {
        setSavedViews(prev => prev.filter(v => v.id !== viewId));
    };

    const handlePinView = (viewId: string) => {
        setSavedViews(prev => prev.map(v => v.id === viewId ? { ...v, isPinned: !v.isPinned } : v));
    };
    
    const handleSetDefaultView = (viewId: string) => {
        setSavedViews(prev => prev.map(v => ({ ...v, isDefault: v.id === viewId })));
    };

    const handleRenameView = (viewId: string, newName: string) => {
        setSavedViews(prev => prev.map(v => v.id === viewId ? { ...v, name: newName } : v));
    };

    const handleDuplicateView = (viewToDuplicate: SavedView) => {
        if (!user) return;
        const newView: SavedView = {
            ...viewToDuplicate,
            id: `view-${Date.now()}`,
            name: `${viewToDuplicate.name} (Copy)`,
            ownerId: user.id,
            isDefault: false,
            isPinned: false,
        };
        setSavedViews(prev => [...prev, newView]);
    };

    const handleSelectView = (view: SavedView) => {
        setFilterSet(view.filterSet);
    };

    const pinnedViews = useMemo(() => savedViews.filter(v => v.isPinned && v.ownerId === user?.id), [savedViews, user]);
    
    const activeHUDMeetings = useMemo(() => 
        props.events.filter(e => !dismissedMeetingIds.has(e.id)), 
    [props.events, dismissedMeetingIds]);

    const renderContent = () => {
        switch (currentView) {
            case 'KANBAN':
                if (!can('sprint.manage') && props.availableActiveSprints.length === 0) {
                     return (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-8 bg-white/60 rounded-lg">
                                <h3 className="text-base font-semibold text-slate-800">{t('appshell_noActiveSprints_title')}</h3>
                                <p className="mt-2 text-sm text-slate-600">{t('appshell_noActiveSprints_body')}</p>
                            </div>
                        </div>
                    );
                }
                return (
                    <KanbanBoard
                        workItems={filteredWorkItems}
                        allItemsInSprint={activeSprintItems}
                        onItemMove={props.onItemStatusChange}
                        onSelectWorkItem={props.onSelectWorkItem}
                        groupBy={groupBy}
                        epics={enrichedEpics}
                        collapsedEpics={collapsedEpics}
                        onToggleEpic={handleToggleEpic}
                        activeSprint={selectedSprint}
                        filterSet={filterSet}
                        onNewItem={props.onNewItem}
                        onDeleteItem={onDeleteItem}
                    />
                );
            case 'ITEMS':
                return <ItemsView 
                    workItems={activeWorkItems} 
                    epics={enrichedEpics}
                    sprints={props.sprints}
                    onItemUpdate={props.onItemUpdate}
                    onSelectWorkItem={props.onSelectWorkItem}
                    onDeleteItem={onDeleteItem}
                />;
            case 'SPRINTS':
                return (
                    <SprintsView 
                        sprints={props.sprints}
                        workItems={activeWorkItems}
                        onSaveSprint={props.onSaveSprint}
                        onDeleteSprint={props.onDeleteSprint}
                        onRestoreSprint={props.onRestoreSprint}
                        epics={enrichedEpics}
                    />
                );
            case 'EPICS':
                 return (
                    <EpicsView
                        epics={enrichedEpics}
                        workItems={activeWorkItems}
                        onNewEpic={props.onNewEpic}
                        onEditEpic={props.onEditEpic}
                        onNewItem={props.onNewItem}
                        onBatchCreateItems={props.onBatchCreateItems}
                        onSelectWorkItem={props.onSelectWorkItem}
                        onUpdateStatus={props.onUpdateEpicStatus}
                        onDeleteEpic={props.onDeleteEpic}
                        onRestoreEpic={props.onRestoreEpic}
                        onDeleteItem={onDeleteItem}
                    />
                 );
            case 'EVENTS':
                return <EventsView 
                    workItems={activeWorkItems} 
                    teams={props.teams} 
                    events={props.events} 
                    onViewEvent={props.onViewEvent} 
                    onAddNewEvent={props.onAddNewEvent} 
                    setEvents={props.setEvents}
                    onEventDrop={props.onEventDrop}
                />;
            case 'REPORTS':
                return (
                    <ReportsDashboard 
                        workItems={activeWorkItems}
                        epics={enrichedEpics}
                        teams={props.teams}
                        users={boardUsers}
                        sprints={props.sprints}
                    />
                );
            case 'MEMBERS':
                return <MembersView teams={props.teams} setTeams={props.setTeams} />;
            case 'DELETED_ITEMS':
                return <DeletedItemsView deletedItems={deletedWorkItems} onRestoreItem={handleRestoreItem} />;
            case 'SETTINGS':
                 return <SettingsPlaceholder />;
            default:
                return null;
        }
    };

    return (
        <div className={`flex h-screen w-screen bg-slate-100 ${locale === 'fa-IR' ? 'font-vazir' : 'font-sans'}`} dir={locale === 'fa-IR' ? 'rtl' : 'ltr'} data-testid="app-shell">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                pinnedViews={pinnedViews}
                onSelectView={handleSelectView}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar
                    notifications={props.notifications}
                    onMarkAllNotificationsRead={props.onMarkAllNotificationsRead}
                    onShowNotification={props.onShowNotification}
                    onOpenSettings={props.onOpenSettings}
                    onLogout={props.onLogout}
                    realtimeStatus={props.realtimeStatus}
                    onNewItem={() => props.onNewItem()}
                    availableSprints={props.availableActiveSprints}
                    selectedSprint={selectedSprint}
                    onSelectSprint={props.setSelectedSprintId}
                />
                
                <MeetingHUD events={activeHUDMeetings} onDismiss={(id) => setDismissedMeetingIds(prev => new Set(prev).add(id))} />

                {currentView === 'KANBAN' && (
                    <FilterBar
                        filterSet={filterSet}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        onOpenSaveViewModal={() => setIsSaveViewModalOpen(true)}
                        onOpenManageViewsModal={() => setIsManageViewsModalOpen(true)}
                        teams={props.teams}
                        groupBy={groupBy}
                        onGroupByChange={setGroupBy}
                        activeSprint={selectedSprint}
                        includeUnassignedEpicItems={includeUnassignedEpicItems}
                        onIncludeUnassignedEpicItemsChange={setIncludeUnassignedEpicItems}
                        availableLabels={allAvailableLabels}
                    />
                )}

                <main className="flex-1 p-3 overflow-auto flex flex-col">
                    {currentView === 'KANBAN' && props.todaysEvents.length > 0 && (
                        <TodaysMeetingsBanner
                            events={props.todaysEvents}
                            onOpenEvent={props.onViewEvent}
                        />
                    )}
                    {renderContent()}
                </main>
            </div>
            
            <SaveViewModal
                isOpen={isSaveViewModalOpen}
                onClose={() => setIsSaveViewModalOpen(false)}
                onSave={handleSaveView}
                savedViews={savedViews}
                currentUser={user}
            />

            <ManageViewsModal
                isOpen={isManageViewsModalOpen}
                onClose={() => setIsManageViewsModalOpen(false)}
                savedViews={savedViews}
                onDelete={handleDeleteView}
                onPin={handlePinView}
                onSetDefault={handleSetDefaultView}
                onRename={handleRenameView}
                onDuplicate={handleDuplicateView}
                onSelectView={handleSelectView}
            />
        </div>
    );
};
