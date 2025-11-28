import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Users Table
    await sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_url TEXT
    );`;

    // 2. Boards Table
    await sql`CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon_url TEXT
    );`;

    // 3. Teams Table
    await sql`CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      members JSONB DEFAULT '[]'::jsonb -- Array of user IDs
    );`;

    // 4. Board Members (Relation)
    await sql`CREATE TABLE IF NOT EXISTS board_members (
      board_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (board_id, user_id)
    );`;

    // 5. Epics Table
    await sql`CREATE TABLE IF NOT EXISTS epics (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      ai_summary TEXT,
      status TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      ice_score DOUBLE PRECISION DEFAULT 0,
      impact INTEGER DEFAULT 5,
      confidence INTEGER DEFAULT 5,
      ease INTEGER DEFAULT 5,
      investment_horizon TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      dependencies JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      deleted_at TIMESTAMP
    );`;

    // 6. Sprints Table
    await sql`CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      name TEXT NOT NULL,
      goal TEXT,
      state TEXT NOT NULL,
      start_at TIMESTAMP,
      end_at TIMESTAMP,
      epic_ids JSONB DEFAULT '[]'::jsonb,
      deleted_at TIMESTAMP
    );`;

    // 7. Work Items Table
    await sql`CREATE TABLE IF NOT EXISTS work_items (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      description TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      sprint_id TEXT,
      epic_id TEXT,
      team_id TEXT,
      assignees JSONB DEFAULT '[]'::jsonb,
      reporter JSONB,
      estimation_points INTEGER DEFAULT 0,
      effort_hours INTEGER DEFAULT 0,
      due_date TIMESTAMP,
      labels JSONB DEFAULT '[]'::jsonb,
      checklist JSONB DEFAULT '[]'::jsonb,
      attachments JSONB DEFAULT '[]'::jsonb,
      watchers JSONB DEFAULT '[]'::jsonb,
      stack TEXT,
      group_name TEXT,
      sprint_binding TEXT,
      done_in_sprint_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      deleted_at TIMESTAMP
    );`;

    // Seed Initial Mock User
    await sql`INSERT INTO users (id, name, email, avatar_url)
      VALUES ('user-1', 'Alice Johnson', 'alice.j@gmail.com', 'https://i.pravatar.cc/150?u=alice')
      ON CONFLICT (id) DO NOTHING;
    `;

    return NextResponse.json({ message: 'Database schema initialized successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}