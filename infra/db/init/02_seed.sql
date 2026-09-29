-- 02_seed.sql

-- Insert Plans
INSERT INTO plans (id, name, max_properties, max_places, max_qr_variants) VALUES
('11111111-1111-1111-1111-111111111111', 'Enterprise', 100, 1000, 10),
('22222222-2222-2222-2222-222222222222', 'Basic', 1, 50, 3);

-- Insert Organizations (1 chain, 1 local)
INSERT INTO organizations (id, name, slug, plan, brand_primary_color) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Taj Hotels', 'taj', '11111111-1111-1111-1111-111111111111', '#B89B5E'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mysuru Local Lodge', 'mysuru-lodge', '22222222-2222-2222-2222-222222222222', '#2A4365');

-- Insert Users (1 super admin, 2 client admins)
INSERT INTO users (id, cognito_sub, email, role, organization_id) VALUES
('00000000-0000-0000-0000-000000000001', 'super-admin-sub', 'super@platform.com', 'super_admin', NULL),
('00000000-0000-0000-0000-000000000002', 'taj-admin-sub', 'admin@taj.com', 'client_admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('00000000-0000-0000-0000-000000000003', 'lodge-admin-sub', 'admin@mysurulodge.com', 'client_admin', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Insert Properties
-- Taj (Bengaluru and Mysuru)
INSERT INTO properties (id, organization_id, name, slug, tagline, address, status) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Taj West End', 'taj-west-end-blr', 'Luxury Heritage Hotel', 'Bengaluru, Karnataka', 'published'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Taj Yeshwantpur', 'taj-yeshwantpur-blr', 'Modern Luxury', 'Yeshwantpur, Bengaluru', 'published'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Taj Wayanad', 'taj-wayanad', 'Resort and Spa', 'Wayanad, Kerala', 'published');

-- Local Lodge (Mysuru)
INSERT INTO properties (id, organization_id, name, slug, tagline, address, status) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mysuru Heritage Lodge', 'mysuru-heritage-lodge', 'Affordable comfort near the Palace', 'Mysuru, Karnataka', 'published');

-- Insert Categories
INSERT INTO place_categories (id, key, label, icon_key, sort_order) VALUES
('10000000-0000-0000-0000-000000000001', 'attractions', 'Attractions', 'map-pin', 1),
('10000000-0000-0000-0000-000000000002', 'shopping', 'Shopping & Malls', 'shopping-bag', 2),
('10000000-0000-0000-0000-000000000003', 'transport', 'Transport Hubs', 'train', 3),
('10000000-0000-0000-0000-000000000004', 'hospitals', 'Hospitals', 'cross', 4),
('10000000-0000-0000-0000-000000000005', 'tech_parks', 'Tech Parks', 'building', 5);

-- Insert Places (Mysuru for Lodge)
INSERT INTO places (id, organization_id, category_id, name, address) VALUES
('55555555-5555-5555-5555-555555555551', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10000000-0000-0000-0000-000000000001', 'Mysore Palace', 'Sayyaji Rao Rd, Mysuru'),
('55555555-5555-5555-5555-555555555552', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10000000-0000-0000-0000-000000000002', 'Mall of Mysore', 'MG Road, Mysuru');

-- Property Places
INSERT INTO property_places (property_id, place_id, distance_m, duration_drive_s) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555551', 1500, 300),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555552', 3000, 600);
