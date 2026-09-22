'use client';

import { useEffect, useState } from 'react';

/** Live view of every storage node — the thing that proves replication is real. */
export default function NodeStrip({ pollMs = 5000 }) {
  const [nodes, setNodes] = useState([]);
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const res = await fetch('/api/nodes', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setNodes(data.nodes);
        setCheckedAt(new Date());
      } catch {}
    }
    check();
    const t = setInterval(check, pollMs);
    return () => { alive = false; clearInterval(t); };
  }, [pollMs]);

  return (
    <div className="node-strip">
      {nodes.length === 0 && <span className="muted">Checking storage nodes…</span>}
      {nodes.map((n) => (
        <span key={n.node_id} className={`node-pill ${n.status}`}>
          <span className="dot" />
          {n.node_name} · {n.status}
        </span>
      ))}
      {/* {checkedAt && (
        <span className="muted" style={{ marginLeft: 'auto' }}>
          checked {checkedAt.toLocaleTimeString()}
        </span>
      )} */}
    </div>
  );
}