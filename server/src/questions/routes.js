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

// Question management routes
router.post('/generate', checkToken, controller.generateQuestions);
router.post('/:topic_id', controller.addQuestion);
router.put('/:question_id', controller.updateQuestion);
router.delete('/:question_id', controller.deleteQuestion);
router.get('/topic/:topic_id', controller.getQuestionsByTopic);
router.get('/topic-active/:topic_id', controller.getActiveQuestionsByTopic);
router.get('/random/:topic_id', controller.getRandomQuestion);
router.get('/adaptive/:topic_id', checkToken, controller.getAdaptiveQuestions);
router.post('/ai-adaptive/:topic_id', checkToken, controller.generateAdaptiveQuestions);

module.exports = router;
