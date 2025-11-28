
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from './components/AppShell';
import LoginScreen from './components/LoginScreen';
import LandingPage from './components/LandingPage';
import OnboardingScreen from './components/OnboardingScreen';
import CreateBoardModal from './components/CreateBoardModal';
import JoinBoardModal from './components/JoinBoardModal';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import { UserSettingsModal } from './components/UserSettingsModal';
import { WorkItem, Epic, Team, Sprint, Notification, SavedView, CalendarEvent, EpicStatus, SprintState, Status, WorkItemType, Priority } from './types';
import { useAuth } from './context/AuthContext';
import { useBoard } from './context/BoardContext';
import { useSettings } from './context/SettingsContext';
import { useIdleReminder } from './hooks/useIdleReminder';
import { useSessionIdleTimer } from './hooks/useSessionIdleTimer';
import { useRealtime } from './hooks/useRealtime';
import * as api from './services/api';
import * as calendarService from './services/calendarService';
import { ToastManager } from './components/ToastManager';
import { EventEditorModal } from './components/EventEditorModal';
import { EventViewModal } from './components/EventViewModal';
import { WorkItemDetailModal } from './components/WorkItemDetailModal';
import { WorkItemEditor } from './components/WorkItemEditor';
import { EpicEditor } from './components/EpicEditor';
import { DeleteEpicModal } from './components/DeleteEpicModal';
import { DeleteSprintModal } from './components/DeleteSprintModal';
import { ReAuthModal } from './components/ReAuthModal';
import { useLocale } from './context/LocaleContext';
import { DonationBar } from './components/DonationBar';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

