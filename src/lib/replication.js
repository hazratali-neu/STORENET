import { query } from './db';
import { refreshNodes, storeOnNode, fetchFromNode } from './storage';

/**
 * Whole-file replication: store the complete file on a primary node,
 * then copy the same complete file to every other online node.
 * No chunking, no reconstruction.
 */
export async function replicate(fileId, fileName, buffer) {
  const nodes = await refreshNodes();
  const online = nodes.filter((n) => n.status === 'online');
  if (online.length === 0) throw new Error('No storage node is online');

  const results = [];
  let primaryAssigned = false;

  for (const node of online) {
    const copyType = primaryAssigned ? 'replica' : 'primary';
    try {
      await storeOnNode(node, fileId, fileName, buffer);
      await query(
        `INSERT INTO FileReplicas (file_id, node_id, copy_type, status)
         VALUES (?,?,?, 'stored')
         ON DUPLICATE KEY UPDATE copy_type = VALUES(copy_type), status = 'stored'`,
        [fileId, node.node_id, copyType]
      );
      if (copyType === 'primary') primaryAssigned = true;
      results.push({ node: node.node_name, copy_type: copyType, status: 'stored' });
    } catch (e) {
      await query(
        `INSERT INTO FileReplicas (file_id, node_id, copy_type, status)
         VALUES (?,?,?, 'failed')
         ON DUPLICATE KEY UPDATE status = 'failed'`,
        [fileId, node.node_id, copyType]
      );
      results.push({ node: node.node_name, copy_type: copyType, status: 'failed', error: e.message });
    }
  }

  if (!primaryAssigned) throw new Error('Could not store the file on any node');
  return results;
}

/**
 * Failure recovery: try the primary copy first, fall back to any replica.
 * Returns { buffer, servedBy }.
 */
export async function retrieve(fileId) {
  const copies = await query(
    `SELECT r.copy_type, n.*
       FROM FileReplicas r
       JOIN StorageNodes n ON n.node_id = r.node_id
      WHERE r.file_id = ? AND r.status = 'stored'
      ORDER BY FIELD(r.copy_type, 'primary', 'replica')`,
    [fileId]
  );

  const tried = [];
  for (const node of copies) {
    try {
      const buffer = await fetchFromNode(node, fileId);
      return { buffer, servedBy: node.node_name, copyType: node.copy_type, tried };
    } catch (e) {
      tried.push(node.node_name);
    }
  }
  throw new Error(`No complete copy available. Tried: ${tried.join(', ') || 'none'}`);
}