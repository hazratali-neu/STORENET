'use client';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileTable({ files, onDelete, onShare }) {
  if (files.length === 0) {
    return <div className="empty">No files yet. Upload one to see it replicated across the nodes.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Size</th>
            <th>Complete copies</th>
            <th>Uploaded</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.file_id}>
              <td>{f.file_name}</td>
              <td>{f.owner_name}</td>
              <td className="num">{formatSize(f.file_size)}</td>
              <td className="num">{f.copies}</td>
              <td className="num">{new Date(f.created_at).toLocaleDateString()}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <a href={`/api/files/${f.file_id}`}>
                  <button className="link">Download</button>
                </a>
                <button className="link" onClick={() => onShare(f)}>Share</button>
                <button className="link danger" onClick={() => onDelete(f)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}