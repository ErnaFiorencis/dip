const pool = require('../../db');
const queries = require('./queries');

const createClassroom = async (req, res) => {
    const { name, class_code, school_level, grade_level } = req.body;
    const creator_id = req.decoded.user_id; 

    if (!name || !class_code) {
        return res.status(400).json({ error: "Name and class code are required" });
    }

    if (req.decoded.role !== 'admin') {
        return res.status(403).json({ error: "Admin privileges required" });
    }

    try {
        // Check class code availability
        const codeCheck = await pool.query(queries.checkClassCodeExists, [class_code]);
        if (codeCheck.rows.length > 0) {
            return res.status(400).json({ error: "Class code already exists" });
        }

        // Create classroom with creator reference
        const result = await pool.query(queries.createClassroom, [
            name, 
            class_code,
            school_level,
            grade_level,
            creator_id // Added created_by reference
        ]);

        res.status(201).json({
            message: "Classroom created successfully",
            classroom: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while creating classroom" });
    }
};

const getStudentsInClassroom = async (req, res) => {
    const { classroom_id } = req.params;

    try {
        const result = await pool.query(queries.getStudentsInClassroom, [classroom_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No students found in this classroom" });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while fetching students" });
    }
};


const getAllClassrooms = async (req, res) => {
    try {
        const result = await pool.query(queries.getAllClassrooms);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error fetching classrooms" });
    }
};

const getClassroomsByCreator = async (req, res) => {
    const creator_id = req.decoded.user_id;

    try {
        const result = await pool.query(queries.getClassroomsByCreator, [creator_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error fetching classrooms" });
    }
};

const editClassroom = async (req, res) => {
    const { classroom_id } = req.params;
    const { name, class_code } = req.body;
    const user_id = req.decoded.user_id;

    try {
        const classroom = await pool.query(`
            SELECT * FROM classrooms 
            WHERE classroom_id = $1 
            AND (created_by = $2 OR $3 = 'admin')
        `, [classroom_id, user_id, req.decoded.role]);

        if (classroom.rows.length === 0) {
            return res.status(404).json({ error: "Classroom not found or unauthorized" });
        }

        if (class_code) {
            const codeCheck = await pool.query(
                `SELECT class_code FROM classrooms 
                WHERE class_code = $1 
                AND classroom_id != $2`,
                [class_code, classroom_id]
            );
            if (codeCheck.rows.length > 0) {
                return res.status(400).json({ error: "Class code already exists" });
            }
        }

        const result = await pool.query(queries.editClassroom, [name, class_code, classroom_id]  );

        res.status(200).json({
            message: "Classroom updated successfully",
            classroom: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while updating classroom" });
    }
};

const deleteClassroom = async (req, res) => {
    const { classroom_id } = req.params;
    const user_id = req.decoded.user_id;

    try {
        const classroom = await pool.query(
            `SELECT * FROM classrooms 
            WHERE classroom_id = $1 
            AND (created_by = $2 OR $3 = 'admin')`,
            [classroom_id, user_id, req.decoded.role]
        );

        if (classroom.rows.length === 0) {
            return res.status(404).json({ error: "Classroom not found or unauthorized" });
        }
        await pool.query(queries.deleteClassroom, [classroom_id]);
        
        res.status(200).json({
            success: true,
            message: "Classroom and all related data deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while deleting classroom" });
    }
};

const removeStudentFromClassroom = async (req, res) => {
    const { classroom_id, student_id } = req.params;

    try {
        // Remove student
        const result = await pool.query(queries.removeStudentFromClassroom, [classroom_id, student_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Student not found in classroom" });
        }

        res.status(200).json({
            success: true,
            message: "Student removed from classroom successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while removing student" });
    }
};

const addStudentToClassroom = async (req, res) => {
    const { classroom_id } = req.params;
    const { student_id } = req.body;

    try {
        const classroomCheck = await pool.query(
            'SELECT classroom_id FROM classrooms WHERE classroom_id = $1',
            [classroom_id]
        );
        if (classroomCheck.rows.length === 0) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        const studentCheck = await pool.query(
            'SELECT user_id FROM users WHERE user_id = $1 AND role = $2',
            [student_id, 'student']
        );
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({ error: "Student not found or invalid role" });
        }

        const existingEnrollment = await pool.query(queries.checkStudentInClassroom,[student_id, classroom_id]);
        if (existingEnrollment.rows.length > 0) {
            return res.status(400).json({ error: "Student already in classroom" });
        }

        await pool.query(queries.insertStudentToClassroom, [student_id, classroom_id]);

        res.status(201).json({
            success: true,
            message: "Student added to classroom successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while adding student to classroom" });
    }
};

const joinClassroom = async (req, res) => {
    const { class_code } = req.body;
    const user_id = req.decoded.user_id;

    try {
        // Check if the classroom exists
        const classroomCheck = await pool.query(queries.checkClassCodeExists, [class_code]);
        if (classroomCheck.rows.length === 0) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        const classroom_id = classroomCheck.rows[0].classroom_id;

        // Check if the student is already enrolled
        const enrollmentCheck = await pool.query(queries.checkStudentInClassroom, [user_id, classroom_id]);
        if (enrollmentCheck.rows.length > 0) {
            return res.status(400).json({ error: "Already enrolled in this classroom" });
        }

        // Enroll the student in the classroom
        await pool.query(queries.insertStudentToClassroom, [user_id, classroom_id]);

        res.status(200).json({
            success: true,
            message: "Successfully joined the classroom"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while joining classroom" });
    }
}

const getClassroomInfo = async (req, res) => {
    const { classroom_id } = req.params;

    try {
        // Fetch classroom details
        const classroom = await pool.query(queries.getClassroomById, [classroom_id]);
        if (classroom.rows.length === 0) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        // Fetch students in the classroom
        const students = await pool.query(queries.getStudentsInClassroom, [classroom_id]);

        res.status(200).json({
            classroom: classroom.rows[0],
            students: students.rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while fetching classroom info" });
    }
};

const getUserStatistics = async (req, res) => {
    const { classroom_id, subject_id, topic_id } = req.query;

    try {
        const result = await pool.query(queries.getUserStatistics, [topic_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while fetching user statistics" });
    }
};



module.exports = {
    createClassroom,
    getStudentsInClassroom,
    getAllClassrooms,
    getClassroomsByCreator,
    editClassroom,
    deleteClassroom,
    removeStudentFromClassroom,
    addStudentToClassroom,
    joinClassroom,
    getUserStatistics,
    getClassroomInfo
};
