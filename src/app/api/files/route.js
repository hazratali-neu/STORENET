import { NextResponse } from 'next/server';
import { query, audit } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { replicate } from '@/lib/replication';

export const dynamic = 'force-dynamic';

/** GET /api/files — files the user owns. */
export async function GET(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const search = `%${new URL(req.url).searchParams.get('q') || ''}%`;

  // এখানে অ্যাডমিন সব দেখবে, কিন্তু সাধারণ ইউজার শুধু নিজের ফাইলগুলোই (f.owner_id = user_id) দেখতে পাবে
  const sql =
    user.role === 'admin'
      ? `SELECT f.*, u.name AS owner_name,
                (SELECT COUNT(*) FROM FileReplicas r WHERE r.file_id = f.file_id AND r.status='stored') AS copies
           FROM Files f JOIN Users u ON u.user_id = f.owner_id
          WHERE f.status='available' AND f.file_name LIKE ?
          ORDER BY f.created_at DESC`
      : `SELECT DISTINCT f.*, u.name AS owner_name,
                (SELECT COUNT(*) FROM FileReplicas r WHERE r.file_id = f.file_id AND r.status='stored') AS copies
           FROM Files f
           JOIN Users u ON u.user_id = f.owner_id
          WHERE f.status='available' AND f.file_name LIKE ?
            AND f.owner_id = ?
          ORDER BY f.created_at DESC`;

  const params = user.role === 'admin' ? [search] : [search, user.user_id];
  const files = await query(sql, params);
  return NextResponse.json({ files });
}

/** POST /api/files — upload one complete file and replicate it. */
export async function POST(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');

  if (!file || typeof file === 'string')
    return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const inserted = await query(
    'INSERT INTO Files (owner_id, file_name, mime_type, file_size) VALUES (?,?,?,?)',
    [user.user_id, file.name, file.type || 'application/octet-stream', buffer.length]
  );
  const fileId = inserted.insertId;

  try {
    const placement = await replicate(fileId, file.name, buffer);
    await audit(user.user_id, 'file.upload', fileId, `${placement.length} copies`);
    return NextResponse.json({ ok: true, file_id: fileId, placement });
  } catch (e) {
    await query('UPDATE Files SET status = "deleted" WHERE file_id = ?', [fileId]);
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
}