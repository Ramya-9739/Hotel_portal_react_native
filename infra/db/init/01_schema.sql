-- 01_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define roles for the application
-- We will assume the API connects as 'api_user'.
-- We can set the tenant context in the transaction:
-- SET LOCAL app.current_tenant = 'org-uuid';
-- SET LOCAL app.current_role = 'client_admin'; -- or 'super_admin', 'guest'

-- Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    max_properties INT NOT NULL,
    max_places INT NOT NULL,
    max_qr_variants INT NOT NULL
);

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan UUID REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'active',
    brand_primary_color VARCHAR(50) DEFAULT '#0F5C5C',
    logo_key VARCHAR(1024)
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'client_admin')),
    organization_id UUID REFERENCES organizations(id) -- Nullable for super admin
);

-- Properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    show_wifi BOOLEAN DEFAULT false,
    cover_key VARCHAR(1024),
    gallery_keys TEXT[],
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published'))
);

-- Place Categories
CREATE TABLE place_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    icon_key VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0
);

-- Places
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES place_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    phone VARCHAR(50),
    website VARCHAR(255),
    google_place_id VARCHAR(255),
    hours JSONB,
    image_keys TEXT[],
    tags TEXT[]
);

-- Property Places (many-to-many with distances)
CREATE TABLE property_places (
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    distance_m INT,
    duration_walk_s INT,
    duration_drive_s INT,
    computed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (property_id, place_id)
);

-- QR Codes
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    style JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan Events
CREATE TABLE scan_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_type VARCHAR(50),
    language VARCHAR(50)
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(255) NOT NULL,
    target_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-------------------------------------------------------------------------------

-- Enable RLS on all tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current role and tenant from transaction config
CREATE OR REPLACE FUNCTION current_app_role() RETURNS text AS $$
  SELECT current_setting('app.current_role', true);
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_app_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- 1. Organizations
CREATE POLICY org_super_admin ON organizations
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY org_client_admin ON organizations
  FOR SELECT USING (current_app_role() = 'client_admin' AND id = current_app_tenant());

CREATE POLICY org_guest ON organizations
  FOR SELECT USING (current_app_role() = 'guest'); -- guest accesses public properties, but may need org brand colors

-- 2. Users
CREATE POLICY users_super_admin ON users
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY users_client_admin ON users
  FOR SELECT USING (current_app_role() = 'client_admin' AND organization_id = current_app_tenant());

-- 3. Properties
CREATE POLICY properties_super_admin ON properties
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY properties_client_admin ON properties
  FOR ALL USING (current_app_role() = 'client_admin' AND organization_id = current_app_tenant());

CREATE POLICY properties_guest ON properties
  FOR SELECT USING (current_app_role() = 'guest' AND status = 'published');

-- 4. Places
CREATE POLICY places_super_admin ON places
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY places_client_admin ON places
  FOR ALL USING (current_app_role() = 'client_admin' AND organization_id = current_app_tenant());

CREATE POLICY places_guest ON places
  FOR SELECT USING (
    current_app_role() = 'guest' AND 
    organization_id IN (SELECT organization_id FROM properties WHERE status = 'published')
  );

-- 5. Property_places
CREATE POLICY prop_places_super_admin ON property_places
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY prop_places_client_admin ON property_places
  FOR ALL USING (
    current_app_role() = 'client_admin' AND 
    property_id IN (SELECT id FROM properties WHERE organization_id = current_app_tenant())
  );

CREATE POLICY prop_places_guest ON property_places
  FOR SELECT USING (
    current_app_role() = 'guest' AND
    property_id IN (SELECT id FROM properties WHERE status = 'published')
  );

-- 6. QR Codes
CREATE POLICY qr_super_admin ON qr_codes
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY qr_client_admin ON qr_codes
  FOR ALL USING (
    current_app_role() = 'client_admin' AND 
    property_id IN (SELECT id FROM properties WHERE organization_id = current_app_tenant())
  );

-- 7. Scan Events
CREATE POLICY scan_super_admin ON scan_events
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY scan_client_admin ON scan_events
  FOR SELECT USING (
    current_app_role() = 'client_admin' AND 
    property_id IN (SELECT id FROM properties WHERE organization_id = current_app_tenant())
  );

CREATE POLICY scan_guest_insert ON scan_events
  FOR INSERT WITH CHECK (current_app_role() = 'guest'); -- guest can insert scan events

-- 8. Audit Log
CREATE POLICY audit_super_admin ON audit_log
  FOR ALL USING (current_app_role() = 'super_admin');

CREATE POLICY audit_client_admin ON audit_log
  FOR SELECT USING (current_app_role() = 'client_admin' AND organization_id = current_app_tenant());

-- Create a specific DB user for the API and grant access
-- (Assuming we will run init scripts as a superuser to set up the DB, but then use this user)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'api_user') THEN
      CREATE ROLE api_user LOGIN PASSWORD 'api_pass';
   END IF;
END
$do$;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO api_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO api_user;

-- Ensure RLS is enforced even for api_user, since it's not a superuser
