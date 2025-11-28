
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Enable UUID extension
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

    // 2. Users Table
    await sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, -- Google ID or UUID
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`;

    // 3. Boards Table
    await sql`CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      icon_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`;

    // 4. Teams Table
    await sql`CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      members JSONB DEFAULT '[]'::jsonb, -- Array of user IDs
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`;

    // 5. Board Members (Relation)
    await sql`CREATE TABLE IF NOT EXISTS board_members (
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (board_id, user_id)
    );`;

    // 6. Epics Table
    await sql`CREATE TABLE IF NOT EXISTS epics (
      id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      ai_summary TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DONE, ON_HOLD, ARCHIVED, DELETED
      color TEXT,
      icon TEXT,
      ice_score DOUBLE PRECISION DEFAULT 0,
      impact INTEGER DEFAULT 5,
      confidence INTEGER DEFAULT 5,
      ease INTEGER DEFAULT 5,
      investment_horizon TEXT, -- NOW, NEXT, LATER
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      dependencies JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );`;
    // Indexes for Epics
    await sql`CREATE INDEX IF NOT EXISTS idx_epics_board_id ON epics(board_id);`;

    // 7. Sprints Table
    await sql`CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      goal TEXT,
      state TEXT NOT NULL DEFAULT 'PLANNED', -- PLANNED, ACTIVE, CLOSED, DELETED
      start_at TIMESTAMP WITH TIME ZONE,
      end_at TIMESTAMP WITH TIME ZONE,
      epic_ids JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );`;
    // Indexes for Sprints
    await sql`CREATE INDEX IF NOT EXISTS idx_sprints_board_id ON sprints(board_id);`;

    // 8. Work Items Table (The Core)
    await sql`CREATE TABLE IF NOT EXISTS work_items (
      id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT,
      description TEXT,
      type TEXT NOT NULL, -- STORY, TASK, BUG, etc.
      status TEXT NOT NULL, -- TODO, IN_PROGRESS, etc.
      priority TEXT NOT NULL DEFAULT 'Medium',
      
      -- Relations
      sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
      epic_id TEXT REFERENCES epics(id) ON DELETE SET NULL,
      team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      
      -- JSON Data (keeping flexible for frontend)
      assignees JSONB DEFAULT '[]'::jsonb, -- Array of User Objects
      reporter JSONB, -- User Object
      labels JSONB DEFAULT '[]'::jsonb,
      checklist JSONB DEFAULT '[]'::jsonb,
      attachments JSONB DEFAULT '[]'::jsonb,
      watchers JSONB DEFAULT '[]'::jsonb,
      
      -- Metadata
      estimation_points INTEGER DEFAULT 0,
      effort_hours INTEGER DEFAULT 0,
      due_date TIMESTAMP WITH TIME ZONE,
      stack TEXT,
      group_name TEXT,
      sprint_binding TEXT, -- 'auto' | 'manual'
      done_in_sprint_id TEXT, -- Snapshot of where it was completed
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );`;

    // Indexes for Work Items (Critical for performance)
    await sql`CREATE INDEX IF NOT EXISTS idx_work_items_board_id ON work_items(board_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_work_items_sprint_id ON work_items(sprint_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_work_items_epic_id ON work_items(epic_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_work_items_deleted_at ON work_items(deleted_at) WHERE deleted_at IS NOT NULL;`;

    // Seed Initial Mock User (Idempotent)
    await sql`INSERT INTO users (id, name, email, avatar_url)
      VALUES ('user-1', 'Alice Johnson', 'alice.j@gmail.com', 'https://i.pravatar.cc/150?u=alice')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `;

    return NextResponse.json({ message: 'Database schema initialized successfully with optimized structure.' }, { status: 200 });
  } catch (error) {
    console.error('Setup Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
