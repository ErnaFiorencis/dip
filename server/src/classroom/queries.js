const { getClassroomInfo } = require("./controller");

module.exports = {
    createClassroom: `
        INSERT INTO classrooms (name, class_code, school_level, grade_level, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING classroom_id, name, class_code, school_level, grade_level, created_at
    `,
    getAllClassrooms: `
        SELECT c.classroom_id, c.name, c.class_code, 
               c.created_at, u.user_name as created_by
        FROM classrooms c
        LEFT JOIN users u ON c.created_by = u.user_id
    `,
    getClassroomsByCreator: `
        SELECT *
        FROM classrooms 
        WHERE created_by = $1
    `,
    checkClassCodeExists: "SELECT * FROM classrooms WHERE class_code = $1",
    getStudentsInClassroom: `
        SELECT u.user_id, u.user_name, u.created_at 
        FROM users u
        JOIN classroom_students cs ON u.user_id = cs.student_id
        WHERE cs.classroom_id = $1 AND u.role = 'student'
    `,
    getClassroomById: `
    SELECT * FROM classrooms 
    WHERE classroom_id = $1
    `,
    editClassroom: `
        UPDATE classrooms 
        SET name = COALESCE($1, name),
            class_code = COALESCE($2, class_code)
        WHERE classroom_id = $3
        RETURNING *
    `,
    deleteClassroom: `
        DELETE FROM classrooms 
        WHERE classroom_id = $1
        RETURNING *
    `,
    removeStudentFromClassroom: `
        DELETE FROM classroom_students 
        WHERE classroom_id = $1 AND student_id = $2
        RETURNING *
    `,
    updateClassroom: `
        UPDATE classrooms 
        SET name = COALESCE($1, name),
            class_code = COALESCE($2, class_code)
        WHERE classroom_id = $3
        RETURNING *
    `,
    insertStudentToClassroom: `
        INSERT INTO classroom_students (student_id, classroom_id) 
        VALUES ($1, $2)
        RETURNING *
    `,
    checkStudentInClassroom: `
        SELECT * FROM classroom_students 
        WHERE student_id = $1 AND classroom_id = $2
    `,

};
