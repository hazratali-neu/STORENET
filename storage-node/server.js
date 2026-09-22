/**
 * StoreNet storage node.
 * Stores COMPLETE files only. No chunking, no reconstruction.
 *
 *   PORT=5001 NODE_NAME=node1 node server.js       (mac / linux)
 *   set PORT=5001&& set NODE_NAME=node1&& node server.js   (windows cmd)
 */
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5001;
const NODE_NAME = process.env.NODE_NAME || 'node1';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

app.get('/health', (req, res) => {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.bin'));
  res.json({ ok: true, node: NODE_NAME, stored: files.length, free: 1024 * 1024 * 1024 });
});

app.post('/store', upload.single('file'), (req, res) => {
  const fileId = req.body.file_id;
  if (!fileId || !req.file) return res.status(400).json({ error: 'file_id and file are required' });

  fs.writeFileSync(path.join(DATA_DIR, `${fileId}.bin`), req.file.buffer);
  fs.writeFileSync(
    path.join(DATA_DIR, `${fileId}.meta.json`),
    JSON.stringify({ file_id: fileId, file_name: req.body.file_name, size: req.file.size }, null, 2)
  );

  console.log(`[${NODE_NAME}] stored complete file ${fileId} (${req.file.size} bytes)`);
  res.json({ ok: true, node: NODE_NAME, file_id: fileId, size: req.file.size });
});

app.get('/fetch/:file_id', (req, res) => {
  const filePath = path.join(DATA_DIR, `${req.params.file_id}.bin`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'copy not found on this node' });
  console.log(`[${NODE_NAME}] serving complete file ${req.params.file_id}`);
  res.sendFile(filePath);
});

app.delete('/remove/:file_id', (req, res) => {
  for (const ext of ['.bin', '.meta.json']) {
    const p = path.join(DATA_DIR, `${req.params.file_id}${ext}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`StoreNet node "${NODE_NAME}" listening on 0.0.0.0:${PORT}`);
  console.log(`Storage directory: ${DATA_DIR}`);
});
