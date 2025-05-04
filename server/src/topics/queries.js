// Subject Queries
module.exports = {
    checkSubjectExists: "SELECT subject_id FROM subjects WHERE subject_id = $1",
    createTopic: "INSERT INTO topics (name, description, subject_id) VALUES ($1, $2, $3) RETURNING topic_id",
    updateTopic: "UPDATE topics SET description = $1 WHERE topic_id = $2",
    deleteTopic: "DELETE FROM topics WHERE topic_id = $1",
    getTopicById: "SELECT * FROM topics WHERE topic_id = $1",
    getTopicsBySubject: `
        SELECT topic_id, name, description, created_at 
        FROM topics 
        WHERE subject_id = $1
        ORDER BY created_at DESC
    `
};
