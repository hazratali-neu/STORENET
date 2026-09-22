'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return (
    <button className="link" style={{ paddingLeft: 0, marginTop: 6 }} onClick={signOut}>
      Sign out
    </button>
  );
}