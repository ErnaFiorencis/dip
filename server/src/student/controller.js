const pool = require('../../db')
const queries = require("./queries")
const bcrypt = require("bcrypt") //node module that simplifies the way you hash passwords
const jwt = require('jsonwebtoken')
require('dotenv').config();

const checkToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if(token === undefined){
        return res.status(401).send({"error": "token is not present"})
    }
    if(token.startsWith('Bearer ')){
        token = token.slice(7, token.length);
    }
    if(token){
        jwt.verify(token, process.env.SECRET, (err, decoded) => {
            if(err){
                return res.status(401).send({"error": "token is not right"})
            }
            else{
                req.decoded = decoded;
                next();
            }
        })
    }
    else{
        return res.json({
            success: false,
            message: "Token is not right"
        });
    }
}

const checkClassroomCode = async (class_code) => {
    try {
        const result = await pool.query(queries.checkClassroomCode, [class_code]);
        return result.rows.length > 0;
    } catch (error) {
        throw error;
    }
};

const getStudents = (req, res) => {
    pool.query(queries.getStudents, (error, result) =>{
        console.log(req.body)
        if(error) throw error;
        res.status(200).json(result.rows)
    })
}



const addStudent = async (req, res) => {
    const { user_name, password, role } = req.body;
    let r = 'admin'
    if (!role) {  // Default to 'student' if not provided
        r = 'student';
    }
    if (!user_name || !password) {
        return res.status(400).send("All fields required");
    }
    try {
        const userCheck = await pool.query(queries.checkUserExists, [user_name]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: "Korisničko ime već postoji" 
            });
        }
        const hash = await bcrypt.hash(password, 10);
        const newUser = await pool.query(queries.addStudent, [
            user_name, 
            hash,
            r
        ]);
        res.status(201).json({
            message: "Student created successfully",
            user_id: newUser.rows[0].user_id
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error during registration");
    }
};


const signIn = async (req, res) => {
    const { user_name, password } = req.body;
    if (!user_name || !password) {
        return res.status(400).send("Username and password required");
    }
    try {
        const userResult = await pool.query(queries.getUserByUsername, [user_name]);
        if (userResult.rows.length === 0) {
            return res.status(401).send("Invalid credentials");
        }
        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).send({message: "Invalid credentials"});
        }
        const token = jwt.sign(
            { 
                user_id: user.user_id,
                role: user.role
            },
            process.env.SECRET,
            { expiresIn: '24h' }
        );
        res.status(200).json({
            token,
            user_id: user.user_id,
            role: user.role
        });

    } catch (error) {
        res.status(500).send(error.message);
    }
};

const oppSignIn = async (req, res) => {
    const { user_name, password, classroom_id } = req.body;
    if (!user_name || !password || !classroom_id) {
        return res.status(400).json({ message: "Username, password, and classroom ID are required." });
    }
    try {
        const checkClassroom = await pool.query(queries.getUserClassroom, [user_name, classroom_id]);
        if (checkClassroom.rows.length === 0) {
            return res.status(401).json({ message: "Učenik nije u učionici." }); // "Student is not in the classroom."
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error while checking classroom.", error: error.message });
    }
    try {
        const userResult = await pool.query(queries.getUserByUsername, [user_name]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials. User not found." });
        }
        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials. Incorrect password." });
        }
        const token = jwt.sign(
            { 
                user_id: user.user_id,
                role: user.role
            },
            process.env.SECRET,
            { expiresIn: '24h' }
        );
        res.status(200).json({
            token,
            user_id: user.user_id,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during login.", error: error.message });
    }
};

const getStudentById = async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query(queries.getStudentById, [user_id]);
        if (result.rows.length === 0) {
            return res.status(404).send("User not found");
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).send("Server error");
    }
};

const updateStudent = async (req, res) => {
    const { user_id } = req.params;
    const { user_name, password} = req.body;
    try {
        const userCheck = await pool.query(queries.getStudentById, [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).send("Student not found");
        }
        const updatedData = {
            user_name: user_name || userCheck.rows[0].user_name,
            password_hash: password ? await bcrypt.hash(password, 10) : userCheck.rows[0].password_hash,
        };

        await pool.query(queries.updateStudent, [
            updatedData.user_name,
            updatedData.password_hash,
            user_id
        ]);

        res.status(200).send("Student updated successfully");

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error while updating student");
    }
};

const deleteStudent = async (req, res) => {
    const { user_id } = req.params;

    try {
        const userCheck = await pool.query(queries.getStudentById, [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).send("Student not found");
        }
        await pool.query(queries.deleteStudent, [user_id]);

        res.status(200).send("Student deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error while deleting student");
    }
};

const studentsClassrooms = async (req, res) => {
    const { user_id } = req.decoded; // Extract user_id from the decoded token
    try {
        const result = await pool.query(queries.studentsClassrooms, [user_id]);
        if (result.rows.length === 0) {
            return res.status(404).send("User not found or is not in any classroom");
        }
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).send("Server error");
    }
};

const getStudentByToken = async (req, res) => {
    const { user_id } = req.decoded.user_id; // Extract user_id from the decoded token
    try {
        const result = await pool.query(queries.getStudentById, [user_id]);
        if (result.rows.length === 0) {
            return res.status(404).send("User not found");
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).send("Server error");
    }
}

module.exports = {
    getStudents,
    checkToken,
    addStudent,
    signIn,
    getStudentById,
    updateStudent,
    deleteStudent,
    studentsClassrooms,
    getStudentByToken,
    oppSignIn
}