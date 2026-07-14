-- Seed Users (Password is '123456' hashed with bcrypt)
INSERT INTO users (email, username, password_hash, role, created_at) VALUES
('admin@test.com', 'admin', '$2a$10$CPKZBLmK.fFR9QAO5p3D7uSHefNIzf8f0erNIlMlD0ljp0pHHfPAy', 'admin', CURRENT_TIMESTAMP),
('master@test.com', 'testMaster', '$2a$10$CPKZBLmK.fFR9QAO5p3D7uSHefNIzf8f0erNIlMlD0ljp0pHHfPAy', 'master', CURRENT_TIMESTAMP),
('player@test.com', 'testPlayer', '$2a$10$CPKZBLmK.fFR9QAO5p3D7uSHefNIzf8f0erNIlMlD0ljp0pHHfPAy', 'player', CURRENT_TIMESTAMP)
('player2@test.com', 'testPlayer2', '$2a$10$CPKZBLmK.fFR9QAO5p3D7uSHefNIzf8f0erNIlMlD0ljp0pHHfPAy', 'player', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Seed Championship "MotoMasters"
-- start_date is set to '2026-07-15 '.
INSERT INTO championships (name, season, start_date, created_by, time_restricted, max_circuits, max_teams) VALUES
('MotoMasters', 2026, '2026-07-15', 'admin@test.com', false, 10, 5);

-- Seed Championship Circuits (map 10 circuits to championship id=1)
INSERT INTO championship_circuits (championship_id, circuit_id, "order") VALUES
(1, 1, 1),
(1, 2, 2),
(1, 4, 3),
(1, 5, 4),
(1, 7, 5),
(1, 8, 6),
(1, 11, 7),
(1, 15, 8),
(1, 16, 9),
(1, 17, 10);

-- Optionally, seed a team to have some active participant
INSERT INTO teams (name, user_email, championship_id, pilot_id, motorcycle_id, balance) VALUES
('Test Team Alpha', 'player@test.com', 1, 1, 1, 100000),
('Test Team Beta', 'admin@test.com', 1, 2, 2, 100000),
('Test Team P2', 'player2@test.com', 1, 3, 3, 100000);

-- Seed Championship "MotoMasters Private"
-- start_date is set to '2026-07-15'
INSERT INTO championships (name, season, start_date, created_by, is_public, pin, time_restricted, max_circuits, max_teams) VALUES
('MotoMasters Private', 2026, '2026-07-15', 'admin@test.com', false, '96c6ebbf910f2cb6928d71409a29979c:da6bf8d79af0530ebce9da0cebc69ce6', false, 8, 5);

-- Seed Championship Circuits (map 8 circuits to championship id=1)
INSERT INTO championship_circuits (championship_id, circuit_id, "order") VALUES
(2, 1, 1),
(2, 2, 2),
(2, 4, 3),
(2, 5, 4),
(2, 7, 5),
(2, 8, 6),
(2, 11, 7),
(2, 15, 8);

-- Optionally, seed a team to have some active participant
INSERT INTO teams (name, user_email, championship_id, pilot_id, motorcycle_id, balance) VALUES
('Test Team Alpha Private', 'player@test.com', 2, 4, 4, 100000),
('Test Team Beta Private', 'admin@test.com', 2, 5, 5, 100000),
('Test Team P2 Private', 'player2@test.com', 2, 6, 6, 100000);