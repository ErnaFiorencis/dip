const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'diplomski',
    password: 'bazepodataka',
    port: 5432,
});
const sql_setup = `
    DROP TABLE IF EXISTS classroom_managers CASCADE;
    DROP TABLE IF EXISTS quiz_questions CASCADE;
    DROP TABLE IF EXISTS topics CASCADE;
    DROP TABLE IF EXISTS subjects CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS classrooms CASCADE;
    DROP TABLE IF EXISTS classroom_students CASCADE;


    CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        user_name VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        ability_rating INT DEFAULT 800,
        role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE classrooms (
        classroom_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        class_code VARCHAR(10) UNIQUE NOT NULL,
        created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
        school_level VARCHAR(50) CHECK (school_level IN ('osnovna', 'srednja', 'fakultet')),
        grade_level SMALLINT CHECK (grade_level BETWEEN 1 AND 12),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE classroom_managers (
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        classroom_id INT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, classroom_id)
    );

    CREATE TABLE subjects (
        subject_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        classroom_id INT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE topics (
        topic_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE quiz_questions (
        question_id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer1 VARCHAR(255) NOT NULL,
        answer2 VARCHAR(255) NOT NULL,
        answer3 VARCHAR(255) NOT NULL,
        answer4 VARCHAR(255) NOT NULL,
        correct_answer INT CHECK (correct_answer BETWEEN 1 AND 4),
        topic_id INT REFERENCES topics(topic_id) ON DELETE CASCADE,
        active BOOLEAN DEFAULT TRUE,
        elo_rating INT DEFAULT 800,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE classroom_students (
    student_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    classroom_id INT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, classroom_id)
    );

    CREATE INDEX idx_classrooms_class_code ON classrooms(class_code);
    CREATE INDEX idx_classroom_managers_user ON classroom_managers(user_id);
    CREATE INDEX idx_quiz_topic ON quiz_questions(topic_id);
`;

const sql_statistics = `
    DROP TABLE IF EXISTS game_sessions CASCADE;
    DROP TABLE IF EXISTS game_question_details CASCADE;

    CREATE TABLE game_sessions (
        session_id SERIAL PRIMARY KEY,
        student_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        topic_id INT REFERENCES topics(topic_id) ON DELETE CASCADE,
        game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('practice', 'computer', 'pvp')),
        opponent_id VARCHAR(255), -- Can store UUID, 'computer', or NULL
        correct_answers INT DEFAULT 0,
        wrong_answers INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        winner BOOLEAN DEFAULT FALSE,
        time_taken INT DEFAULT 0, -- In seconds,
        points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE game_question_details (
        detail_id SERIAL PRIMARY KEY,
        session_id INT REFERENCES game_sessions(session_id) ON DELETE CASCADE,
        question_id INT REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
        selected_answer INT CHECK (selected_answer BETWEEN 1 AND 4),
        is_correct BOOLEAN,
        response_time INT, -- Milliseconds
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

const points_table = `
    DROP TABLE IF EXISTS student_points CASCADE;
    CREATE TABLE student_points (
    student_id INT REFERENCES users(user_id),
    classroom_id INT REFERENCES classrooms(classroom_id),
    topic_id INT REFERENCES topics(topic_id),
    practice_points INT DEFAULT 0,
    pvp_points INT DEFAULT 0,
    computer_points INT DEFAULT 0,
    PRIMARY KEY (student_id, classroom_id, topic_id)
);
`;

const updates = `
-- Remove global ability_rating from users
ALTER TABLE users DROP COLUMN ability_rating;

-- Create topic-specific ability tracking
CREATE TABLE student_topic_ability (
    student_id INT REFERENCES users(user_id),
    topic_id INT REFERENCES topics(topic_id),
    ability_rating INT DEFAULT 800,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, topic_id)
);
`;



async function setupDatabase() {
    try {
        //await pool.query(sql_setup);
        //await pool.query(sql_statistics);
        //await pool.query(points_table);
        //await pool.query(updates);
        console.log('🎉 Database schema created successfully!');
        console.log('✔️ tables created');
        console.log('✔️ Indexes & triggers added');
    } catch (err) {
        console.error('🚨 Error during setup:', err.message);
    } finally {
        await pool.end();
    }
}

setupDatabase();
