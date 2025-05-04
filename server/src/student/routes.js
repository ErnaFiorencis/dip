const {Router} = require('express')
const controller = require('./controller')
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = Router()

const checkToken = (req, res, next) => {
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader) {
        return res.status(403).json({ error: 'A token is required for authentication' });
    }

    const token = authorizationHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    if (!token) {
        return res.status(403).json({ error: 'Invalid token format' });
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.decoded = decoded; // Attach decoded payload to request object
        next(); // Pass control to the next middleware or route handler
    });
};

router.get("/", controller.getStudents)
router.post("/", controller.addStudent)
router.post("/signIn", controller.signIn)
router.get('/classrooms', checkToken, controller.studentsClassrooms)
router.get('/me', checkToken, controller.getStudentByToken)
router.put('/:user_id', controller.updateStudent)
router.delete('/:user_id', controller.deleteStudent)
router.get('/:user_id', controller.getStudentById)


module.exports = router;