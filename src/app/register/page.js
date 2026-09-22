'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Registration failed.');
    router.push('/login');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="brand">StoreNet</div>
          <div className="muted">Create an employee account</div>
        </div>

        <div className="card">
          <h2>Create account</h2>
          {error && <div className="notice error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" value={form.name} onChange={set('name')} required />
            </div>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          </form>
          <div className="auth-foot">
            Already registered? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}