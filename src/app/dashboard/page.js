'use client';

import { useCallback, useEffect, useState } from 'react';
import NodeStrip from '@/components/NodeStrip';
import FileTable from '@/components/FileTable';
import ShareDialog from '@/components/ShareDialog';

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(null);
  
  // ১. ইউজার ইনফো রাখার জন্য নতুন স্টেট যোগ করা হলো
  const [user, setUser] = useState(null);

  // ২. পেজ লোড হওয়ার সময় ইউজারের তথ্য (role সহ) ফেচ করা
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' }) // আপনার প্রজেক্টের সেশন বা অথ এপিআই রুট দিয়ে এটি বদলাতে পারেন
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const load = useCallback(async (term = '') => {
    setLoading(true);
    const res = await fetch(`/api/files?q=${encodeURIComponent(term)}`, { cache: 'no-store' });
    const data = await res.json();
    setFiles(res.ok ? data.files : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(file) {
    if (!confirm(`Delete ${file.file_name}?`)) return;
    const res = await fetch(`/api/files/${file.file_id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setMessage(`Deleted ${file.file_name}.`);
    load(q);
  }

  return (
    <>
      <div className="page-head">
        <h1>Files</h1>
        {/* <div className="muted">Every file here is stored as a complete copy on each online node.</div> */}
      </div>

      {/* ৩. শর্ত দিয়ে দিলাম: শুধুমাত্র ইউজার যদি 'admin' হয়, তবেই <NodeStrip /> দেখাবে */}
      {user?.role === 'admin' && <NodeStrip />}

      {message && <div className="notice ok">{message}</div>}
      {error && <div className="notice error">{error}</div>}

      {sharing && (
        <ShareDialog
          file={sharing}
          onClose={() => setSharing(null)}
          onDone={(m) => { setSharing(null); setMessage(m); load(q); }}
        />
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); load(q); }}
        style={{ display: 'flex', gap: 8, marginBottom: 16, maxWidth: 420 }}
      >
        <input type="text" placeholder="Search file names" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="ghost">Search</button>
      </form>

      {loading ? <div className="empty">Loading files…</div>
               : <FileTable files={files} onDelete={remove} onShare={setSharing} />}
    </>
  );
}