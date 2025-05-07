const getStudents = "select * from users";
const getStudentById = "SELECT * FROM users WHERE user_id = $1 "
const checkUserExists = "select s.* from users s where s.user_name = $1"


const checkClassroomCode = "SELECT classroom_id FROM classrooms WHERE class_code = $1"
const getUserByUsername = "SELECT * FROM users WHERE user_name = $1"
const getClassroomByCode = "SELECT classroom_id FROM classrooms WHERE class_code = $1"
const addStudent = "INSERT INTO users (user_name, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id"

const studentsClassrooms = "SELECT c.classroom_id, c.class_code, c.name FROM classrooms c JOIN classroom_students uc ON c.classroom_id = uc.classroom_id WHERE uc.student_id = $1" 

const updateStudent = `
    UPDATE users SET
        user_name = $1,
        password_hash = $2,
    WHERE user_id = $3
`
const deleteStudent = "DELETE FROM users WHERE user_id = $1"    

const getUserClassroom = `
    SELECT u.user_id, u.user_name, u.role, c.classroom_id, c.class_code, c.name
    FROM users u
    JOIN classroom_students cs ON u.user_id = cs.student_id
    JOIN classrooms c ON cs.classroom_id = c.classroom_id
    WHERE u.user_name = $1 AND c.classroom_id = $2
`

module.exports = {
    getStudents,
    getStudentById,
    checkUserExists,
    addStudent,
    checkClassroomCode,
    getUserClassroom,
    getUserByUsername,
    getClassroomByCode,
    updateStudent,
    deleteStudent,
    studentsClassrooms
}