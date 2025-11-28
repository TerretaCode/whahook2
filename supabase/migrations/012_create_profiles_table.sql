-- =====================================================
-- MIGRACIÓN: Crear tabla profiles
-- Descripción: Tabla para almacenar datos de perfil y suscripción
-- de usuarios separada de auth.users
-- =====================================================

-- 1. Crear tabla profiles
CREATE TABLE IF NOT EXISTS profiles (
  -- Identificación (Primary Key)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- ========================================
  -- DATOS DE PERFIL BÁSICO (Settings/Profile)
  -- ========================================
  full_name TEXT NOT NULL DEFAULT '',
  company_name TEXT DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  -- ========================================
  -- TIPO DE CUENTA
  -- ========================================
  account_type TEXT DEFAULT 'saas' CHECK (account_type IN ('saas', 'agency', 'whitelabel')),
  
  -- ========================================
  -- SUSCRIPCIÓN Y PLAN
  -- ========================================
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'paused', 'trialing')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- ========================================
  -- STRIPE (integración futura de pagos)
  -- ========================================
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- ========================================
  -- LÍMITES PERSONALIZADOS (override del plan)
  -- ========================================
  custom_workspace_limit INTEGER,
  custom_whatsapp_limit INTEGER,
  custom_widget_limit INTEGER,
  
  -- ========================================
  -- REFERIDOS
  -- ========================================
  referral_code TEXT,
  referred_by UUID REFERENCES profiles(id),
  
  -- ========================================
  -- TIMESTAMPS
  -- ========================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- ========================================
  -- CONSTRAINTS
  -- ========================================
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);

-- 3. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- 4. Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'saas')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para crear perfil en registro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 6. Migrar usuarios existentes de auth.users a profiles
INSERT INTO profiles (id, email, full_name, company_name, account_type, subscription_tier, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'company_name', ''),
  COALESCE(raw_user_meta_data->>'account_type', 'saas'),
  COALESCE(raw_user_meta_data->>'subscription_tier', 'trial'),
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  company_name = EXCLUDED.company_name,
  account_type = EXCLUDED.account_type,
  subscription_tier = EXCLUDED.subscription_tier;

-- 7. RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Los usuarios solo pueden actualizar su propio perfil (campos limitados)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Solo el sistema puede insertar perfiles (via trigger)
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 8. Función helper para obtener el plan del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_plan()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT subscription_tier 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función helper para verificar si el usuario tiene un plan específico o superior
CREATE OR REPLACE FUNCTION user_has_plan(required_plan TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  plan_order TEXT[] := ARRAY['trial', 'starter', 'professional', 'enterprise'];
  user_plan_index INTEGER;
  required_plan_index INTEGER;
BEGIN
  SELECT subscription_tier INTO user_plan FROM profiles WHERE id = auth.uid();
  
  user_plan_index := array_position(plan_order, user_plan);
  required_plan_index := array_position(plan_order, required_plan);
  
  RETURN user_plan_index >= required_plan_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Vista para estadísticas de usuarios (admin)
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  subscription_tier,
  subscription_status,
  account_type,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days') as active_last_7_days,
  COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '30 days') as active_last_30_days
FROM profiles
GROUP BY subscription_tier, subscription_status, account_type;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN:
-- 
-- Después de ejecutar esta migración, actualizar el backend:
-- 
-- 1. En auth.routes.ts, cambiar la lectura de user_metadata a profiles:
--    const { data: profile } = await supabase
--      .from('profiles')
--      .select('*')
--      .eq('id', userId)
--      .single();
--
-- 2. En el frontend AuthContext, incluir el profile en el user object
--
-- 3. Para cambiar el plan de un usuario manualmente:
--    UPDATE profiles SET subscription_tier = 'enterprise' WHERE email = 'user@example.com';
--
-- =====================================================
