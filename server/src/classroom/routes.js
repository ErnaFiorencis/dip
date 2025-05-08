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

// In your routes file
router.post('/create', checkToken, controller.createClassroom);
router.get('/my', checkToken, controller.getClassroomsByCreator);
router.get('/:classroom_id/students', controller.getStudentsInClassroom);
router.get('/', controller.getAllClassrooms);
router.put('/:classroom_id', checkToken, controller.editClassroom);
router.delete('/:classroom_id', checkToken, controller.deleteClassroom);
router.post('/:classroom_id/students', controller.addStudentToClassroom);
router.delete('/:classroom_id/students/:student_id', checkToken, controller.removeStudentFromClassroom);
router.post('/join', checkToken, controller.joinClassroom); // Assuming you have a joinClassroom method in your controller
router.get('/info/:classroom_id', checkToken, controller.getClassroomInfo); // Assuming you have a getClassroomInfo method in your controller
router.get('/statistics', checkToken, controller.getUserStatistics); // Assuming you have a getUserStatistics method in your controller
module.exports = router;