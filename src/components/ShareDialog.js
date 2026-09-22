'use client';

import { useState } from 'react';

export default function ShareDialog({ file, onClose, onDone }) {
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/files/${file.file_id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, can_edit: canEdit, can_delete: canDelete }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Sharing failed.');
    onDone(`Shared ${file.file_name} with ${email}.`);
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <h2>Share “{file.file_name}”</h2>
      {error && <div className="notice error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="share-email">Give access to</label>
          <input id="share-email" type="email" placeholder="colleague@storenet.local"
                 value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Permissions</label>
          <label style={{ display: 'inline-flex', gap: 6, marginRight: 16, color: 'var(--ink)' }}>
            <input type="checkbox" checked readOnly style={{ width: 'auto' }} /> View
          </label>
          <label style={{ display: 'inline-flex', gap: 6, marginRight: 16, color: 'var(--ink)' }}>
            <input type="checkbox" checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} style={{ width: 'auto' }} /> Edit
          </label>
          <label style={{ display: 'inline-flex', gap: 6, color: 'var(--ink)' }}>
            <input type="checkbox" checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} style={{ width: 'auto' }} /> Delete
          </label>
        </div>
        <button type="submit">Share file</button>
        <button type="button" className="ghost" style={{ marginLeft: 8 }} onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}