// Subject Queries
module.exports = {
    getClassroomById: "SELECT classroom_id FROM classrooms WHERE classroom_id = $1",
    createSubject: "INSERT INTO subjects (name, classroom_id) VALUES ($1, $2) RETURNING subject_id",
    updateSubject: "UPDATE subjects SET name = $1 WHERE subject_id = $2",
    deleteSubject: "DELETE FROM subjects WHERE subject_id = $1",
    getSubjectsByClassroom: "SELECT subject_id, name, created_at FROM subjects WHERE classroom_id = $1 ORDER BY name",
};
