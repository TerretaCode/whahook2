-- =====================================================
-- MIGRACIÓN: Añadir agency_slug para portal de agencia
-- Descripción: Permite a las agencias tener una URL 
-- personalizada para que sus clientes accedan al panel
-- Ejemplo: https://app.whahook.com/a/miagencia
-- =====================================================

-- 1. Añadir columna agency_slug (único por agencia)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS agency_slug TEXT UNIQUE;

-- 2. Crear índice para búsquedas rápidas por slug
CREATE INDEX IF NOT EXISTS idx_profiles_agency_slug 
ON profiles(agency_slug) 
WHERE agency_slug IS NOT NULL;

-- 3. Comentario para documentación
COMMENT ON COLUMN profiles.agency_slug IS 'URL slug único para el portal de la agencia. Usado en /a/{slug} para acceso con branding personalizado.';

-- =====================================================
-- NOTAS:
-- 
-- El agency_slug permite:
-- - Login con branding de la agencia: /a/{slug}/login
-- - Forgot password: /a/{slug}/forgot-password
-- - Change password: /a/{slug}/change-password
-- - NO incluye registro (los clientes son invitados)
--
-- Validación del slug (en el backend):
-- - Solo letras minúsculas, números y guiones
-- - Mínimo 3 caracteres, máximo 50
-- - No puede empezar ni terminar con guión
-- - No puede contener guiones consecutivos
-- =====================================================
