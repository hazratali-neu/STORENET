# StoreNet

Distributed company file storage with user-wise access control.
Whole-file replication only — every copy is a complete file, no chunking, no reconstruction.

## What's built

| Area | Status |
|---|---|
| Register / login / logout (bcrypt + JWT cookie) | done |
| Route protection (`middleware.js`) | done |
| Upload with replication to every online node | done |
| File list with search + per-user visibility | done |
| Download with primary → replica fallback | done |
| Share a file with another user (view/edit/delete) | done |
| Soft delete with permission check | done |
| Live node status page (polls every 5s) | done |
| Audit logging | done |
| Departments UI, admin panel, shared links, versioning | not built — talk about these as next steps |

## Setup (about 10 minutes)

### 1. Database
Start **Apache + MySQL** in XAMPP. Open phpMyAdmin → Import → run `db/schema.sql`.
This creates the `storenet` database, all 8 tables, and two accounts:

- `admin@storenet.local` / `admin123` (admin)
- `rakib@storenet.local` / `admin123` (employee)

### 2. Environment
```bash
copy .env.local.example .env.local      # Windows
```
Edit `.env.local`. Leave `DB_PASS` empty for a default XAMPP install.
Set `NODE2_URL` to the MacBook's LAN IP — find it with `ipconfig` / `ifconfig`.

The node addresses also live in the `StorageNodes` table, and that's what the app
actually reads. Update them in phpMyAdmin:

```sql
UPDATE StorageNodes SET base_url = 'http://localhost:5001' WHERE node_name = 'node1';
UPDATE StorageNodes SET base_url = 'http://192.168.0.101:5001' WHERE node_name = 'node2';
```

### 3. Install
```bash
npm install
cd storage-node && npm install && cd ..
```

### 4. Run — three terminals

Terminal 1, storage node 1 (this laptop):
```bash
cd storage-node
set PORT=5001&& set NODE_NAME=node1&& node server.js
```

Terminal 2, storage node 2 (the MacBook — copy the `storage-node` folder over):
```bash
cd storage-node
npm install
PORT=5001 NODE_NAME=node2 node server.js
```

Terminal 3, the web app:
```bash
npm run dev
```

Open http://localhost:3000 and sign in.

> If node 2 shows offline, it's almost always Windows Firewall or Mac firewall
> blocking inbound port 5001. Allow it, and make sure both machines are on the
> same Wi-Fi.

## Demo script for the presentation

1. Open **Storage nodes** — both show online.
2. Upload a file. The result table shows `node1 → primary`, `node2 → replica`.
3. Show the file physically present in `storage-node/data/` on **both** machines.
4. Stop node 1 (Ctrl+C in terminal 1).
5. Refresh **Storage nodes** — node1 flips to offline within 5 seconds.
6. Download the same file. It still works, served from node 2.
7. Restart node 1. It comes back online.

To prove step 6 to a sceptical instructor, open DevTools → Network → the download
request → Response Headers. `X-Served-By` names the node that actually served it.

## Verified behaviour

Tested end-to-end against MySQL with two live nodes:

```
upload                → node1 primary stored, node2 replica stored
download (both up)    → X-Served-By: node1, X-Copy-Type: primary, bytes identical
node1 stopped
download (node1 down) → X-Served-By: node2, X-Copy-Type: replica, bytes identical
employee → admin file → 403 "You do not have access to this file."
after sharing         → 200, identical bytes
delete without rights → 403
wrong password        → 401
```

## Layout

```
src/lib/db.js            MySQL pool + audit helper
src/lib/auth.js          hashing, JWT, currentUser(), canAccess()
src/lib/storage.js       node ping, store, fetch
src/lib/replication.js   replicate() and retrieve() — the core of the project
src/app/api/             route handlers
src/app/dashboard/       files, upload, nodes pages
src/components/          NodeStrip, FileTable, ShareDialog, nav
storage-node/server.js   the independent storage service
db/schema.sql            schema + seed data
```

`replicate()` and `retrieve()` in `src/lib/replication.js` are the two functions
worth walking through in the presentation — everything else is standard CRUD.
