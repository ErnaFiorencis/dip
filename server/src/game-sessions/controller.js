const pool = require('../../db');
const queries = require('./queries');


const startGameSession = async (req, res) => {
  const { topic_id, game_mode, opponent_id } = req.body;
  const student_id = req.decoded.user_id;
  try {
    if (!topic_id || !game_mode) {
      return res.status(400).json({ error: 'Nedostaju obvezna polja: tema i način igre' });
    }
    const result = await pool.query(queries.startSession,
      [student_id, topic_id, game_mode, opponent_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Greška pri pokretanju sesije:', error);
    res.status(500).json({ error: 'Interna serverska greška' });
  }
};
function calculateElo(playerRating, questionRating, isCorrect, attempts, maxAttempts=4) {
  if(attempts == maxAttempts) {
    return { newPlayerRating: playerRating, newQuestionRating: questionRating }; // No change if max attempts reached
  }
  const expected = 1 / (1 + 10 ** ((questionRating - playerRating) / 400));
  const actual = isCorrect ? 1 : 0;
  
  // Scale K-factor based on attempts (more attempts = smaller change)
  const kFactor = 32 * (1 - ((Math.min(attempts, maxAttempts) - 1) / maxAttempts));
  
  // Weight correct answers after multiple attempts less
  const weightedActual = isCorrect ? (1 / Math.sqrt(attempts)) : 0;
  
  const newPlayerRating = playerRating + kFactor * (weightedActual - expected);
  const newQuestionRating = questionRating + kFactor * ((1 - weightedActual) - (1 - expected));
  
  return {
      newPlayerRating: Math.round(newPlayerRating),
      newQuestionRating: Math.round(newQuestionRating)
  };
}

const updateAbilityRatings = async (req, res) => {
  const { winner_id, loser_id, topic_id } = req.body;

  if (!winner_id || !loser_id || !topic_id) {
    return res.status(400).json({ error: 'Required fields: winner_id, loser_id, and topic_id' });
  }

  try {
    // Fetch current ability ratings for both players
    const [winnerResult, loserResult] = await Promise.all([
      pool.query('SELECT ability_rating FROM student_topic_ability WHERE student_id = $1 AND topic_id = $2', [winner_id, topic_id]),
      pool.query('SELECT ability_rating FROM student_topic_ability WHERE student_id = $1 AND topic_id = $2', [loser_id, topic_id]),
    ]);

    const winnerRating = winnerResult.rows[0]?.ability_rating || 800; // Default to 800 if no rating exists
    const loserRating = loserResult.rows[0]?.ability_rating || 800;

    // Calculate new ratings using Elo formula
    const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + 10 ** ((winnerRating - loserRating) / 400));
    const kFactor = 32;

    const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner));
    const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser));

    // Update the database with the new ratings
    await Promise.all([
      pool.query(`
        INSERT INTO student_topic_ability (student_id, topic_id, ability_rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, topic_id) DO UPDATE SET
          ability_rating = EXCLUDED.ability_rating
      `, [winner_id, topic_id, newWinnerRating]),
      pool.query(`
        INSERT INTO student_topic_ability (student_id, topic_id, ability_rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, topic_id) DO UPDATE SET
          ability_rating = EXCLUDED.ability_rating
      `, [loser_id, topic_id, newLoserRating]),
    ]);

    res.status(200).json({
      success: true,
      message: 'Ability ratings updated successfully',
      data: {
        winner: { student_id: winner_id, new_rating: newWinnerRating },
        loser: { student_id: loser_id, new_rating: newLoserRating },
      },
    });
  } catch (error) {
    console.error('Error updating ability ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateAbilityRatingComputer = async (req, res) => {
  const { winner, topic_id } = req.body;
  const user_id = req.decoded.user_id; // Assuming the loser is the current user
  try{
    const [winnerResult] = await Promise.all([
      pool.query('SELECT ability_rating FROM student_topic_ability WHERE student_id = $1 AND topic_id = $2', [user_id, topic_id]),
    ]);

    const rating = winnerResult.rows[0]?.ability_rating || 800; // Default to 800 if no rating exists
    const kFactor = 32;
    let newRating = rating; // Initialize newRating
    if(winner){
      const expectedWinner = 1 / (1 + 10 ** ((rating - rating) / 400));
      newRating = Math.round(rating + kFactor * (1 - expectedWinner));
    }
    else{
      const expectedLoser = 1 / (1 + 10 ** ((rating - rating) / 400));
      newRating = Math.round(rating + kFactor * (0 - expectedLoser));
    }

    // Update the database with the new ratings
    await Promise.all([
      pool.query(`
        INSERT INTO student_topic_ability (student_id, topic_id, ability_rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, topic_id) DO UPDATE SET
          ability_rating = EXCLUDED.ability_rating
      `, [user_id, topic_id, newRating]),
    ]);
    console.log('New Player Rating:', newRating);
    res.status(200).json({
      success: true,
      message: 'Ability ratings updated successfully'
    });
  } catch (error) {
    console.error('Error updating ability ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const recordQuestionAttempt = async (req, res) => {
  const { session_id } = req.params;
  const { question_id, selected_answer, is_correct, response_time, topic_id, attempts } = req.body;
  try {
    if (!question_id || selected_answer === undefined || 
        is_correct === undefined || response_time === undefined) {
      return res.status(400).json({ error: 'Nedostaju podaci o pokušaju' });
    }
    const result = await pool.query(queries.recordQuestionAttempt,
      [session_id, question_id, selected_answer, is_correct, response_time]
    );

    // update user and question elo ratings
    const [userRes, question] = await Promise.all([
      pool.query('SELECT ability_rating FROM student_topic_ability  WHERE student_id = $1 AND topic_id = $2', [req.decoded.user_id, topic_id]),
      pool.query('SELECT elo_rating FROM quiz_questions WHERE question_id = $1', [question_id])
    ]);
    const currentAbility = userRes.rows[0]?.ability_rating || 800;
    const { newPlayerRating, newQuestionRating } = calculateElo(
      currentAbility,
      question.rows[0].elo_rating,
      is_correct,
      attempts
    );
    console.log('New Player Rating:', newPlayerRating);
    console.log('New Question Rating:', newQuestionRating);
    await Promise.all([
      pool.query(`
      INSERT INTO student_topic_ability 
        (student_id, topic_id, ability_rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (student_id, topic_id) DO UPDATE SET
        ability_rating = EXCLUDED.ability_rating
      `, [req.decoded.user_id, topic_id, newPlayerRating]),
      pool.query('UPDATE quiz_questions SET elo_rating = $1 WHERE question_id = $2', [newQuestionRating, question_id])
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Greška pri bilježenju pokušaja:', error);
    res.status(500).json({ error: 'Interna serverska greška' });
  }
};

const endGameSession = async (req, res) => {
  const { session_id } = req.params;
  const { correct_answers, wrong_answers, total_questions, winner, points, time_taken} = req.body;

  try {
    const result = await pool.query(
      queries.updateSession,
      [correct_answers, wrong_answers, total_questions, points, winner, time_taken, session_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesija nije pronađena' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Greška pri završetku sesije:', error);
    res.status(500).json({ error: 'Interna serverska greška' });
  }
};

const getSessionsByStudent = async (req, res) => {
  const { student_id } = req.params;
  try {
    const studentCheck = await pool.query(
      queries.checkUser,
      [student_id]
    );
    
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Učenik nije pronađen' });
    }
    const result = await pool.query(queries.getSessionsByStudent,
      [student_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Greška pri dohvatu sesija:', error);
    res.status(500).json({ error: 'Interna serverska greška' });
  }
};

const getOverallStats = async (req, res) => {
  const user_id = req.decoded.user_id;

  try {
      const overallStats = await pool.query(queries.getOverallStats, [user_id]);

      res.json({
          success: true,
          data: overallStats.rows
      });

  } catch (error) {
      console.error('Error fetching overall stats:', error);
      res.status(500).json({ error: 'Server error' });
  }
};

const getTopicStats = async (req, res) => {
  const user_id = req.decoded.user_id;
  const { topic_id } = req.params;

  try {
      // Topic-specific statistics
      const topicStats = await pool.query(queries.getTopicStats, [user_id, topic_id]);
      if (topicStats.rows.length === 0) {
          return res.status(404).json({ error: 'No data for this topic' });
      }
      res.json({
          success: true,
          data: topicStats.rows
      });

  } catch (error) {
      console.error('Error fetching topic stats:', error);
      res.status(500).json({ error: 'Server error' });
  }
};

const getSubjectStats = async (req, res) => {
  const user_id = req.decoded.user_id; // Extract user ID from the token
  const { subject_id } = req.params; // Extract subject ID from the request parameters

  try {
    // Fetch statistics for all topics in the subject
    const subjectStats = await pool.query(queries.getSubjectStats, [user_id, subject_id]);

    if (subjectStats.rows.length === 0) {
      return res.status(404).json({ error: 'No data found for this subject' });
    }

    res.json({
      success: true,
      data: subjectStats.rows,
    });
  } catch (error) {
    console.error('Error fetching subject stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
const deleteUnfinishedSessions = async (req, res) => {
  try {
    const result = await pool.query(queries.deleteUnfinishedSessions);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No unfinished sessions found' });
    }

    res.json({
      success: true,
      message: `${result.rows.length} unfinished sessions deleted`,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error deleting unfinished sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFilteredStats = async (req, res) => {
  const user_id = req.decoded.user_id;
  const { classroom_id, subject_id, game_mode, topic_id } = req.query;

  try {
    const result = await pool.query(queries.getFilteredStats, [
      parseInt(classroom_id, 10),
      parseInt(subject_id, 10),
      game_mode || 'all',                           // $3
      game_mode === 'all' 
        ? ['pvp', 'computer', 'practice']           // $4
        : [game_mode],                              // $4
      topic_id === 'all' ? 'all' : parseInt(topic_id, 10), // $5
      user_id                                      // $6
    ]);
    console.log('Filtered stats:', result.rows[0]);
    res.json({
      success: true,
      data: result.rows[0] || { games: 0, wins: 0, points: 0 },
    });
  } catch (error) {
    console.error('Error fetching filtered stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFilteredLeaderboard = async (req, res) => {
  const { classroom_id, subject_id, topic_id } = req.query;

  try {
    const result = await pool.query(queries.getFilteredLeaderboard, [
      parseInt(classroom_id, 10), // Cast classroom_id to integer
      subject_id === 'all' ? 'all' : parseInt(subject_id, 10), // Handle "all" or specific subject
      topic_id === 'all' ? 'all' : parseInt(topic_id, 10), // Handle "all" or specific topic
    ]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  startGameSession,
  recordQuestionAttempt,
  endGameSession,
  getSessionsByStudent,
  getOverallStats,
  getTopicStats,
  getSubjectStats,
  deleteUnfinishedSessions,
  getFilteredStats,
  getFilteredLeaderboard,
  updateAbilityRatings,
  updateAbilityRatingComputer
};