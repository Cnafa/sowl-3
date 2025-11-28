import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const boardId = params.id;

  try {
    // Fetch all data in parallel
    const [
        workItemsRes, 
        epicsRes, 
        sprintsRes, 
        teamsRes
    ] = await Promise.all([
        sql`SELECT * FROM work_items WHERE board_id = ${boardId} ORDER BY updated_at DESC`,
        sql`SELECT * FROM epics WHERE board_id = ${boardId} ORDER BY created_at DESC`,
        sql`SELECT * FROM sprints WHERE board_id = ${boardId} ORDER BY start_at ASC`,
        sql`SELECT * FROM teams` // Teams are currently global, or could be filtered by board if schema changes
    ]);

    // Map DB columns (snake_case) to Frontend properties (camelCase)
    const workItems = workItemsRes.rows.map(row => ({
        id: row.id,
        boardId: row.board_id,
        title: row.title,
        summary: row.summary,
        description: row.description,
        type: row.type,
        status: row.status,
        priority: row.priority,
        sprintId: row.sprint_id,
        epicId: row.epic_id,
        teamId: row.team_id,
        assignees: row.assignees || [],
        reporter: row.reporter,
        estimationPoints: row.estimation_points,
        effortHours: row.effort_hours,
        dueDate: row.due_date,
        labels: row.labels || [],
        checklist: row.checklist || [],
        attachments: row.attachments || [],
        watchers: row.watchers || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        sprintBinding: row.sprint_binding,
        doneInSprintId: row.done_in_sprint_id,
        stack: row.stack,
        group: row.group_name
    }));

    const epics = epicsRes.rows.map(row => ({
        id: row.id,
        boardId: row.board_id,
        name: row.name,
        description: row.description,
        aiSummary: row.ai_summary,
        status: row.status,
        color: row.color,
        icon: row.icon,
        iceScore: row.ice_score,
        impact: row.impact,
        confidence: row.confidence,
        ease: row.ease,
        investmentHorizon: row.investment_horizon,
        startDate: row.start_date,
        endDate: row.end_date,
        dependencies: row.dependencies || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at
    }));

    const sprints = sprintsRes.rows.map(row => ({
        id: row.id,
        boardId: row.board_id,
        name: row.name,
        goal: row.goal,
        state: row.state,
        startAt: row.start_at,
        endAt: row.end_at,
        epicIds: row.epic_ids || [],
        deletedAt: row.deleted_at
    }));

    const teams = teamsRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        members: row.members || []
    }));

    return NextResponse.json({
        workItems,
        epics,
        sprints,
        teams,
        notifications: [], // Notifications table could be added similarly
        savedViews: [], // SavedViews table could be added similarly
        joinRequests: [],
        inviteCodes: []
    });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Failed to fetch board data' }, { status: 500 });
  }
}