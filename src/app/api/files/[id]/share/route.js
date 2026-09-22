import { NextResponse } from 'next/server';
import { query, queryOne, audit } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/** POST /api/files/:id/share — grant another user access. */
export async function POST(req, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const fileId = Number(params.id);
  const { email, can_edit = false, can_delete = false } = await req.json();

  const file = await queryOne('SELECT owner_id FROM Files WHERE file_id = ? AND status="available"', [fileId]);
  if (!file) return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  if (file.owner_id !== user.user_id && user.role !== 'admin')
    return NextResponse.json({ error: 'Only the owner can share this file.' }, { status: 403 });

  const target = await queryOne('SELECT user_id FROM Users WHERE email = ?', [email]);
  if (!target) return NextResponse.json({ error: 'No user with that email.' }, { status: 404 });

  await query(
    `INSERT INTO FilePermissions (file_id, user_id, can_view, can_edit, can_delete)
     VALUES (?,?,1,?,?)
     ON DUPLICATE KEY UPDATE can_edit = VALUES(can_edit), can_delete = VALUES(can_delete)`,
    [fileId, target.user_id, can_edit ? 1 : 0, can_delete ? 1 : 0]
  );
  await audit(user.user_id, 'file.share', fileId, `to ${email}`);

  return NextResponse.json({ ok: true });
}
