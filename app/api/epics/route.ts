import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const epic = await request.json();
  const id = epic.id || `epic-${Date.now()}`;
  const now = new Date().toISOString();

  try {
    await sql`
      INSERT INTO epics (
        id, board_id, name, description, ai_summary, status, color, icon, 
        ice_score, impact, confidence, ease, investment_horizon, 
        start_date, end_date, dependencies,
        created_at, updated_at, deleted_at
      )
      VALUES (
        ${id}, 
        ${epic.boardId}, 
        ${epic.name}, 
        ${epic.description || ''}, 
        ${epic.aiSummary || ''}, 
        ${epic.status}, 
        ${epic.color}, 
        ${epic.icon}, 
        ${epic.iceScore || 0}, 
        ${epic.impact || 5}, 
        ${epic.confidence || 5}, 
        ${epic.ease || 5}, 
        ${epic.investmentHorizon}, 
        ${epic.startDate || null}, 
        ${epic.endDate || null}, 
        ${JSON.stringify(epic.dependencies || [])}::jsonb,
        ${epic.createdAt || now}, 
        ${now}, 
        ${epic.deletedAt || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        ai_summary = EXCLUDED.ai_summary,
        status = EXCLUDED.status,
        color = EXCLUDED.color,
        icon = EXCLUDED.icon,
        ice_score = EXCLUDED.ice_score,
        impact = EXCLUDED.impact,
        confidence = EXCLUDED.confidence,
        ease = EXCLUDED.ease,
        investment_horizon = EXCLUDED.investment_horizon,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        dependencies = EXCLUDED.dependencies,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at
    `;

    return NextResponse.json({ ...epic, id, updatedAt: now });
  } catch (error) {
    console.error("Save Epic Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}