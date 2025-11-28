
import { CalendarEvent, WorkItem, User, Conflict, Team } from '../types';
import { ALL_USERS } from '../constants';

// --- In-memory store to simulate backend ---
let MOCK_EVENTS: CalendarEvent[] = [];

// --- Conflict Detection Logic (US-30) ---
const isOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
    const sA = new Date(startA).getTime();
    const eA = new Date(endA).getTime();
    const sB = new Date(startB).getTime();
    const eB = new Date(endB).getTime();
    
    // Overlap condition: StartA < EndB AND EndA > StartB
    return sA < eB && eA > sB;
};

const detectConflictsForEvent = (eventToCheck: CalendarEvent, allEvents: CalendarEvent[]): Conflict[] => {
    const conflictsMap = new Map<string, Conflict>();
    // Exclude the event itself from the check (crucial for editing)
    // Check both by ID and reference if possible
    const otherEvents = allEvents.filter(e => e.id !== eventToCheck.id);

    for (const attendee of eventToCheck.attendees) {
        const overlappingEvents = otherEvents.filter(otherEvent => {
            // Check if this person is also an attendee of the other event
            if (!otherEvent.attendees.some(a => a.id === attendee.id)) {
                return false;
            }
            return isOverlap(eventToCheck.start, eventToCheck.end, otherEvent.start, otherEvent.end);
        });

        if (overlappingEvents.length > 0) {
            if (!conflictsMap.has(attendee.id)) {
                conflictsMap.set(attendee.id, { user: attendee, overlappingEvents: [] });
            }
            conflictsMap.get(attendee.id)!.overlappingEvents.push(...overlappingEvents.map(e => ({
                id: e.id, title: e.title, start: e.start, end: e.end
            })));
        }
    }
    return Array.from(conflictsMap.values());
};

const updateAllConflicts = (allEvents: CalendarEvent[]): CalendarEvent[] => {
    return allEvents.map(event => {
        // Only calculate conflicts for internal events usually, but we check against all
        const conflicts = detectConflictsForEvent(event, allEvents);
        return { ...event, conflicts, hasConflict: conflicts.length > 0 };
    });
};

const rehydrateDates = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
    }));
};

export const getEvents = async (scope: 'my' | 'all', currentUser: User): Promise<CalendarEvent[]> => {
    await new Promise(res => setTimeout(res, 100));
    const events = rehydrateDates(MOCK_EVENTS);
    if (scope === 'my') {
        return events.filter(e =>
            e.createdBy.id === currentUser.id || e.attendees.some(a => a.id === currentUser.id)
        );
    }
    return events; // for 'all' scope (SMs)
};

// Simulated Google Calendar Fetch
export const getGoogleEvents = async (currentUser: User): Promise<CalendarEvent[]> => {
    await new Promise(res => setTimeout(res, 500)); // Simulate latency
    const now = new Date();
    // Generate some mock Google events for the next few days
    const googleEvents: CalendarEvent[] = [];
    
    // 1. Mock Event: Starting in 5 minutes (Upcoming)
    const upcomingStart = new Date(now.getTime() + 5 * 60000);
    const upcomingEnd = new Date(upcomingStart.getTime() + 30 * 60000);
    googleEvents.push({
        id: `google-evt-upcoming-${now.getTime()}`,
        title: `Daily Standup (Upcoming)`,
        start: upcomingStart,
        end: upcomingEnd,
        allDay: false,
        attendees: [currentUser],
        createdBy: currentUser,
        description: 'Synced from Google Calendar',
        source: 'GOOGLE_CALENDAR',
        onlineLink: 'https://meet.google.com/abc-defg-hij',
        linkedWorkItemIds: []
    });

    // 2. Mock Event: Started 15 minutes ago (In Progress), No Link
    const ongoingStart = new Date(now.getTime() - 15 * 60000);
    const ongoingEnd = new Date(ongoingStart.getTime() + 60 * 60000);
    googleEvents.push({
        id: `google-evt-ongoing-${now.getTime()}`,
        title: `Focus Time (In Progress)`,
        start: ongoingStart,
        end: ongoingEnd,
        allDay: false,
        attendees: [currentUser],
        createdBy: currentUser,
        description: 'Blocked time for deep work',
        source: 'GOOGLE_CALENDAR',
        // No online link
        linkedWorkItemIds: []
    });

    // 3. Regular future mock events
    for(let i=1; i<=3; i++) {
        const start = new Date(now);
        start.setDate(start.getDate() + i);
        start.setHours(10 + i, 0, 0, 0);
        const end = new Date(start);
        end.setHours(start.getHours() + 1);
        
        googleEvents.push({
            id: `google-evt-${now.getTime()}-${i}`,
            title: `Google Sync Mtg ${i}`,
            start,
            end,
            allDay: false,
            attendees: [currentUser],
            createdBy: currentUser,
            description: 'Synced from Google Calendar',
            source: 'GOOGLE_CALENDAR',
            onlineLink: 'https://meet.google.com/abc-defg-hij',
            linkedWorkItemIds: []
        });
    }
    return googleEvents;
};

