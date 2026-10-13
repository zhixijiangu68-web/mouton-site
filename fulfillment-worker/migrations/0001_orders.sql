CREATE TABLE IF NOT EXISTS orders (
 session_id TEXT PRIMARY KEY,
 payment_intent_id TEXT NOT NULL,
 email TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','sending','sent','failed','revoked')),
 expires_at INTEGER NOT NULL,
 downloads INTEGER NOT NULL DEFAULT 0,
 send_claimed_at INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
