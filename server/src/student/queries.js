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

module.exports = {
    getStudents,
    getStudentById,
    checkUserExists,
    addStudent,
    checkClassroomCode,
    getUserByUsername,
    getClassroomByCode,
    updateStudent,
    deleteStudent,
    studentsClassrooms
}