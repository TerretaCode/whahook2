-- =====================================================
-- MIGRACIÓN: Añadir configuración SMTP personalizada
-- Descripción: Permite a agencias Enterprise configurar
-- su propio servidor SMTP para enviar emails con su marca
-- =====================================================

-- 1. Añadir columna smtp_config a profiles (JSONB encriptado en app)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS smtp_config JSONB DEFAULT NULL;

-- Estructura esperada del JSONB:
-- {
--   "enabled": true,
--   "host": "smtp.example.com",
--   "port": 587,
--   "secure": false,              -- true para puerto 465 (SSL)
--   "auth_user": "user@example.com",
--   "auth_pass": "encrypted_password",  -- Encriptado con AES-256
--   "from_email": "noreply@example.com",
--   "from_name": "Mi Agencia",
--   "reply_to": "support@example.com"   -- Opcional
-- }

-- 2. Comentario para documentación
COMMENT ON COLUMN profiles.smtp_config IS 'Configuración SMTP personalizada para agencias Enterprise. Las credenciales se encriptan en la aplicación antes de guardar.';

-- =====================================================
-- NOTAS DE SEGURIDAD:
-- 
-- 1. Las credenciales SMTP (auth_pass) DEBEN encriptarse
--    en el backend antes de guardar en la base de datos
--    usando AES-256-GCM con una clave de entorno
--
-- 2. La clave de encriptación debe estar en variables
--    de entorno del backend (SMTP_ENCRYPTION_KEY)
--
-- 3. Nunca exponer smtp_config completo al frontend,
--    solo campos no sensibles (host, port, from_email)
--
-- 4. Validar conexión SMTP antes de guardar config
-- =====================================================

-- 3. Índice para búsquedas de agencias con SMTP configurado
CREATE INDEX IF NOT EXISTS idx_profiles_smtp_enabled 
ON profiles ((smtp_config->>'enabled')) 
WHERE smtp_config IS NOT NULL;
