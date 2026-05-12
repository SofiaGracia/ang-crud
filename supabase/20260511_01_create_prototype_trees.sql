-- 20260511_01_create_prototype_trees.sql
-- Creates prototype_trees table for persisting editor workingTree state
-- One prototype has exactly one persisted tree (1:1 via UNIQUE constraint)

-- Drop if rerunning (safe for dev; remove for prod)
DROP TABLE IF EXISTS prototype_trees;

CREATE TABLE prototype_trees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prototype_id BIGINT NOT NULL REFERENCES prototypes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tree JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_prototype_tree UNIQUE (prototype_id)
);

-- Index for fast lookup by prototype_id (the main access pattern)
CREATE INDEX idx_prototype_trees_prototype_id ON prototype_trees(prototype_id);

-- Index for user-based queries (RLS, admin)
CREATE INDEX idx_prototype_trees_user_id ON prototype_trees(user_id);

-- Trigger to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_prototype_trees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prototype_trees_updated_at
    BEFORE UPDATE ON prototype_trees
    FOR EACH ROW
    EXECUTE FUNCTION update_prototype_trees_updated_at();

-- Row Level Security
ALTER TABLE prototype_trees ENABLE ROW LEVEL SECURITY;

-- Users can only see their own trees
CREATE POLICY "Users can view their own prototype trees"
    ON prototype_trees
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own trees
CREATE POLICY "Users can insert their own prototype trees"
    ON prototype_trees
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own trees
CREATE POLICY "Users can update their own prototype trees"
    ON prototype_trees
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own trees
CREATE POLICY "Users can delete their own prototype trees"
    ON prototype_trees
    FOR DELETE
    USING (user_id = auth.uid());

-- Grant access to authenticated users
GRANT ALL ON prototype_trees TO authenticated;
GRANT USAGE ON SEQUENCE prototype_trees_id_seq TO authenticated;
