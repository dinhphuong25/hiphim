CREATE TABLE IF NOT EXISTS hiphim_users (
  email TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS hiphim_users_id_idx ON hiphim_users (id);

CREATE TABLE IF NOT EXISTS hiphim_pending_registrations (
  email TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at BIGINT NOT NULL
);