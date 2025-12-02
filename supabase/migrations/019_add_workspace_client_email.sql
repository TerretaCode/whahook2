-- =====================================================
-- MIGRACIÓN: Configuración de notificaciones para miembros del workspace
-- Descripción: Los emails de notificación se envían a los miembros
-- invitados al workspace según su rol (usando invited_email de workspace_members)
-- =====================================================

-- Añadir configuración de notificaciones a workspace_members
-- Permite controlar qué notificaciones recibe cada miembro
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{"whatsapp_connected": true, "whatsapp_disconnected": true}'::jsonb;

COMMENT ON COLUMN workspace_members.notifications IS 'Configuración de notificaciones para este miembro: whatsapp_connected, whatsapp_disconnected.';

-- =====================================================
-- NOTAS:
-- 
-- Las notificaciones se envían usando el campo invited_email 
-- de workspace_members. No es necesario un campo separado.
--
-- El owner siempre recibe todas las notificaciones.
-- Los miembros invitados reciben según su configuración.
-- =====================================================
