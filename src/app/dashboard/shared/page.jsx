'use client';

import { useCallback, useEffect, useState } from 'react';
import FileTable from '@/components/FileTable';

export default function SharedFilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSharedFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files/shared', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files);
      } else {
        setError(data.error || 'Failed to load shared files');
      }
    } catch (err) {
      setError('Something went wrong.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSharedFiles();
  }, [loadSharedFiles]);

  return (
    <>
      <div className="page-head">
        <h1>Shared Files</h1>
        <p className="muted">Files shared with you by others.</p>
      </div>

      {error && <div className="notice error">{error}</div>}

      {loading ? (
        <div className="empty">Loading shared files…</div>
      ) : (
        <FileTable files={files} showDelete={false} />
      )}
    </>
  );
}