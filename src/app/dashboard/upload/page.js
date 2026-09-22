'use client';

import { useEffect, useState } from 'react';
import NodeStrip from '@/components/NodeStrip';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placement, setPlacement] = useState(null);
  
  // ইউজারের রোল চেক করার জন্য স্টেট
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => setUser(null));
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!file) return setError('Choose a file to upload.');
    setBusy(true); setError(''); setPlacement(null);

    const body = new FormData();
    body.append('file', file);

    const res = await fetch('/api/files', { method: 'POST', body });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Upload failed.');
    setPlacement(data.placement);
  }

  return (
    <>
      <div className="page-head">
        <h1>Upload a file</h1>
      </div>

      {/* শর্ত: শুধুমাত্র অ্যাডমিন লগইন করলেই নোড স্ট্রিপ দেখাবে */}
      {user?.role === 'admin' && <NodeStrip />}

      {error && <div className="notice error">{error}</div>}

      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="file">File</label>
            <input id="file" type="file" onChange={(e) => setFile(e.target.files[0] || null)} />
          </div>
          <button type="submit" disabled={busy}>{busy ? 'Replicating…' : 'Upload and replicate'}</button>
        </form>
      </div>

      {placement && (
        <div style={{ marginTop: 20, maxWidth: 480 }}>
          <h2>Where the copies landed</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Node</th><th>Copy</th><th>Result</th></tr></thead>
              <tbody>
                {placement.map((p) => (
                  <tr key={p.node}>
                    <td>{p.node}</td>
                    <td>{p.copy_type}</td>
                    <td>{p.status === 'stored' ? 'Complete file stored' : `Failed — ${p.error}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}