-- 商品ごとの納品（哲学の有料記事3本）。今ある注文は清潔感の科学として扱う。
ALTER TABLE orders ADD COLUMN product_id TEXT NOT NULL DEFAULT 'clean_science';
