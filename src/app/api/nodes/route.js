import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { refreshNodes } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** GET /api/nodes — ping every node and report status. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const nodes = await refreshNodes();
  return NextResponse.json({ nodes });
}
