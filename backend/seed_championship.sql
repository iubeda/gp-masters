-- Seed Users (Password is '123456' hashed with bcrypt)
INSERT INTO users (email, username, password_hash, role, created_at) VALUES
('admin@motogp.com', 'admin', '$2a$10$CPKZBLmK.fFR9QAO5p3D7uSHefNIzf8f0erNIlMlD0ljp0pHHfPAy', 'admin', CURRENT_TIMESTAMP),
('test@test.com', 'test1', '$2a$10$CPKZBLmK.fFR9QAO5p3D7uSHefNIzf8f0erNIlMlD0ljp0pHHfPAy', 'master', CURRENT_TIMESTAMP),
('test2@test.com', 'test2', '$2a$10$CPKZBLmK.fFR9QAO5p3D7uSHefNIzf8f0erNIlMlD0ljp0pHHfPAy', 'player', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Seed Championship "MotoMasters"
-- start_date is set to '2026-06-22' so that if today is '2026-07-04', 
-- Race 1, 2, and 3 have passed and Race 4 ('2026-07-06') is the next upcoming race.
INSERT INTO championships (name, season, start_date, created_by, time_restricted, max_circuits, max_teams) VALUES
('MotoMasters', 2026, '2026-06-22', 'test@test.com', false, 8, 5);

-- Seed Championship Circuits (map 8 circuits to championship id=1)
INSERT INTO championship_circuits (championship_id, circuit_id, "order") VALUES
(1, 1, 1),
(1, 2, 2),
(1, 4, 3),
(1, 5, 4),
(1, 7, 5),
(1, 8, 6),
(1, 11, 7),
(1, 15, 8);

-- Optionally, seed a team to have some active participant
INSERT INTO teams (name, user_email, championship_id, pilot_id, motorcycle_id, balance) VALUES
('Test Team Alpha', 'test2@test.com', 1, 1, 1, 100000),
('Test Team Beta', 'test@test.com', 1, 2, 2, 100000);

-- Seed Championship "MotoMasters Private"
-- start_date is set to '2026-06-22' so that if today is '2026-07-04', 
-- Race 1, 2, and 3 have passed and Race 4 ('2026-07-06') is the next upcoming race.
INSERT INTO championships (name, season, start_date, created_by, is_public, pin, time_restricted, max_circuits, max_teams) VALUES
('MotoMasters Private', 2026, '2026-06-22', 'test@test.com', false, '1111', false, 8, 5);

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
('Test Team Alpha Private', 'test2@test.com', 2, 4, 4, 100000),
('Test Team Beta Private', 'test@test.com', 2, 5, 5, 100000);