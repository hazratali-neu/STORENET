import { NextResponse } from 'next/server';
import { queryOne, audit } from '@/lib/db';
import { verifyPassword, signToken, COOKIE } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();

  const user = await queryOne('SELECT * FROM Users WHERE email = ?', [email]);
  if (!user || user.status !== 'active')
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });

  const ok = await verifyPassword(password || '', user.password_hash);
  if (!ok)
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });

  await audit(user.user_id, 'user.login');

  const res = NextResponse.json({
    ok: true,
    user: { user_id: user.user_id, name: user.name, role: user.role },
  });
  res.cookies.set(COOKIE, signToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}