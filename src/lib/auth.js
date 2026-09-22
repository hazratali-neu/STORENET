import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { queryOne } from './db';

const SECRET = process.env.JWT_SECRET || 'dev_secret';
export const COOKIE = 'storenet_token';

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

export function signToken(user) {
  return jwt.sign(
    { uid: user.user_id, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '8h' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/** Returns the logged-in user row, or null. Use inside route handlers. */
export async function currentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return queryOne(
    'SELECT user_id, name, email, role, department_id, status FROM Users WHERE user_id = ? AND status = "active"',
    [payload.uid]
  );
}

/** Permission check: owner, admin, or an explicit FilePermissions row. */
export async function canAccess(user, fileId, action = 'view') {
  if (!user) return false;
  const file = await queryOne('SELECT owner_id FROM Files WHERE file_id = ? AND status = "available"', [fileId]);
  if (!file) return false;
  if (user.role === 'admin' || file.owner_id === user.user_id) return true;

  const perm = await queryOne(
    'SELECT can_view, can_edit, can_delete FROM FilePermissions WHERE file_id = ? AND user_id = ?',
    [fileId, user.user_id]
  );
  if (!perm) return false;
  if (action === 'view') return !!perm.can_view;
  if (action === 'edit') return !!perm.can_edit;
  if (action === 'delete') return !!perm.can_delete;
  return false;
}