import { NextResponse } from 'next/server';
import { query, queryOne, audit } from '@/lib/db';
import { currentUser, canAccess } from '@/lib/auth';
import { retrieve } from '@/lib/replication';

export const dynamic = 'force-dynamic';

/** GET /api/files/:id — download. Falls back to a replica if the primary is down. */
export async function GET(_req, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const fileId = Number(params.id);
  if (!(await canAccess(user, fileId, 'view')))
    return NextResponse.json({ error: 'You do not have access to this file.' }, { status: 403 });

  const file = await queryOne('SELECT * FROM Files WHERE file_id = ?', [fileId]);

  try {
    const { buffer, servedBy, copyType } = await retrieve(fileId);
    await audit(user.user_id, 'file.download', fileId, `served by ${servedBy} (${copyType})`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.file_name}"`,
        'X-Served-By': servedBy,
        'X-Copy-Type': copyType,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
}

/** DELETE /api/files/:id — soft delete the metadata record. */
export async function DELETE(_req, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const fileId = Number(params.id);
  if (!(await canAccess(user, fileId, 'delete')))
    return NextResponse.json({ error: 'You do not have permission to delete this file.' }, { status: 403 });

  await query('UPDATE Files SET status = "deleted" WHERE file_id = ?', [fileId]);
  await audit(user.user_id, 'file.delete', fileId);
  return NextResponse.json({ ok: true });
}
