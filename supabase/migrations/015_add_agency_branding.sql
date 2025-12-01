-- =====================================================
-- MIGRACIÓN: Añadir columna agency_branding a profiles
-- Descripción: Almacena la configuración de branding 
-- para agencias con plan Enterprise (white-label)
-- =====================================================

-- 1. Añadir columna agency_branding (JSONB)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS agency_branding JSONB DEFAULT NULL;

-- Estructura esperada del JSONB:
-- {
--   "logo_url": "https://...",
--   "logo_text": "Mi Agencia",           -- Texto opcional al lado del logo
--   "primary_color": "#22c55e",
--   "secondary_color": "#16a34a", 
--   "agency_name": "Mi Agencia",           -- Nombre interno de la agencia
--   "powered_by_text": "Powered by Mi Agencia",
--   "show_powered_by": true
-- }

-- 2. Crear bucket para logos de agencia (si no existe)
-- NOTA: Esto se debe ejecutar manualmente en Supabase Dashboard o via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('agency-logos', 'agency-logos', true)
-- ON CONFLICT (id) DO NOTHING;

-- 3. Comentario para documentación
COMMENT ON COLUMN profiles.agency_branding IS 'Configuración de branding para agencias Enterprise. Incluye logo, colores y textos personalizados.';

-- =====================================================
-- NOTAS:
-- 
-- Para crear el bucket de storage, ejecutar en Supabase:
-- 
-- 1. Ir a Storage en el dashboard
-- 2. Crear bucket "agency-logos" con acceso público
-- 3. Configurar políticas RLS:
--    - SELECT: public (para que los logos sean accesibles)
--    - INSERT/UPDATE/DELETE: solo usuarios autenticados para su propio logo
--
-- Política sugerida para INSERT:
-- CREATE POLICY "Users can upload own agency logo"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'agency-logos' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
-- =====================================================
