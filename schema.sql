-- Cloudflare D1 Database Schema for Absora AI Hub

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS colab_state;
DROP TABLE IF EXISTS loaded_models;
DROP TABLE IF EXISTS sessions;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Tracks the Colab instance status & Cloudflare Quick Tunnel URL
CREATE TABLE colab_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  tunnel_url TEXT,
  status TEXT DEFAULT 'IDLE',  -- IDLE | STARTING | ACTIVE | ERROR
  started_at INTEGER,
  last_heartbeat INTEGER,
  vram_used_gb REAL DEFAULT 0,
  vram_free_gb REAL DEFAULT 16
);

-- Active models currently loaded on Colab T4 GPU
CREATE TABLE loaded_models (
  model_id TEXT PRIMARY KEY,
  hf_id TEXT NOT NULL,
  vram_allocated_gb REAL NOT NULL,
  port INTEGER NOT NULL,
  loaded_at INTEGER NOT NULL,
  active_user_count INTEGER DEFAULT 0,
  last_request INTEGER
);

-- User sessions (2 hours duration)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  status TEXT NOT NULL,   -- QUEUED | LOADING | ACTIVE | EXPIRED | STOPPED
  queue_position INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  activated_at INTEGER,
  expires_at INTEGER      -- activated_at + 7200 (2 hours)
);

-- Initial row for colab_state
INSERT INTO colab_state (id, tunnel_url, status, vram_used_gb, vram_free_gb) 
VALUES (1, NULL, 'IDLE', 0.0, 16.0);
