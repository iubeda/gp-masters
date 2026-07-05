-- Drop existing tables (to apply modifications cleanly)
DROP TABLE IF EXISTS gp_lap_history CASCADE;
DROP TABLE IF EXISTS gp_team_status CASCADE;
DROP TABLE IF EXISTS race_weekends CASCADE;
DROP TABLE IF EXISTS championship_circuits CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS circuits CASCADE;
DROP TABLE IF EXISTS pilots CASCADE;
DROP TABLE IF EXISTS motorcycles CASCADE;
DROP TABLE IF EXISTS championships CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('admin', 'master', 'manager', 'player')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_username_lower ON users (LOWER(username));

-- Motorcycles table
CREATE TABLE motorcycles (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    engine INT NOT NULL CHECK (engine >= 0 AND engine <= 100),
    gearbox INT NOT NULL CHECK (gearbox >= 0 AND gearbox <= 100),
    suspension INT NOT NULL CHECK (suspension >= 0 AND suspension <= 100),
    chassis INT NOT NULL CHECK (chassis >= 0 AND chassis <= 100),
    wings INT NOT NULL CHECK (wings >= 0 AND wings <= 100)
);

-- Championships table
CREATE TABLE championships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    season INT NOT NULL,
    start_date DATE NOT NULL,
    created_by VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    pin VARCHAR(10) DEFAULT NULL
);

-- Pilots table
CREATE TABLE pilots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    talent INT NOT NULL CHECK (talent >= 0 AND talent <= 100),
    consistency INT NOT NULL CHECK (consistency >= 0 AND consistency <= 100),
    aggressiveness INT NOT NULL CHECK (aggressiveness >= 0 AND aggressiveness <= 100),
    experience INT NOT NULL CHECK (experience >= 0 AND experience <= 100),
    fitness INT NOT NULL CHECK (fitness >= 0 AND fitness <= 100)
);

-- Circuits table
CREATE TABLE circuits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    distance INT NOT NULL, -- Longitud
    curves_right INT NOT NULL CHECK (curves_right >= 0), -- Curvas a derechas
    curves_left INT NOT NULL CHECK (curves_left >= 0), -- Curvas a izquierdas
    curves_rects_ratio DECIMAL(4,2) NOT NULL CHECK (curves_rects_ratio >= 0), -- Ratio curvas/rectas
    asphalt_wear INT NOT NULL CHECK (asphalt_wear >= 0 AND asphalt_wear <= 100) -- Desgaste del asfalto
);

-- Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    championship_id INT REFERENCES championships(id) ON DELETE CASCADE,
    pilot_id INT REFERENCES pilots(id) ON DELETE CASCADE,
    motorcycle_id INT REFERENCES motorcycles(id) ON DELETE CASCADE,
    balance INT DEFAULT 100000, -- Added financial balance
    is_kicked BOOLEAN DEFAULT FALSE,
    kick_reason TEXT DEFAULT NULL,
    CONSTRAINT unique_user_championship UNIQUE (user_email, championship_id),
    CONSTRAINT unique_championship_pilot UNIQUE (championship_id, pilot_id)
);

CREATE UNIQUE INDEX idx_teams_name_championship_lower ON teams (championship_id, LOWER(name));

-- Championship Circuits table
CREATE TABLE championship_circuits (
    championship_id INT REFERENCES championships(id) ON DELETE CASCADE,
    circuit_id INT REFERENCES circuits(id) ON DELETE CASCADE,
    "order" INT NOT NULL,
    PRIMARY KEY (championship_id, circuit_id)
);

-- Seed Predefined Motorcycles catalog
INSERT INTO motorcycles (model_name, engine, gearbox, suspension, chassis, wings) VALUES
('Ducati Desmosedici GP24', 99, 95, 92, 94, 98),
('KTM RC16 Factory', 96, 93, 94, 92, 94),
('Aprilia RS-GP24 Factory', 93, 92, 93, 96, 95),
('Yamaha YZR-M1 Factory', 89, 94, 96, 97, 86),
('Honda RC213V Factory', 91, 89, 90, 86, 88),
('Ducati Desmosedici GP23 (Gresini)', 95, 93, 90, 91, 92),
('KTM RC16 (GasGas Tech3)', 92, 91, 92, 90, 90),
('Aprilia RS-GP23 (Trackhouse)', 91, 90, 91, 93, 90),
('Yamaha YZR-M1 (LCR satellite)', 87, 91, 93, 94, 83),
('Honda RC213V (LCR satellite)', 89, 87, 87, 84, 85);

