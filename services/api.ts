// services/api.ts
import { WorkItem, Epic, Sprint, Board, BoardMember, User } from '../types';

export const fetchBoardsForUser = async (userId: string): Promise<{ boards: Board[], boardMembers: Record<string, BoardMember[]> }> => {
  const res = await fetch(`/api/boards?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
};

export const joinBoard = async (code: string, user: User): Promise<Board> => {
  const res = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, user })
  });
  if (!res.ok) throw new Error('Failed to join board');
  return res.json();
};

export const fetchAllDataForBoard = async (boardId: string) => {
  // Call the new API route
  const res = await fetch(`/api/board/${boardId}/data`, {
    cache: 'no-store' // Ensure fresh data on every load
  });
  if (!res.ok) throw new Error('Failed to fetch board data');
  const data = await res.json();
  
  // Return the data directly as it's already mapped by the API route
  return data;
};

export const saveWorkItem = async (item: Partial<WorkItem>): Promise<WorkItem> => {
  const res = await fetch('/api/work-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to save work item');
  return res.json();
};

export const saveEpic = async (epic: Partial<Epic>): Promise<Epic> => {
  const res = await fetch('/api/epics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(epic)
  });
  if (!res.ok) throw new Error('Failed to save epic');
  return res.json();
};

export const saveSprint = async (sprint: Partial<Sprint>, boardId: string, sprintCount: number): Promise<Sprint> => {
  const res = await fetch('/api/sprints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sprint, boardId })
  });
  if (!res.ok) throw new Error('Failed to save sprint');
  return res.json();
};