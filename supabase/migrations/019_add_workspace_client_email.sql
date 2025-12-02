-- =====================================================
-- MIGRACIÓN: Añadir email del cliente al workspace
-- Descripción: Permite configurar un email de contacto
-- del cliente para recibir notificaciones del workspace
-- =====================================================

-- 1. Añadir columna client_email a workspaces
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS client_email TEXT DEFAULT NULL;

-- 2. Añadir columna client_name para personalizar notificaciones
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT NULL;

-- 3. Añadir configuración de notificaciones del cliente
-- Permite controlar qué notificaciones recibe el cliente
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS client_notifications JSONB DEFAULT '{"whatsapp_connected": true, "whatsapp_disconnected": true, "daily_summary": false}'::jsonb;

-- 4. Comentarios para documentación
COMMENT ON COLUMN workspaces.client_email IS 'Email del cliente final del workspace. Recibe notificaciones según client_notifications.';
COMMENT ON COLUMN workspaces.client_name IS 'Nombre del cliente para personalizar las notificaciones.';
COMMENT ON COLUMN workspaces.client_notifications IS 'Configuración de qué notificaciones recibe el cliente: whatsapp_connected, whatsapp_disconnected, daily_summary.';

-- =====================================================
-- NOTAS:
-- 
-- Estructura de client_notifications:
-- {
--   "whatsapp_connected": true,      -- Notificar cuando WhatsApp se conecta
--   "whatsapp_disconnected": true,   -- Notificar cuando WhatsApp se desconecta
--   "daily_summary": false           -- Resumen diario de actividad (futuro)
-- }
--
-- El owner siempre recibe todas las notificaciones.
-- El cliente solo recibe las que tenga habilitadas.
-- =====================================================