-- Seed Pilots
INSERT INTO pilots (name, talent, consistency, aggressiveness, experience, fitness) VALUES 
('Marc Marquez', 95, 88, 92, 95, 90),
('Francesco Bagnaia', 94, 92, 80, 85, 92),
('Jorge Martin', 93, 85, 95, 80, 94),
('Fabio Quartararo', 91, 89, 78, 82, 88),
('Brad Binder', 88, 86, 90, 84, 95),
('Enea Bastianini', 90, 85, 82, 78, 90),
('Aleix Espargaro', 85, 82, 75, 96, 85),
('Maverick Viñales', 88, 75, 80, 86, 88),
('Pedro Acosta', 92, 80, 88, 50, 92),
('Marco Bezzecchi', 87, 83, 85, 75, 88),
('Alex Marquez', 84, 82, 78, 78, 85),
('Fabio Di Giannantonio', 83, 84, 76, 70, 84),
('Franco Morbidelli', 82, 78, 75, 80, 82),
('Jack Miller', 82, 70, 84, 82, 83),
('Miguel Oliveira', 83, 80, 75, 82, 80),
('Raul Fernandez', 80, 78, 76, 65, 82),
('Augusto Fernandez', 78, 78, 72, 60, 80),
('Johann Zarco', 84, 82, 70, 90, 84),
('Joan Mir', 82, 75, 75, 82, 80),
('Luca Marini', 80, 85, 68, 75, 82);

-- Seed Circuits
INSERT INTO circuits (name, distance, curves_right, curves_left, curves_rects_ratio, asphalt_wear) VALUES
('Jerez - Angel Nieto', 4423, 8, 5, 1.20, 75),
('Mugello Circuit', 5245, 9, 6, 1.40, 60),
('Silverstone Circuit', 5900, 10, 8, 1.05, 80),
('Circuit de Barcelona-Catalunya', 4657, 8, 6, 1.30, 85),
('Assen TT Circuit', 4542, 12, 6, 1.80, 50),
('Sachsenring', 3671, 3, 10, 2.20, 90),
('Red Bull Ring', 4318, 7, 3, 0.85, 65),
('Misano World Circuit', 4226, 10, 6, 1.50, 70),
('Twin Ring Motegi', 4800, 8, 6, 1.10, 75),
('Phillip Island', 4448, 5, 7, 1.25, 85),
('Sepang International Circuit', 5543, 10, 5, 0.95, 80),
('Circuit of the Americas', 5513, 9, 11, 1.15, 95),
('Lusail International Circuit', 5380, 10, 6, 1.05, 65),
('Autodromo Termas de Rio Hondo', 4806, 9, 5, 1.20, 70),
('Algarve International Circuit', 4592, 9, 6, 1.35, 75),
('Valencia Ricardo Tormo', 4005, 5, 9, 1.60, 80),
('MotorLand Aragon', 5078, 10, 7, 1.25, 70);



-- Table of race weekends (weather and state of simulation)
CREATE TABLE race_weekends (
    id SERIAL PRIMARY KEY,
    championship_id INT REFERENCES championships(id) ON DELETE CASCADE,
    circuit_id INT REFERENCES circuits(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed'
    weather_condition VARCHAR(20) NOT NULL DEFAULT 'sunny', -- 'sunny', 'cloudy', 'rainy'
    rain_percentage INT DEFAULT 0, -- 0 to 100
    temp_ambient INT DEFAULT 25,
    temp_asphalt INT DEFAULT 30,
    CONSTRAINT unique_champ_circuit_weekend UNIQUE (championship_id, circuit_id)
);

-- Table of participation and status for each team in the Gran Premio
CREATE TABLE gp_team_status (
    championship_id INT REFERENCES championships(id) ON DELETE CASCADE,
    circuit_id INT REFERENCES circuits(id) ON DELETE CASCADE,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Practice
    practice_laps_used INT DEFAULT 0,
    best_practice_time DECIMAL(8,3) DEFAULT NULL,
    
    -- Qualifying
    qualifying_laps_used INT DEFAULT 0,
    best_qualifying_time DECIMAL(8,3) DEFAULT NULL,
    
    -- Saved Race Setup / Strategy
    race_tire_type VARCHAR(20) DEFAULT 'medium',
    race_pilot_focus VARCHAR(20) DEFAULT 'balanced',
    race_setup_engine INT DEFAULT 0,
    race_setup_gearbox INT DEFAULT 0,
    race_setup_suspension INT DEFAULT 0,
    race_setup_chassis INT DEFAULT 0,
    race_setup_wings INT DEFAULT 0,
    
    -- Race results
    grid_position INT DEFAULT NULL,
    finishing_position INT DEFAULT NULL,
    race_time DECIMAL(10,3) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'not_started', -- 'finished', 'DNF_crash', 'dns'
    earnings INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    
    PRIMARY KEY (championship_id, circuit_id, team_id)
);

-- Table of lap history for telemetry and feedback
CREATE TABLE gp_lap_history (
    id SERIAL PRIMARY KEY,
    championship_id INT,
    circuit_id INT,
    team_id INT,
    session_type VARCHAR(15), -- 'practice', 'qualifying', 'race'
    stint_number INT DEFAULT 1,
    lap_number INT,
    lap_time DECIMAL(8,3),
    tire_wear_pct DECIMAL(5,2),
    has_crashed BOOLEAN DEFAULT FALSE,
    feedback_received TEXT,
    
    -- Strategy used in this lap/stint
    tire_type VARCHAR(20),
    pilot_focus VARCHAR(20),
    setup_engine INT,
    setup_gearbox INT,
    setup_suspension INT,
    setup_chassis INT,
    setup_wings INT
);
