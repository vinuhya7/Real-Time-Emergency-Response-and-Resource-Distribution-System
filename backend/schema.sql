-- Reference schema for PostgreSQL if your instructor asks to see SQL.
-- The application itself uses SQLite automatically so the lab demo needs no DB setup.
CREATE TABLE incidents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    incident_type VARCHAR(30) NOT NULL,
    location VARCHAR(150) NOT NULL,
    severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_resource_id BIGINT
);
CREATE TABLE resources (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(30) NOT NULL,
    location VARCHAR(150) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE
);
