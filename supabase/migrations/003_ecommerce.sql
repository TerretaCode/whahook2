-- ==============================================
-- MIGRACIÓN: 003_ecommerce
-- Sistema de conexiones E-commerce
-- Soporta: WooCommerce, Shopify, PrestaShop, Magento
-- ==============================================

-- Tabla principal de conexiones
CREATE TABLE IF NOT EXISTS ecommerce_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('woocommerce', 'shopify', 'prestashop', 'magento')),
  store_url TEXT NOT NULL,
  
  -- Credenciales (JSON encriptado en aplicación)
  credentials JSONB NOT NULL,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Configuración de sincronización
  sync_config JSONB DEFAULT '{
    "auto_sync": true,
    "sync_interval_minutes": 60,
    "sync_products": true,
    "sync_orders": true
  }'::jsonb,
  
  -- Webhooks
  webhook_secret TEXT,
  webhook_enabled BOOLEAN DEFAULT false,
  
  -- Metadata de la tienda
  store_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logs de sincronización
CREATE TABLE IF NOT EXISTS ecommerce_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ecommerce_connections(id) ON DELETE CASCADE,
  
  sync_type VARCHAR(50) NOT NULL, -- 'products', 'orders', 'full'
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  
  -- Estadísticas
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  -- Tiempo
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Detalles
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache de productos
CREATE TABLE IF NOT EXISTS ecommerce_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ecommerce_connections(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  
  -- Información del producto
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(255),
  
  -- Precios
  price DECIMAL(10, 2),
  regular_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'EUR',
  
  -- Stock
  stock_quantity INTEGER,
  stock_status VARCHAR(50),
  manage_stock BOOLEAN DEFAULT false,
  
  -- Categorías e imágenes
  categories JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  featured_image TEXT,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'publish',
  
  -- Datos originales
  raw_data JSONB DEFAULT '{}'::jsonb,
  
  -- Sincronización
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(connection_id, external_id)
);

-- Cache de pedidos
CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ecommerce_connections(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  
  -- Información del pedido
  order_number VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  
  -- Cliente
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Totales
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2),
  tax_total DECIMAL(10, 2),
  shipping_total DECIMAL(10, 2),
  discount_total DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'EUR',
  
  -- Fechas
  order_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Direcciones
  shipping_address JSONB DEFAULT '{}'::jsonb,
  billing_address JSONB DEFAULT '{}'::jsonb,
  
  -- Items
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- Datos originales
  raw_data JSONB DEFAULT '{}'::jsonb,
  
  -- Sincronización
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(connection_id, external_id)
);

-- ==============================================
-- ÍNDICES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_user ON ecommerce_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_platform ON ecommerce_connections(platform);
CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_status ON ecommerce_connections(status);

CREATE INDEX IF NOT EXISTS idx_ecommerce_sync_logs_connection ON ecommerce_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_sync_logs_status ON ecommerce_sync_logs(status);

CREATE INDEX IF NOT EXISTS idx_ecommerce_products_connection ON ecommerce_products(connection_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_sku ON ecommerce_products(sku);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_name ON ecommerce_products USING gin(to_tsvector('spanish', name));

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_connection ON ecommerce_orders(connection_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status ON ecommerce_orders(status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_date ON ecommerce_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_customer ON ecommerce_orders(customer_email);

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================
ALTER TABLE ecommerce_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;

-- Políticas para connections
DROP POLICY IF EXISTS "Users can manage own connections" ON ecommerce_connections;
CREATE POLICY "Users can manage own connections" ON ecommerce_connections
  FOR ALL USING (auth.uid() = user_id);

-- Service role acceso completo
DROP POLICY IF EXISTS "Service role full access connections" ON ecommerce_connections;
CREATE POLICY "Service role full access connections" ON ecommerce_connections
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access sync_logs" ON ecommerce_sync_logs;
CREATE POLICY "Service role full access sync_logs" ON ecommerce_sync_logs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access products" ON ecommerce_products;
CREATE POLICY "Service role full access products" ON ecommerce_products
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access orders" ON ecommerce_orders;
CREATE POLICY "Service role full access orders" ON ecommerce_orders
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- TRIGGERS
-- ==============================================
CREATE OR REPLACE FUNCTION update_ecommerce_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_connections_updated ON ecommerce_connections;
CREATE TRIGGER trigger_ecommerce_connections_updated
  BEFORE UPDATE ON ecommerce_connections
  FOR EACH ROW EXECUTE FUNCTION update_ecommerce_timestamp();

DROP TRIGGER IF EXISTS trigger_ecommerce_products_updated ON ecommerce_products;
CREATE TRIGGER trigger_ecommerce_products_updated
  BEFORE UPDATE ON ecommerce_products
  FOR EACH ROW EXECUTE FUNCTION update_ecommerce_timestamp();

DROP TRIGGER IF EXISTS trigger_ecommerce_orders_updated ON ecommerce_orders;
CREATE TRIGGER trigger_ecommerce_orders_updated
  BEFORE UPDATE ON ecommerce_orders
  FOR EACH ROW EXECUTE FUNCTION update_ecommerce_timestamp();
