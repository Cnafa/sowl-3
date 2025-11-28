import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  try {
    const { rows: boards } = await sql`
      SELECT b.* FROM boards b
      JOIN board_members bm ON b.id = bm.board_id
      WHERE bm.user_id = ${userId}
    `;
    
    // In a real app we'd fetch members properly, here simplified
    const boardMembers: any = {};
    for (const board of boards) {
       const { rows: members } = await sql`
         SELECT bm.role_id, u.id, u.name, u.email, u.avatar_url 
         FROM board_members bm
         JOIN users u ON bm.user_id = u.id
         WHERE bm.board_id = ${board.id}
       `;
       boardMembers[board.id] = members.map(m => ({
         roleId: m.role_id,
         user: { id: m.id, name: m.name, email: m.email, avatarUrl: m.avatar_url }
       }));
    }

    return NextResponse.json({ boards, boardMembers });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { code, user } = await request.json();
  // Simplified join logic
  const boardId = `board-${code.trim().toLowerCase()}`;
  
  try {
    // Check if board exists
    const { rows } = await sql`SELECT * FROM boards WHERE id = ${boardId}`;
    let board = rows[0];

    if (!board) {
      board = { id: boardId, name: `Project ${code}` };
      await sql`INSERT INTO boards (id, name) VALUES (${boardId}, ${board.name})`;
    }

    // Add member
    await sql`
      INSERT INTO board_members (board_id, user_id, role_id)
      VALUES (${boardId}, ${user.id}, 'role-3')
      ON CONFLICT DO NOTHING
    `;

    // Ensure user exists
    await sql`
      INSERT INTO users (id, name, email, avatar_url)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${user.avatarUrl})
      ON CONFLICT (id) DO UPDATE SET name = ${user.name}, avatar_url = ${user.avatarUrl}
    `;

    return NextResponse.json(board);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}