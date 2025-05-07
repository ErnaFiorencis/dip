const express = require('express');
const router = express.Router();
const controller = require('./controller');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

router.post('/', checkToken, controller.startGameSession);
router.put('/:session_id', checkToken, controller.recordQuestionAttempt);
router.post('/:session_id/end', checkToken, controller.endGameSession);
router.get('/student/:student_id', checkToken, controller.getSessionsByStudent);
router.get('/stats/overall', checkToken, controller.getOverallStats);
router.get('/stats/topics/:topic_id', checkToken, controller.getTopicStats);
router.get('/stats/subjects/:subject_id', checkToken, controller.getSubjectStats);
router.delete('/unfinished', controller.deleteUnfinishedSessions);
router.get('/stats', checkToken, controller.getFilteredStats);
router.get('/leaderboard', checkToken, controller.getFilteredLeaderboard);
router.post('/update-ability', checkToken, controller.updateAbilityRatings);
module.exports = router;