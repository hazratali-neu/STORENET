import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/files/shared — Files shared with the current user by others. */
export async function GET(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const search = `%${new URL(req.url).searchParams.get('q') || ''}%`;

  // শুধু অন্য User দের শেয়ার করা ফাইলগুলো কুয়েরি করার SQL
  const sql = `
    SELECT DISTINCT f.*, u.name AS owner_name,
              (SELECT COUNT(*) FROM FileReplicas r WHERE r.file_id = f.file_id AND r.status='stored') AS copies
       FROM Files f
       JOIN Users u ON u.user_id = f.owner_id
       JOIN FilePermissions p ON p.file_id = f.file_id AND p.user_id = ?
      WHERE f.status='available' AND f.file_name LIKE ?
        AND f.owner_id != ? AND p.can_view = 1
      ORDER BY f.created_at DESC
  `;

  const files = await query(sql, [user.user_id, search, user.user_id]);
  return NextResponse.json({ files });
}