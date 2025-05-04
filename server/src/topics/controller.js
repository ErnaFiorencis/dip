const pool = require('../../db');
const queries = require('./queries');

const createTopic = async (req, res) => {
    const { name, description, subject_id } = req.body;

    try {
        if (!name || !subject_id) {
            return res.status(400).send("Name and subject ID are required");
        }
        const subjectCheck = await pool.query(queries.checkSubjectExists, [subject_id]);
        if (subjectCheck.rows.length === 0) {
            return res.status(404).send("Subject not found");
        }

        const result = await pool.query(queries.createTopic, [name, description, subject_id]);
        res.status(201).json({
            message: "Topic created successfully",
            topic_id: result.rows[0].topic_id
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error creating topic");
    }
};

const updateTopic = async (req, res) => {
    const { topic_id } = req.params;
    const {description } = req.body;

    try {
        
        const result = await pool.query(queries.updateTopic, [description, topic_id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Topic not found");
        }
        
        res.status(200).send("Topic updated successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error updating topic");
    }
};

const deleteTopic = async (req, res) => {
    const { topic_id } = req.params;

    try {
        const result = await pool.query(queries.deleteTopic, [topic_id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Topic not found");
        }
        res.status(200).send("Topic and associated questions deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error deleting topic");
    }
};

const getTopicsBySubject = async (req, res) => {
    const { subject_id } = req.params;

    try {
        const result = await pool.query(queries.getTopicsBySubject, [subject_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error fetching topics");
    }
};

const getTopicById = async (req, res) => {
    const { topic_id } = req.params;

    try {
        const result = await pool.query(queries.getTopicById, [topic_id]);
        if (result.rows.length === 0) {
            return res.status(404).send("Topic not found");
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error fetching topic");
    }
}

module.exports = {
    createTopic,
    updateTopic,
    deleteTopic,
    getTopicsBySubject,
    getTopicById
};