const App: React.FC = () => {
    const { isAuthenticated, user, logout, lastAuthTime, updateLastAuthTime } = useAuth();
    const { activeBoard, createBoard, activeBoardMembers, setActiveBoard, joinBoard } = useBoard();
    const { settings } = useSettings();
    const { t } = useLocale();

    // -- Data State --
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    
    // -- UI State --
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateBoard, setShowCreateBoard] = useState(false);
    const [showJoinBoard, setShowJoinBoard] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    
    // -- Modals & Selection State --
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
    const [editingWorkItem, setEditingWorkItem] = useState<Partial<WorkItem> | null>(null);
    const [highlightSection, setHighlightSection] = useState<string | undefined>(undefined);
    const [itemToDelete, setItemToDelete] = useState<WorkItem | null>(null);
    
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
    
    const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
    
    const [toasts, setToasts] = useState<any[]>([]);
    const [showReAuth, setShowReAuth] = useState(false);

    // -- Initialization --
    useEffect(() => {
        if (isAuthenticated && activeBoard) {
            loadBoardData(activeBoard.id);
        }
    }, [isAuthenticated, activeBoard]);

    const loadBoardData = async (boardId: string) => {
        setIsLoading(true);
        try {
            const data = await api.fetchAllDataForBoard(boardId);
            setWorkItems(data.workItems);
            setEpics(data.epics);
            setSprints(data.sprints);
            setTeams(data.teams);
            setNotifications(data.notifications);
            setSavedViews(data.savedViews);
            
            const activeSprint = data.sprints.find(s => s.state === SprintState.ACTIVE);
            if (activeSprint) setSelectedSprintId(activeSprint.id);
            else if (data.sprints.length > 0) setSelectedSprintId(data.sprints[0].id);

            if (user) {
                const internalEvents = await calendarService.getEvents('all', user);
                const googleEvents = await calendarService.getGoogleEvents(user);
                setEvents([...internalEvents, ...googleEvents]);
            }
        } catch (e) {
            console.error("Failed to load board data", e);
        } finally {
            setIsLoading(false);
        }
    };

    // -- Realtime --
    const handleRealtimeUpdate = (event: any) => {
        if (event.type === 'item.updated') {
            addToast({
                id: Date.now().toString(),
                title: `Item Updated: ${event.item.title}`,
                changes: [`${event.change.field} changed`],
                itemId: event.item.id
            });
        }
    };
    const { connectionStatus } = useRealtime(settings.enableRealtime, workItems, user, handleRealtimeUpdate);

    // -- Event Handlers --

    const handleSaveEvent = async (eventData: Partial<CalendarEvent> & { recurrence?: { type: 'DAILY' | 'WEEKLY' | 'CUSTOM', interval: number, endDate: string } }) => {
        if (!user) return;
        if (eventData.id) {
            const eventId = eventData.id as string;
            const originalEvent = events.find(e => e.id === eventId);
            if (originalEvent) {
                const updated = await calendarService.updateEvent({ ...originalEvent, ...eventData } as CalendarEvent, teams);
                setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
            }
        } else {
            const baseEvent = await calendarService.createEvent(eventData as any, user, teams);
            const createdEvents = [baseEvent];

            if (eventData.recurrence && eventData.start && eventData.end) {
                const start = new Date(eventData.start);
                const end = new Date(eventData.end);
                const recurrenceEndDate = new Date(eventData.recurrence.endDate);
                recurrenceEndDate.setHours(23, 59, 59, 999);

                const duration = end.getTime() - start.getTime();
                let daysToAdd = 0;
                if (eventData.recurrence.type === 'DAILY') daysToAdd = 1;
                else if (eventData.recurrence.type === 'WEEKLY') daysToAdd = 7;
                else if (eventData.recurrence.type === 'CUSTOM') daysToAdd = eventData.recurrence.interval;

                let currentStart = new Date(start);
                currentStart.setDate(currentStart.getDate() + daysToAdd);

                while (currentStart <= recurrenceEndDate) {
                    const nextStart = new Date(currentStart);
                    const nextEnd = new Date(nextStart.getTime() + duration);

                    const recurringEventData = {
                        ...eventData,
                        start: nextStart,
                        end: nextEnd,
                        source: 'INTERNAL' as const
                    };
                    
                    const newEvent = await calendarService.createEvent(recurringEventData as any, user, teams);
                    createdEvents.push(newEvent);
                    currentStart.setDate(currentStart.getDate() + daysToAdd);
                }
                
                if (createdEvents.length > 1) {
                    addToast({
                        id: `recur-${Date.now()}`,
                        title: 'Recurring Events Created',
                        changes: [`Created ${createdEvents.length} instances.`],
                        itemId: ''
                    });
                }
            }

            setEvents(prev => [...prev, ...createdEvents]);
        }
        setEditingEvent(null);
    };

    const handleEventDrop = async (event: CalendarEvent, newStart: Date) => {
        if (!user) return;
        const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
        const newEnd = new Date(newStart.getTime() + duration);
        
        // Check conflicts
        const conflicts = await calendarService.getConflictsPreview({ ...event, start: newStart, end: newEnd }, events, teams);
        if (conflicts.length > 0) {
            addToast({ id: Date.now().toString(), title: "Conflict Detected", changes: ["Could not move event due to conflicts."] });
            return;
        }

        const updated = await calendarService.updateEvent({ ...event, start: newStart, end: newEnd }, teams);
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        
        addToast({ 
            id: Date.now().toString(), 
            title: "Event Moved", 
            changes: [`Rescheduled to ${newStart.toLocaleDateString()}`],
            undoAction: async () => {
                 const original = await calendarService.updateEvent(event, teams);
                 setEvents(prev => prev.map(e => e.id === original.id ? original : e));
            }
        });
    };

    const handleWorkItemUpdate = async (item: Partial<WorkItem>) => {
        const saved = await api.saveWorkItem(item);
        setWorkItems(prev => {
            const exists = prev.find(i => i.id === saved.id);
            if (exists) return prev.map(i => i.id === saved.id ? saved : i);
            return [saved, ...prev];
        });
        
        if (editingWorkItem) setEditingWorkItem(null);
        if (selectedWorkItem?.id === saved.id) setSelectedWorkItem(saved);
    };

    // Triggered when user clicks "Delete" icon on UI
    const onRequestDeleteWorkItem = (item: WorkItem) => {
        setItemToDelete(item);
    };

    // Triggered when user confirms in the Modal
    const executeDeleteWorkItem = async () => {
        if (!itemToDelete) return;
        const item = itemToDelete;
        setItemToDelete(null); // Close modal

        const deletedTimestamp = new Date().toISOString();
        const deletedItem = { ...item, deletedAt: deletedTimestamp };
        
        // Optimistically update the list
        setWorkItems(prev => prev.map(i => i.id === item.id ? deletedItem : i));
        
        // If the item was open in modal, close it
        if (selectedWorkItem?.id === item.id) {
            setSelectedWorkItem(null);
        }

        try {
            await api.saveWorkItem(deletedItem);
            addToast({
                id: `del-${item.id}`,
                title: t('deletedItems_view'),
                changes: [t('item_moved_trash')],
                undoAction: async () => {
                    const restored = { ...item, deletedAt: undefined };
                    setWorkItems(prev => prev.map(i => i.id === item.id ? restored : i));
                    await api.saveWorkItem(restored);
                }
            });
        } catch (e) {
            console.error("Delete failed", e);
            // Revert on failure
            setWorkItems(prev => prev.map(i => i.id === item.id ? item : i));
            alert("Failed to delete item.");
        }
    };

    const handleBatchCreateItems = async (items: Partial<WorkItem>[]) => {
        const sprintToAssign = selectedSprintId || undefined;

        const createdItems: WorkItem[] = [];
        for (const item of items) {
            const saved = await api.saveWorkItem({
                ...item,
                status: Status.TODO,
                priority: Priority.MEDIUM,
                boardId: activeBoard?.id || '',
                sprintId: sprintToAssign,
                sprintBinding: sprintToAssign ? 'manual' : undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                assignees: [],
                reporter: user!,
                labels: [],
                checklist: [],
                attachments: [],
                watchers: [user!.id]
            });
            createdItems.push(saved);
        }
        
        setWorkItems(prev => [...createdItems, ...prev]);
        addToast({
            id: `batch-${Date.now()}`,
            title: 'Items Created',
            changes: [`Created ${createdItems.length} items and added to ${sprintToAssign ? 'Active Sprint' : 'Backlog'}.`],
            itemId: ''
        });
    };

    // -- Idle Timers --
    useIdleReminder(
        !!editingWorkItem, 
        () => { if(editingWorkItem) handleWorkItemUpdate(editingWorkItem); }, 
        settings.enableFinishDraftReminder 
    );

    useSessionIdleTimer(
        isAuthenticated,
        () => addToast({ id: 'session-warn', title: t('session_warning_title'), changes: [t('session_warning_body')], itemId: '' }),
        logout
    );

    // -- Toast Logic --
    const addToast = (toast: any) => {
        setToasts(prev => [...prev, toast]);
    };
    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleNewItem = (options?: { epicId?: string }) => {
        setEditingWorkItem({
            type: WorkItemType.STORY,
            status: Status.BACKLOG,
            priority: 2 as any, // Medium
            epicId: options?.epicId,
            description: '',
            checklist: [],
            labels: [],
            attachments: [],
            assignees: []
        });
    };

    const handleEpicUpdate = async (epic: Partial<Epic>) => {
        const saved = await api.saveEpic(epic);
        setEpics(prev => {
            const exists = prev.find(e => e.id === saved.id);
            if (exists) return prev.map(e => e.id === saved.id ? saved : e);
            return [...prev, saved];
        });
    };

    // -- Render Logic --

    if (!isAuthenticated) {
        if (showLogin) {
            return <LoginScreen />;
        }
        return <LandingPage onStart={() => setShowLogin(true)} />;
    }

    if (!activeBoard) {
        if (showCreateBoard) {
            return <CreateBoardModal 
                onClose={() => setShowCreateBoard(false)} 
                onCreate={(name, icon) => { 
                    const newBoard = createBoard(name, icon);
                    setActiveBoard(newBoard.id);
                    setShowCreateBoard(false); 
                }} 
            />;
        }
        if (showJoinBoard) {
            return <JoinBoardModal 
                onClose={() => setShowJoinBoard(false)} 
                onJoinRequest={async (code) => { 
                    try {
                        setIsLoading(true);
                        await joinBoard(code);
                        setShowJoinBoard(false);
                    } catch(e) {
                        console.error(e);
                        alert("Failed to join board");
                    } finally {
                        setIsLoading(false);
                    }
                }} 
            />;
        }
        if (pendingApproval) {
            return <PendingApprovalScreen />;
        }
        return <OnboardingScreen onShowCreate={() => setShowCreateBoard(true)} onShowJoin={() => setShowJoinBoard(true)} />;
    }

    const selectedSprint = sprints.find(s => s.id === selectedSprintId);
    const availableActiveSprints = sprints.filter(s => s.state !== SprintState.DELETED);
    
    const todaysEvents = events.filter(e => {
        const now = new Date();
        const start = new Date(e.start);
        return start.toDateString() === now.toDateString() && start > now;
    });

    return (
        <>
            <AppShell 
                workItems={workItems}
                onItemUpdate={handleWorkItemUpdate}
                epics={epics}
                teams={teams}
                setTeams={setTeams}
                sprints={sprints}
                onSaveSprint={(s) => {
                    const now = new Date();
                    let newState = s.state;
                    if (s.startAt && s.endAt && s.state !== SprintState.CLOSED && s.state !== SprintState.DELETED) {
                        const start = new Date(s.startAt);
                        const end = new Date(s.endAt);
                        if (start <= now && end > now) {
                            newState = SprintState.ACTIVE;
                        }
                    }
                    const sprintToSave = { ...s, state: newState };
                    return api.saveSprint(sprintToSave, activeBoard.id, sprints.length).then(saved => setSprints(prev => [...prev.filter(existing => existing.id !== saved.id), saved]));
                }}
                onSelectWorkItem={setSelectedWorkItem}
                notifications={notifications}
                onMarkAllNotificationsRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))}
                onShowNotification={(n) => { if(n.workItem) { setSelectedWorkItem(workItems.find(w => w.id === n.workItem.id) || null); setHighlightSection(n.target?.section); } }}
                onOpenSettings={() => setShowSettings(true)}
                onNewItem={handleNewItem}
                onBatchCreateItems={handleBatchCreateItems}
                onNewEpic={() => { /* Handled in EpicsView */ }}
                onEditEpic={handleEpicUpdate}
                onUpdateEpicStatus={(id, status) => {
                    const epic = epics.find(e => e.id === id);
                    if (epic) handleEpicUpdate({ ...epic, status });
                }}
                onDeleteEpic={(epic) => {
                    handleEpicUpdate({ ...epic, status: EpicStatus.DELETED, deletedAt: new Date().toISOString() });
                    addToast({ id: `del-epic-${epic.id}`, title: `Deleted Epic: ${epic.name}`, changes: [], undoAction: () => handleEpicUpdate({ ...epic, status: EpicStatus.ACTIVE }) });
                }}
                onRestoreEpic={(id) => {
                    const epic = epics.find(e => e.id === id);
                    if (epic) handleEpicUpdate({ ...epic, status: EpicStatus.ACTIVE, deletedAt: undefined });
                }}
                onDeleteSprint={(sprint) => {
                    const updated = { ...sprint, state: SprintState.DELETED, deletedAt: new Date().toISOString() };
                    api.saveSprint(updated, activeBoard.id, 0).then(() => setSprints(prev => prev.map(s => s.id === sprint.id ? updated : s)));
                }}
                onRestoreSprint={(id) => {
                    const sprint = sprints.find(s => s.id === id);
                    if (sprint) {
                        const updated = { ...sprint, state: SprintState.PLANNED, deletedAt: undefined };
                        api.saveSprint(updated, activeBoard.id, 0).then(() => setSprints(prev => prev.map(s => s.id === id ? updated : s)));
                    }
                }}
                onEditWorkItem={setEditingWorkItem}
                onItemStatusChange={(id, status) => {
                    const item = workItems.find(i => i.id === id);
                    if (item) handleWorkItemUpdate({ ...item, status });
                }}
                onDeleteItem={onRequestDeleteWorkItem}
                realtimeStatus={connectionStatus}
                selectedSprint={selectedSprint}
                setSelectedSprintId={setSelectedSprintId}
                availableActiveSprints={availableActiveSprints}
                onLogout={logout}
                events={events}
                todaysEvents={todaysEvents}
                onViewEvent={setSelectedEvent}
                onAddNewEvent={() => setEditingEvent({})}
                savedViews={savedViews}
                setSavedViews={setSavedViews}
                setEvents={setEvents}
                onEventDrop={handleEventDrop}
            />

            {selectedWorkItem && (
                <WorkItemDetailModal 
                    workItem={selectedWorkItem} 
                    sprints={sprints}
                    onClose={() => { setSelectedWorkItem(null); setHighlightSection(undefined); }}
                    onEdit={(item) => { setSelectedWorkItem(null); setEditingWorkItem(item); }}
                    onItemUpdate={handleWorkItemUpdate}
                    onDelete={onRequestDeleteWorkItem}
                    onNewComment={() => { /* handled via ActivityFeed */ }}
                    highlightSection={highlightSection}
                />
            )}

            {editingWorkItem && (
                <WorkItemEditor 
                    workItem={editingWorkItem} 
                    epics={epics} 
                    teams={teams} 
                    sprints={sprints}
                    onSave={handleWorkItemUpdate} 
                    onCancel={() => setEditingWorkItem(null)}
                    isNew={!editingWorkItem.id}
                    boardUsers={activeBoardMembers.map(m => m.user)}
                />
            )}

            {editingEvent && (
                <EventEditorModal 
                    event={editingEvent} 
                    workItems={workItems} 
                    epics={epics}
                    teams={teams} 
                    allEvents={events}
                    onSave={handleSaveEvent} 
                    onClose={() => setEditingEvent(null)} 
                />
            )}

            {selectedEvent && (
                <EventViewModal 
                    event={selectedEvent} 
                    workItems={workItems} 
                    epics={epics}
                    onClose={() => setSelectedEvent(null)} 
                    onEdit={(e) => { setSelectedEvent(null); setEditingEvent(e); }} 
                    onOpenWorkItem={(id) => { 
                        setSelectedEvent(null); 
                        const wi = workItems.find(w => w.id === id);
                        if(wi) {
                            setSelectedWorkItem(wi);
                        }
                    }}
                />
            )}

            {showSettings && <UserSettingsModal onClose={() => setShowSettings(false)} />}
            {showReAuth && <ReAuthModal onClose={() => setShowReAuth(false)} onSuccess={() => { updateLastAuthTime(); setShowReAuth(false); }} />}
            
            <ToastManager 
                toasts={toasts} 
                onDismiss={dismissToast} 
                onOpen={(id, section) => { setSelectedWorkItem(workItems.find(w => w.id === id) || null); setHighlightSection(section); }} 
            />
            
            <DonationBar />

            {itemToDelete && (
                <DeleteConfirmationModal 
                    title={itemToDelete.title} 
                    onClose={() => setItemToDelete(null)} 
                    onConfirm={executeDeleteWorkItem} 
                />
            )}
        </>
    );
};

export default App;
