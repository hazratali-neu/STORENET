import { query, queryOne } from './db';

const TIMEOUT = 4000;

async function withTimeout(promise, ms = TIMEOUT) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);

  try {
    return await promise(ctrl.signal);
  } catch (error) {
    console.error('❌ withTimeout error:', error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Ping a node's /health. Updates StorageNodes.status as a side effect. */
export async function pingNode(node) {
  try {
    console.log(`🔍 Pinging node: ${node.node_name} -> ${node.base_url}/health`);

    const res = await withTimeout((signal) =>
      fetch(`${node.base_url}/health`, {
        signal,
        cache: 'no-store'
      })
    );

    console.log(`📡 ${node.node_name} response status: ${res.status}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const body = await res.json();

    console.log(`✅ ${node.node_name} health response:`, body);

    await query(
      'UPDATE StorageNodes SET status = "online", capacity = ?, last_seen = NOW() WHERE node_id = ?',
      [body.free ?? 0, node.node_id]
    );

    console.log(`🟢 ${node.node_name} marked ONLINE`);

    return {
      ...node,
      status: 'online',
      free: body.free ?? 0
    };
  } catch (error) {
    console.error(`❌ pingNode failed for ${node.node_name}`);
    console.error('Node URL:', `${node.base_url}/health`);
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);

    try {
      await query(
        'UPDATE StorageNodes SET status = "offline" WHERE node_id = ?',
        [node.node_id]
      );

      console.log(`🔴 ${node.node_name} marked OFFLINE`);
    } catch (dbError) {
      console.error(`❌ Failed to update ${node.node_name} status in database`);
      console.error('Database error:', dbError);
    }

    return {
      ...node,
      status: 'offline',
      free: 0
    };
  }
}

export async function listNodes() {
  try {
    console.log('📋 Loading storage nodes...');

    const nodes = await query(
      'SELECT * FROM StorageNodes ORDER BY node_id'
    );

    console.log('📋 Storage nodes:', nodes);

    return nodes;
  } catch (error) {
    console.error('❌ listNodes error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw error;
  }
}

/** Ping every node and return the live list. */
export async function refreshNodes() {
  try {
    console.log('🔄 Refreshing all storage nodes...');

    const nodes = await listNodes();

    console.log(`🔍 Found ${nodes.length} storage node(s)`);

    const result = await Promise.all(
      nodes.map((node) => pingNode(node))
    );

    console.log('✅ Node refresh complete:', result);

    return result;
  } catch (error) {
    console.error('❌ refreshNodes error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw error;
  }
}

/** Push a complete file to one node. */
export async function storeOnNode(node, fileId, fileName, buffer) {
  try {
    console.log(
      `📤 Storing file "${fileName}" on ${node.node_name} (${node.base_url})`
    );

    const form = new FormData();

    form.append('file_id', String(fileId));
    form.append('file_name', fileName);
    form.append('file', new Blob([buffer]), fileName);

    const res = await withTimeout(
      (signal) =>
        fetch(`${node.base_url}/store`, {
          method: 'POST',
          body: form,
          signal
        }),
      30000
    );

    console.log(
      `📡 ${node.node_name} /store response status: ${res.status}`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const result = await res.json();

    console.log(`✅ File stored successfully on ${node.node_name}:`, result);

    return result;
  } catch (error) {
    console.error(`❌ storeOnNode failed for ${node.node_name}`);
    console.error('Node URL:', `${node.base_url}/store`);
    console.error('File:', fileName);
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);

    throw error;
  }
}

/** Fetch a complete file from one node. Returns a Buffer. */
export async function fetchFromNode(node, fileId) {
  try {
    console.log(
      `📥 Fetching file ${fileId} from ${node.node_name} (${node.base_url})`
    );

    const res = await withTimeout(
      (signal) =>
        fetch(`${node.base_url}/fetch/${fileId}`, {
          signal,
          cache: 'no-store'
        }),
      30000
    );

    console.log(
      `📡 ${node.node_name} /fetch/${fileId} response status: ${res.status}`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const arr = await res.arrayBuffer();
    const buffer = Buffer.from(arr);

    console.log(
      `✅ File ${fileId} fetched successfully from ${node.node_name}`
    );

    return buffer;
  } catch (error) {
    console.error(`❌ fetchFromNode failed for ${node.node_name}`);
    console.error('Node URL:', `${node.base_url}/fetch/${fileId}`);
    console.error('File ID:', fileId);
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);

    throw error;
  }
}

export async function nodeById(id) {
  try {
    console.log(`🔎 Finding storage node with ID: ${id}`);

    const node = await queryOne(
      'SELECT * FROM StorageNodes WHERE node_id = ?',
      [id]
    );

    console.log('🔎 Node result:', node);

    return node;
  } catch (error) {
    console.error(`❌ nodeById failed for ID: ${id}`);
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);

    throw error;
  }
}