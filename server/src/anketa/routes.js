const express = require('express');
const router = express.Router();
const anketaController = require('./controller');
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


router.post('/', checkToken, anketaController.submitAnketa);
router.get('/student/:student_id', checkToken, anketaController.getStudentAnkete);

module.exports = router;