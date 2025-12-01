-- =====================================================
-- MIGRACIÓN: Añadir dominio personalizado para agencias
-- Descripción: Permite a las agencias Enterprise usar
-- su propio dominio (ej: panel.miagencia.com)
-- =====================================================

-- 1. Añadir columnas de dominio personalizado a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;

-- 2. Crear índice para búsquedas rápidas por dominio
CREATE INDEX IF NOT EXISTS idx_profiles_custom_domain 
ON profiles(custom_domain) 
WHERE custom_domain IS NOT NULL;

-- 3. Comentarios para documentación
COMMENT ON COLUMN profiles.custom_domain IS 'Dominio personalizado de la agencia (ej: panel.miagencia.com)';
COMMENT ON COLUMN profiles.custom_domain_verified IS 'Si el dominio ha sido verificado y está activo';

-- =====================================================
-- NOTAS:
-- 
-- Flujo de configuración:
-- 1. Agencia introduce dominio en Settings > Branding
-- 2. Sistema muestra instrucciones DNS (CNAME → cname.vercel-dns.com)
-- 3. Agencia configura DNS en su proveedor
-- 4. Agencia pulsa "Verificar"
-- 5. Backend verifica DNS y añade dominio a Vercel via API
-- 6. Vercel genera certificado SSL automáticamente
-- 7. Dominio activo
--
-- El middleware de Next.js detecta el dominio y carga
-- el branding correspondiente.
-- =====================================================
