-- StoreNet schema. Run this in phpMyAdmin (XAMPP) before starting the app.
DROP DATABASE IF EXISTS storenet;
CREATE DATABASE storenet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE storenet;

CREATE TABLE Departments (
  department_id   INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager','employee') NOT NULL DEFAULT 'employee',
  department_id INT NULL,
  status        ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL
);

CREATE TABLE Files (
  file_id    INT AUTO_INCREMENT PRIMARY KEY,
  owner_id   INT NOT NULL,
  file_name  VARCHAR(255) NOT NULL,
  mime_type  VARCHAR(120) DEFAULT 'application/octet-stream',
  file_size  BIGINT NOT NULL DEFAULT 0,
  status     ENUM('available','deleted') NOT NULL DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE FilePermissions (
  permission_id INT AUTO_INCREMENT PRIMARY KEY,
  file_id    INT NOT NULL,
  user_id    INT NOT NULL,
  can_view   TINYINT(1) NOT NULL DEFAULT 1,
  can_edit   TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_file_user (file_id, user_id),
  FOREIGN KEY (file_id) REFERENCES Files(file_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE StorageNodes (
  node_id    INT AUTO_INCREMENT PRIMARY KEY,
  node_name  VARCHAR(80) NOT NULL UNIQUE,
  base_url   VARCHAR(200) NOT NULL,
  status     ENUM('online','offline') NOT NULL DEFAULT 'offline',
  capacity   BIGINT DEFAULT 0,
  last_seen  DATETIME NULL
);

CREATE TABLE FileReplicas (
  replica_id INT AUTO_INCREMENT PRIMARY KEY,
  file_id    INT NOT NULL,
  node_id    INT NOT NULL,
  copy_type  ENUM('primary','replica') NOT NULL,
  status     ENUM('stored','failed') NOT NULL DEFAULT 'stored',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_file_node (file_id, node_id),
  FOREIGN KEY (file_id) REFERENCES Files(file_id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES StorageNodes(node_id) ON DELETE CASCADE
);

CREATE TABLE SharedLinks (
  link_id    INT AUTO_INCREMENT PRIMARY KEY,
  file_id    INT NOT NULL,
  created_by INT NOT NULL,
  token      VARCHAR(80) NOT NULL UNIQUE,
  expires_at DATETIME NULL,
  FOREIGN KEY (file_id) REFERENCES Files(file_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE AuditLogs (
  log_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NULL,
  action    VARCHAR(120) NOT NULL,
  file_id   INT NULL,
  detail    VARCHAR(255) NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed --------------------------------------------------------------
INSERT INTO Departments (department_name) VALUES ('Engineering'), ('Finance'), ('HR');

-- Both seeded accounts use the password: admin123
-- (bcrypt hash of "admin123", cost 10)
INSERT INTO Users (name, email, password_hash, role, department_id) VALUES
('System Admin', 'admin@storenet.local', '$2b$10$EvTg5r7P9Gbn6qiOoEvkAe4rkvUWNosiibmdiZJ8kAsRXPihf5a12', 'admin', 1),
('Rakib Hasan',  'rakib@storenet.local', '$2b$10$EvTg5r7P9Gbn6qiOoEvkAe4rkvUWNosiibmdiZJ8kAsRXPihf5a12', 'employee', 1);

INSERT INTO StorageNodes (node_name, base_url, status) VALUES
('node1', 'http://localhost:5001', 'offline'),
('node2', 'http://192.168.0.101:5001', 'offline');
