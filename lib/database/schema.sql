-- Nouns95 Backend Caching Schema
-- Optimized for fast reads and efficient storage

-- Core Nouns table with all essential data
CREATE TABLE IF NOT EXISTS nouns (
  id INTEGER PRIMARY KEY,
  background INTEGER NOT NULL,
  body INTEGER NOT NULL,
  accessory INTEGER NOT NULL,
  head INTEGER NOT NULL,
  glasses INTEGER NOT NULL,
  owner_address TEXT NOT NULL,
  delegate_address TEXT,
  delegate_votes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast filtering and sorting
CREATE INDEX IF NOT EXISTS idx_nouns_background ON nouns(background);
CREATE INDEX IF NOT EXISTS idx_nouns_body ON nouns(body);
CREATE INDEX IF NOT EXISTS idx_nouns_accessory ON nouns(accessory);
CREATE INDEX IF NOT EXISTS idx_nouns_head ON nouns(head);
CREATE INDEX IF NOT EXISTS idx_nouns_glasses ON nouns(glasses);
CREATE INDEX IF NOT EXISTS idx_nouns_owner ON nouns(owner_address);
CREATE INDEX IF NOT EXISTS idx_nouns_delegate ON nouns(delegate_address);
CREATE INDEX IF NOT EXISTS idx_nouns_created_at ON nouns(created_at);

-- Optimized indexes for fast pagination (most common queries)
CREATE INDEX IF NOT EXISTS idx_nouns_id_desc ON nouns(id DESC);
CREATE INDEX IF NOT EXISTS idx_nouns_background_id ON nouns(background, id);
CREATE INDEX IF NOT EXISTS idx_nouns_body_id ON nouns(body, id);
CREATE INDEX IF NOT EXISTS idx_nouns_owner_id ON nouns(owner_address, id);
CREATE INDEX IF NOT EXISTS idx_nouns_delegate_id ON nouns(delegate_address, id);

-- Pre-generated SVG images cache
CREATE TABLE IF NOT EXISTS noun_images (
  noun_id INTEGER PRIMARY KEY REFERENCES nouns(id) ON DELETE CASCADE,
  svg_data TEXT NOT NULL, -- Base64 encoded SVG
  width INTEGER DEFAULT 160,
  height INTEGER DEFAULT 160,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENS resolution cache with expiration
CREATE TABLE IF NOT EXISTS ens_cache (
  address TEXT PRIMARY KEY,
  ens_name TEXT, -- NULL if no ENS name found
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  is_valid BOOLEAN DEFAULT true -- Track if resolution was successful
);

-- Index for cleanup of expired ENS entries
CREATE INDEX IF NOT EXISTS idx_ens_cache_expires_at ON ens_cache(expires_at);

-- Governance votes cache (for NounDetail page)
CREATE TABLE IF NOT EXISTS noun_votes (
  id TEXT PRIMARY KEY,
  noun_id INTEGER REFERENCES nouns(id) ON DELETE CASCADE,
  voter_address TEXT NOT NULL,
  support BOOLEAN NOT NULL,
  votes DECIMAL(20,2) NOT NULL,
  block_number BIGINT NOT NULL,
  proposal_id TEXT NOT NULL,
  proposal_title TEXT,
  proposal_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for votes
CREATE INDEX IF NOT EXISTS idx_noun_votes_noun_id ON noun_votes(noun_id);
CREATE INDEX IF NOT EXISTS idx_noun_votes_block_number ON noun_votes(block_number DESC);

-- Sync tracking table
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'nouns', 'ens', 'votes', 'images'
  last_synced_id INTEGER,
  total_processed INTEGER DEFAULT 0,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  success BOOLEAN DEFAULT false,
  error_message TEXT
);

-- Index for getting latest sync status
CREATE INDEX IF NOT EXISTS idx_sync_log_type_completed ON sync_log(sync_type, sync_completed_at DESC);

-- Helper function to get trait counts (for analytics)
CREATE OR REPLACE VIEW trait_counts AS
SELECT 
  'background' as trait_type, background as trait_value, COUNT(*) as count
FROM nouns GROUP BY background
UNION ALL
SELECT 
  'body' as trait_type, body as trait_value, COUNT(*) as count
FROM nouns GROUP BY body
UNION ALL
SELECT 
  'accessory' as trait_type, accessory as trait_value, COUNT(*) as count
FROM nouns GROUP BY accessory
UNION ALL
SELECT 
  'head' as trait_type, head as trait_value, COUNT(*) as count
FROM nouns GROUP BY head
UNION ALL
SELECT 
  'glasses' as trait_type, glasses as trait_value, COUNT(*) as count
FROM nouns GROUP BY glasses;

-- Helper view for nouns with ENS data
CREATE OR REPLACE VIEW nouns_with_ens AS
SELECT 
  n.*,
  e.ens_name,
  e.resolved_at as ens_resolved_at
FROM nouns n
LEFT JOIN ens_cache e ON n.owner_address = e.address 
  AND e.expires_at > NOW()
  AND e.is_valid = true;
