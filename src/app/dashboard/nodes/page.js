'use client';

import { useEffect, useState } from 'react';

export default function NodesPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/nodes', { cache: 'no-store' });
    const data = await res.json();
    setNodes(res.ok ? data.nodes : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="page-head">
        <h1>Storage nodes</h1>
        {/* <div className="muted">
          Each node is an independent machine holding complete file copies. Stop one and downloads continue from another.
        </div> */}
      </div>

      {loading ? <div className="empty">Checking nodes…</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Node</th><th>Address</th><th>Status</th><th>Last seen</th></tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.node_id}>
                  <td>{n.node_name}</td>
                  <td className="num">{n.base_url}</td>
                  <td>
                    <span className={`node-pill ${n.status}`}>
                      <span className="dot" />{n.status}
                    </span>
                  </td>
                  <td className="num">{n.last_seen ? new Date(n.last_seen).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}