import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const sprint = await request.json();
  const id = sprint.id || `sprint-${Date.now()}`;

  try {
    await sql`
      INSERT INTO sprints (
        id, board_id, name, goal, state, start_at, end_at, epic_ids, deleted_at
      )
      VALUES (
        ${id}, 
        ${sprint.boardId}, 
        ${sprint.name}, 
        ${sprint.goal || ''}, 
        ${sprint.state}, 
        ${sprint.startAt}, 
        ${sprint.endAt}, 
        ${JSON.stringify(sprint.epicIds || [])}::jsonb,
        ${sprint.deletedAt || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        goal = EXCLUDED.goal,
        state = EXCLUDED.state,
        start_at = EXCLUDED.start_at,
        end_at = EXCLUDED.end_at,
        epic_ids = EXCLUDED.epic_ids,
        deleted_at = EXCLUDED.deleted_at
    `;

    return NextResponse.json({ ...sprint, id });
  } catch (error) {
    console.error("Save Sprint Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}