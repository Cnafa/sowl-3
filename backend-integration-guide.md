# Backend Integration Guide

This document serves as the canonical reference for backend implementation, API contracts, and database schema for the ScrumOwl application.

## 1. Sprint Board

### 1.1 Domain Model
The Sprint Board represents the execution phase. It focuses on the **Active Sprint** of a specific **Board**.
- **Scope**: Contains `WorkItem`s assigned to the `Active` sprint.
- **Bug Pool**: A specific sidebar allowing users to drag `BUG` type items from the Backlog (no sprint) directly into the Active Sprint.

### 1.2 Database Schema
**Table: `work_items`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `board_id` | UUID | FK -> boards.id |
| `sprint_id` | UUID | FK -> sprints.id (Nullable) |
| `status` | VARCHAR | 'Backlog', 'To Do', 'In Progress', 'In Review', 'Done' |
| `type` | VARCHAR | 'Story', 'Task', 'Bug', 'Epic' |
| `order_index` | FLOAT | For Kanban column ordering (Lexorank recommended) |
| `priority` | VARCHAR | 'Urgent', 'High', 'Medium', 'Low' |

### 1.3 API Endpoints

#### `GET /api/boards/{boardId}/sprint-board`
**Purpose**: Fetch all data required to render the board view.
**Response**:
```json
{
  "activeSprint": { "id": "...", "name": "Sprint 1", "state": "ACTIVE", ... },
  "boardItems": [ ... ], // Items where sprint_id == activeSprint.id
  "bugPool": [ ... ],    // Items where type == BUG and status != DONE and sprint_id IS NULL
  "epics": [ ... ]       // Active epics for grouping
}
```

#### `PATCH /api/work-items/{id}/move`
**Purpose**: Handle drag-and-drop operations (Status change, Sprint assignment, Reordering).
**Request Body**:
```json
{
  "status": "In Progress",       // Optional: Target Column
  "sprintId": "sprint-123",      // Optional: Assign to sprint (if coming from pool)
  "orderIndex": 1500.5           // Optional: New position
}
```
**Business Logic**:
- If an item is moved **from** the Bug Pool **to** a board column, `sprintId` MUST be updated to the Active Sprint ID.
- If an item is moved to `DONE`, `completedAt` should be set.

### 1.4 Permissions
- **Viewer**: Read-only.
- **Member**: Can move items assigned to them.
- **Admin/Owner**: Can move any item.

---
