-- =====================================================
-- MIGRACIÓN: Añadir campos favicon y tab_title al branding
-- Descripción: Extiende agency_branding con favicon y 
-- título de pestaña para dominios personalizados
-- =====================================================

-- La columna agency_branding ya existe como JSONB
-- Solo actualizamos la documentación de la estructura esperada

-- Estructura actualizada del JSONB agency_branding:
-- {
--   "logo_url": "https://...",              -- Logo principal (header, login)
--   "logo_text": "Mi Agencia",              -- Texto opcional al lado del logo
--   "favicon_url": "https://...",           -- Favicon para la pestaña del navegador
--   "tab_title": "Mi Agencia",              -- Título de la pestaña del navegador
--   "primary_color": "#22c55e",
--   "secondary_color": "#16a34a", 
--   "agency_name": "Mi Agencia",            -- Nombre interno de la agencia
--   "powered_by_text": "Powered by Mi Agencia",
--   "show_powered_by": true
-- }

-- Actualizar comentario
COMMENT ON COLUMN profiles.agency_branding IS 'Configuración de branding para agencias Enterprise. Incluye logo, favicon, colores, título de pestaña y textos personalizados para white-label completo.';

-- =====================================================
-- NOTAS:
-- 
-- Los nuevos campos son:
-- - favicon_url: URL del favicon (idealmente .ico, .png o .svg de 32x32 o 16x16)
-- - tab_title: Texto que aparece en la pestaña del navegador
--
-- Estos campos se usan cuando un cliente accede via dominio personalizado
-- para mostrar la marca de la agencia en lugar de WhaHook.
-- =====================================================
