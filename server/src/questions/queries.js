const { getAdaptiveQuestions } = require("./controller");

module.exports = {
    checkTopicExists: "SELECT topic_id FROM topics WHERE topic_id = $1",
    
    addQuestion: `
        INSERT INTO quiz_questions 
        (question, answer1, answer2, answer3, answer4, correct_answer, topic_id, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING question_id
    `,
    
    updateQuestion: `
        UPDATE quiz_questions SET
            question = $1,
            answer1 = $2,
            answer2 = $3,
            answer3 = $4,
            answer4 = $5,
            correct_answer = $6,
            active = $7
        WHERE question_id = $8
    `,
    deleteQuestion: "DELETE FROM quiz_questions WHERE question_id = $1",
    
    getQuestionById: "SELECT * FROM quiz_questions WHERE question_id = $1",
    
    getQuestionsByTopic: `
        SELECT question_id, question, answer1, answer2, answer3, answer4, correct_answer, active
        FROM quiz_questions
        WHERE topic_id = $1 
        ORDER BY created_at DESC
    `,
    
    getActiveQuestionsByTopic: `
        SELECT *
        FROM quiz_questions
        WHERE topic_id = $1 AND active = true
        ORDER BY created_at DESC
    `,	

    getRandomQuestion: `
        SELECT *
        FROM quiz_questions
        WHERE topic_id = $1 AND active = TRUE
        ORDER BY RANDOM()
        LIMIT 1
    `,
    getAdaptiveQuestions: `
        SELECT * FROM quiz_questions 
        WHERE topic_id = $1 
        ORDER BY ABS(elo_rating - $2) 
        LIMIT 20
      `,
    getTopicInfo: `SELECT name, description FROM topics WHERE topic_id = $1`,
    getQByTopic: `SELECT question FROM quiz_questions WHERE topic_id = $1`,
    getUserAbilityRating: `
        SELECT ability_rating FROM student_topic_ability  WHERE student_id = $1 AND topic_id = $2`,
    
};
