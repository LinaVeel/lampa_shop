CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);

CREATE OR REPLACE FUNCTION products_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_tsvector_update ON products;
CREATE TRIGGER trg_products_tsvector_update
BEFORE INSERT OR UPDATE OF name, description
ON products
FOR EACH ROW
EXECUTE FUNCTION products_tsvector_update();

CREATE OR REPLACE FUNCTION touch_products_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_touch_updated_at ON products;
CREATE TRIGGER trg_products_touch_updated_at
BEFORE UPDATE
ON products
FOR EACH ROW
EXECUTE FUNCTION touch_products_updated_at();

INSERT INTO categories (name, slug)
VALUES
  ('Дом и офис', 'home-office'),
  ('Кухня', 'kitchen'),
  ('Декор', 'decor'),
  ('Умный свет', 'smart-light')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, price, stock_quantity, is_active)
SELECT c.id, s.name, s.slug, s.description, s.price, s.stock_quantity, s.is_active
FROM (
  VALUES
    ('home-office', 'A60 LED', 'a60-led', 'Теплая лампа для повседневного света', 79.00, 50, TRUE),
    ('home-office', 'Filament Vintage', 'filament-vintage', 'Лампа с ретро-нитью накаливания', 109.00, 30, TRUE),
    ('kitchen', 'Kitchen Daylight', 'kitchen-daylight', 'Яркий холодный свет для кухни', 89.00, 40, TRUE),
    ('kitchen', 'Kitchen Linear', 'kitchen-linear', 'Линейная лампа для рабочей зоны', 149.00, 20, TRUE),
    ('decor', 'Decor Globe', 'decor-globe', 'Декоративная лампа с мягким свечением', 129.00, 25, TRUE),
    ('smart-light', 'Smart Color', 'smart-color', 'Умная лампа с управлением цветом', 199.00, 18, TRUE)
) AS s(category_slug, name, slug, description, price, stock_quantity, is_active)
JOIN categories c ON c.slug = s.category_slug
ON CONFLICT (slug) DO NOTHING;
