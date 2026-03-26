-- ============================================
-- Data-Clientes: Schema SQL
-- Dashboard Meta Ads para Clientes
-- ============================================

-- Tabla de admin users (para marcar quién es admin)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes vinculados a auth.users
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contactos/emails adicionales del cliente
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cuentas de Meta Ads asignadas por admin
CREATE TABLE meta_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  meta_account_id TEXT NOT NULL,
  meta_account_name TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Presupuestos definidos por admin
CREATE TABLE campaign_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id TEXT NOT NULL,
  campaign_id TEXT,
  adset_id TEXT,
  budget_amount DECIMAL(12,2) NOT NULL,
  budget_period TEXT DEFAULT 'monthly',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cache de datos de Meta
CREATE TABLE campaign_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id TEXT NOT NULL,
  cache_type TEXT NOT NULL DEFAULT 'campaigns',
  campaign_id TEXT,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Glosario de métricas
CREATE TABLE metric_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_glossary ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = uid);
$$ LANGUAGE sql SECURITY DEFINER;

-- Admins: solo admins ven/modifican
CREATE POLICY "admins_select" ON admins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins_all" ON admins FOR ALL USING (is_admin(auth.uid()));

-- Clients: admin ve todos, cliente ve solo el suyo
CREATE POLICY "clients_admin" ON clients FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "clients_own" ON clients FOR SELECT USING (user_id = auth.uid());

-- Client contacts: admin ve todos, cliente ve sus contactos
CREATE POLICY "contacts_admin" ON client_contacts FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "contacts_client" ON client_contacts FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Meta accounts: admin ve todos, cliente ve las suyas
CREATE POLICY "meta_admin" ON meta_accounts FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "meta_client" ON meta_accounts FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Campaign budgets: admin ve todos, cliente ve los de sus cuentas
CREATE POLICY "budgets_admin" ON campaign_budgets FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "budgets_client" ON campaign_budgets FOR SELECT
  USING (meta_account_id IN (
    SELECT meta_account_id FROM meta_accounts
    WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  ));

-- Campaign cache: admin ve todos, cliente ve los de sus cuentas
CREATE POLICY "cache_admin" ON campaign_cache FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "cache_client" ON campaign_cache FOR SELECT
  USING (meta_account_id IN (
    SELECT meta_account_id FROM meta_accounts
    WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  ));

-- Metric glossary: todos pueden leer, solo admin edita
CREATE POLICY "glossary_read" ON metric_glossary FOR SELECT USING (true);
CREATE POLICY "glossary_admin" ON metric_glossary FOR ALL USING (is_admin(auth.uid()));

-- ============================================
-- Storage bucket para logos
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('client-logos', 'client-logos', true);

CREATE POLICY "logos_admin_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-logos' AND is_admin(auth.uid()));
CREATE POLICY "logos_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'client-logos' AND is_admin(auth.uid()));
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'client-logos');

-- ============================================
-- Seed: Glosario de métricas por defecto
-- ============================================
INSERT INTO metric_glossary (metric_key, display_name, description, icon, category, sort_order) VALUES
('impressions', 'Impresiones', 'La cantidad de veces que tus anuncios fueron mostrados en pantalla. Cada vez que un usuario ve tu anuncio, cuenta como una impresión.', 'Eye', 'engagement', 1),
('reach', 'Alcance', 'El número de personas únicas que vieron tu anuncio. A diferencia de las impresiones, cada persona se cuenta una sola vez.', 'Users', 'engagement', 2),
('clicks', 'Clicks', 'La cantidad de veces que las personas hicieron click en tu anuncio. Incluye clicks en el enlace, imagen o botón de llamada a la acción.', 'MousePointerClick', 'engagement', 3),
('ctr', 'Tasa de Clicks (CTR)', 'El porcentaje de personas que hicieron click en tu anuncio después de verlo. Se calcula como: (Clicks / Impresiones) x 100. Un CTR alto significa que tu anuncio es atractivo y relevante.', 'Percent', 'engagement', 4),
('spend', 'Gasto Total', 'La cantidad total de dinero que se ha invertido en tus anuncios durante el período seleccionado.', 'DollarSign', 'cost', 5),
('cpc', 'Costo por Click (CPC)', 'El costo promedio que pagas cada vez que alguien hace click en tu anuncio. Se calcula como: Gasto Total / Clicks. Un CPC bajo significa que estás obteniendo clicks a buen precio.', 'BadgeDollarSign', 'cost', 6),
('cpm', 'Costo por Mil Impresiones (CPM)', 'El costo promedio por cada 1,000 veces que se muestra tu anuncio. Se calcula como: (Gasto / Impresiones) x 1,000.', 'BarChart3', 'cost', 7),
('conversions', 'Conversiones', 'La cantidad de acciones valiosas que las personas realizaron después de ver o hacer click en tu anuncio. Puede ser una compra, registro, descarga, etc.', 'Target', 'conversion', 8),
('cost_per_conversion', 'Costo por Conversión', 'El costo promedio de cada conversión. Se calcula como: Gasto Total / Conversiones. Mientras más bajo, más eficiente es tu campaña.', 'Calculator', 'conversion', 9),
('roas', 'Retorno de Inversión (ROAS)', 'El retorno sobre la inversión publicitaria. Se calcula como: Ingresos generados / Gasto en anuncios. Un ROAS de 3 significa que por cada $1 invertido, obtuviste $3 de vuelta.', 'TrendingUp', 'conversion', 10),
('frequency', 'Frecuencia', 'El número promedio de veces que cada persona vio tu anuncio. Una frecuencia muy alta puede significar que estás mostrando el anuncio demasiado a las mismas personas.', 'Repeat', 'engagement', 11),
('video_views', 'Reproducciones de Video', 'La cantidad de veces que tu video fue reproducido. Generalmente cuenta las reproducciones de al menos 3 segundos.', 'Play', 'engagement', 12);
