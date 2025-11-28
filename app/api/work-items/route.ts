import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const item = await request.json();
  const id = item.id || `PROJ-${Date.now()}`;
  const now = new Date().toISOString();

  try {
    await sql`
      INSERT INTO work_items (
        id, board_id, title, summary, description, type, status, priority, 
        sprint_id, epic_id, team_id, assignees, reporter, estimation_points, 
        effort_hours, due_date, labels, checklist, attachments, watchers, 
        stack, group_name, sprint_binding, done_in_sprint_id,
        created_at, updated_at, deleted_at
      )
      VALUES (
        ${id}, 
        ${item.boardId}, 
        ${item.title}, 
        ${item.summary || ''}, 
        ${item.description || ''}, 
        ${item.type}, 
        ${item.status}, 
        ${item.priority}, 
        ${item.sprintId || null}, 
        ${item.epicId || null},
        ${item.teamId || null}, 
        ${JSON.stringify(item.assignees || [])}::jsonb, 
        ${JSON.stringify(item.reporter)}::jsonb, 
        ${item.estimationPoints || 0}, 
        ${item.effortHours || 0}, 
        ${item.dueDate || null}, 
        ${JSON.stringify(item.labels || [])}::jsonb, 
        ${JSON.stringify(item.checklist || [])}::jsonb, 
        ${JSON.stringify(item.attachments || [])}::jsonb, 
        ${JSON.stringify(item.watchers || [])}::jsonb,
        ${item.stack || ''},
        ${item.group || ''},
        ${item.sprintBinding || null},
        ${item.doneInSprintId || null},
        ${item.createdAt || now}, 
        ${now}, 
        ${item.deletedAt || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        sprint_id = EXCLUDED.sprint_id,
        epic_id = EXCLUDED.epic_id,
        team_id = EXCLUDED.team_id,
        assignees = EXCLUDED.assignees,
        estimation_points = EXCLUDED.estimation_points,
        effort_hours = EXCLUDED.effort_hours,
        due_date = EXCLUDED.due_date,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at,
        checklist = EXCLUDED.checklist,
        labels = EXCLUDED.labels,
        attachments = EXCLUDED.attachments,
        stack = EXCLUDED.stack,
        sprint_binding = EXCLUDED.sprint_binding
    `;

    return NextResponse.json({ ...item, id, updatedAt: now });
  } catch (error) {
    console.error("Save Work Item Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}