

module.exports = {
   startSession: `
   INSERT INTO game_sessions (student_id, topic_id, game_mode, opponent_id) 
   VALUES ($1, $2, $3, $4) 
   RETURNING *`,

   updateSession:
   `UPDATE game_sessions SET 
   correct_answers = $1,
   wrong_answers = $2,
   total_questions = $3,
   points = $4,
   winner = $5,
   time_taken = $6
   WHERE session_id = $7
   RETURNING *`,

   recordQuestionAttempt: 
   `INSERT INTO game_question_details 
       (session_id, question_id, selected_answer, is_correct, response_time) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,

   checkUser:
   `SELECT * FROM users WHERE user_id = $1`,

   getSessionsByStudent:
   `SELECT 
   gs.session_id,
   gs.game_mode,
   gs.correct_answers,
   gs.wrong_answers,	
   gs.total_questions,
   gs.winner,
   gs.time_taken,
   t.name as topic_name,
   c.name as classroom_name
  FROM game_sessions gs
  JOIN topics t ON gs.topic_id = t.topic_id
  JOIN subjects s ON t.subject_id = s.subject_id
  JOIN classrooms c ON s.classroom_id = c.classroom_id
  WHERE gs.student_id = $1
`,
   getOverallStats : `
          SELECT 
              game_mode,
              COUNT(*) AS total_sessions,
              SUM(correct_answers) AS total_correct,
              SUM(wrong_answers) AS total_wrong,
              SUM(winner::int) AS total_wins,
              SUM(points) AS total_points -- Calculate total points
          FROM game_sessions
          WHERE student_id = $1 and total_questions > 0
          GROUP BY game_mode
      `,
   getTopicStats : `
          SELECT 
              t.topic_id,
              t.name AS topic_name,
              COUNT(*) AS total_sessions,
              SUM(gs.correct_answers) AS total_correct,
              SUM(gs.wrong_answers) AS total_wrong,
              SUM(winner::int) AS total_wins,
              SUM(gs.points) AS total_points, -- Calculate total points
              AVG(CASE WHEN gs.winner THEN 1 ELSE 0 END) * 100 AS win_rate
          FROM game_sessions gs
          JOIN topics t ON gs.topic_id = t.topic_id
          WHERE gs.student_id = $1 AND t.topic_id = $2 and gs.total_questions > 0
          GROUP BY t.topic_id, t.name
      `,
    getSubjectStats: `
        SELECT 
            t.topic_id,
            t.name AS topic_name,
            COUNT(gs.session_id) AS total_sessions,
            SUM(gs.correct_answers) AS total_correct,
            SUM(gs.wrong_answers) AS total_wrong,
            SUM(winner::int) AS total_wins,
            SUM(gs.points) AS total_points, -- Calculate total points
            AVG(CASE WHEN gs.winner THEN 1 ELSE 0 END) * 100 AS win_rate
        FROM game_sessions gs
        JOIN topics t ON gs.topic_id = t.topic_id
        WHERE gs.student_id = $1 AND t.subject_id = $2 and gs.total_questions > 0
        GROUP BY t.topic_id, t.name
    `,
    deleteUnfinishedSessions: `
        DELETE FROM game_sessions
        WHERE total_questions = 0
        RETURNING *
    `,
    getFilteredStats: `
    SELECT 
        COUNT(gs.session_id) AS games,
        SUM(CASE WHEN gs.winner THEN 1 ELSE 0 END) AS wins,
        SUM(gs.points) AS points
    FROM game_sessions gs
    JOIN topics t ON gs.topic_id = t.topic_id
    JOIN subjects s ON t.subject_id = s.subject_id
    JOIN classrooms c ON s.classroom_id = c.classroom_id
    WHERE c.classroom_id = $1
      AND s.subject_id = $2
      AND gs.total_questions > 0
      AND ($3::text = 'all' OR gs.game_mode = ANY($4))
      AND ($5::text = 'all' OR t.topic_id = $5::int)
      AND student_id = $6
`,
getFilteredLeaderboard: `
    SELECT 
        u.user_id,
        u.user_name AS name,
        SUM(gs.points) AS points
    FROM users u
    JOIN game_sessions gs ON u.user_id = gs.student_id
    JOIN topics t ON gs.topic_id = t.topic_id
    JOIN subjects s ON t.subject_id = s.subject_id
    JOIN classrooms c ON s.classroom_id = c.classroom_id
    WHERE c.classroom_id = $1
      AND ($2::text = 'all' OR s.subject_id = $2::int)
      AND ($3::text = 'all' OR t.topic_id = $3::int)
    GROUP BY u.user_id, u.user_name
    ORDER BY points DESC
`,



};
