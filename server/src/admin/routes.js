const {Router} = require('express');
const pool = require('../../db');
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

router.get('/auth/me', checkToken, async (req, res) => {
    try {
      const user = await pool.query('SELECT user_id, user_name, role FROM users WHERE user_id = $1', [req.decoded.user_id]);
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user.rows[0]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = router;