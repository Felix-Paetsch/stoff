CREATE TABLE animalproject (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE example_img (
    id SERIAL PRIMARY KEY,
    animal_project_id INTEGER NOT NULL,
    points TEXT NOT NULL,
    title TEXT DEFAULT '',
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_project_id) REFERENCES animalproject(id)
);

CREATE TABLE image_batch (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    img_count INTEGER DEFAULT 0,
    labeled_img_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    animal_project_id INTEGER,
    FOREIGN KEY (animal_project_id) REFERENCES animalproject(id),
    CONSTRAINT unique_img_batch_name UNIQUE (animal_project_id, name)
);

CREATE TABLE image (
    id BIGSERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    index_in_batch INTEGER NOT NULL,
    is_annotated BOOLEAN DEFAULT FALSE, -- means: fully annotated, so no point has status::unannotated --
    should_be_used BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points TEXT NOT NULL DEFAULT '{}',
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES image_batch(id)
);

CREATE TABLE point (
    id BIGSERIAL PRIMARY KEY,
    animal_project_id INTEGER NOT NULL,
    color TEXT,
    name TEXT NOT NULL,
    animal_project_point_index INTEGER DEFAULT 0,
    UNIQUE (animal_project_id, name),
    FOREIGN KEY (animal_project_id) REFERENCES animalproject(id)
);

CREATE TABLE joint (
    id BIGSERIAL PRIMARY KEY,
    point_id INTEGER NOT NULL,
    animal_project_id INTEGER NOT NULL,
    connected_point_id INTEGER NOT NULL,
    FOREIGN KEY (point_id) REFERENCES point(id),
    FOREIGN KEY (connected_point_id) REFERENCES point(id),
    FOREIGN KEY (animal_project_id) REFERENCES animalproject(id)
);

CREATE TABLE logging (
    id BIGSERIAL  PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_error  BOOLEAN,
    is_frontend BOOLEAN, -- unexpected behavious occured from client code vs server code --
    msg TEXT NOT NULL
);

-- so the "NOT NULL" doesn't trigger and "" == 0 doesnt matter -- 
SELECT setval(pg_get_serial_sequence('animalproject', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('image', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('image_batch', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('point', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('joint', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('logging', 'id'), 1, false);