const expandTeamsToAttendees = (attendees: User[], teamIds: string[] = [], allTeams: Team[]): User[] => {
    const teamMemberIds = teamIds.flatMap(tid => allTeams.find(t => t.id === tid)?.members || []);
    const attendeeIds = new Set([...(attendees || []).map(u => u.id), ...teamMemberIds]);
    return ALL_USERS.filter(u => attendeeIds.has(u.id));
};

export const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdBy' | 'hasConflict' | 'conflicts'>, createdBy: User, allTeams: Team[]): Promise<CalendarEvent> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(MOCK_EVENTS);

    const finalAttendees = expandTeamsToAttendees(eventData.attendees, eventData.teamIds, allTeams);

    const newEvent: CalendarEvent = {
        ...eventData,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        attendees: finalAttendees,
        createdBy,
        source: eventData.source || 'INTERNAL', // Default to internal
        linkedWorkItemIds: eventData.linkedWorkItemIds || []
    };
    events.push(newEvent);
    MOCK_EVENTS = updateAllConflicts(events);
    return MOCK_EVENTS.find(e => e.id === newEvent.id)!;
};

export const updateEvent = async (updatedEventData: CalendarEvent, allTeams: Team[]): Promise<CalendarEvent> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(MOCK_EVENTS);
    const finalAttendees = expandTeamsToAttendees(updatedEventData.attendees, updatedEventData.teamIds, allTeams);
    const finalEvent = { 
        ...updatedEventData, 
        attendees: finalAttendees,
        linkedWorkItemIds: updatedEventData.linkedWorkItemIds || []
    };

    events = events.map(e => e.id === finalEvent.id ? finalEvent : e);
    MOCK_EVENTS = updateAllConflicts(events);
    return MOCK_EVENTS.find(e => e.id === finalEvent.id)!;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(MOCK_EVENTS);
    events = events.filter(e => e.id !== eventId);
    MOCK_EVENTS = updateAllConflicts(events);
};

// UPDATED: Now takes existingEvents to check against Google/all visible events
export const getConflictsPreview = async (
    eventData: Partial<CalendarEvent>, 
    existingEvents: CalendarEvent[], 
    allTeams: Team[]
): Promise<Conflict[]> => {
    await new Promise(res => setTimeout(res, 50));
    if (!eventData.start || !eventData.end) return [];
    
    const rehydratedExisting = rehydrateDates(existingEvents);
    const finalAttendees = expandTeamsToAttendees(eventData.attendees || [], eventData.teamIds, allTeams);

    // Use existing ID if available to prevent self-conflict during edits
    const eventToTest: CalendarEvent = {
        id: eventData.id || 'temp-preview-id',
        title: eventData.title || '',
        start: new Date(eventData.start),
        end: new Date(eventData.end),
        attendees: finalAttendees,
        allDay: false,
        createdBy: ALL_USERS[0], // Dummy creator if not passed
        source: 'INTERNAL',
        linkedWorkItemIds: []
    };

    return detectConflictsForEvent(eventToTest, rehydratedExisting);
};
