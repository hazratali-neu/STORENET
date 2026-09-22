import { NextResponse } from 'next/server';
import { query, queryOne, audit } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req) {
  const { name, email, password, department_id } = await req.json();

  if (!name || !email || !password)
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

  const existing = await queryOne('SELECT user_id FROM Users WHERE email = ?', [email]);
  if (existing)
    return NextResponse.json({ error: 'That email is already registered.' }, { status: 409 });

  const hash = await hashPassword(password);
  const res = await query(
    'INSERT INTO Users (name, email, password_hash, role, department_id) VALUES (?,?,?,"employee",?)',
    [name, email, hash, department_id || null]
  );
  await audit(res.insertId, 'user.register');

  return NextResponse.json({ ok: true, user_id: res.insertId });
}