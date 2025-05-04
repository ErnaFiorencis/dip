const pool = require('../../db');
const queries = require('./queries');

const createSubject = async (req, res) => {
    const { name, classroom_id } = req.body;
    try {
        if (!name || !classroom_id) {
            return res.status(400).send("Name and classroom ID are required");
        }
        const classroomCheck = await pool.query(queries.getClassroomById, [classroom_id]);
        if (classroomCheck.rows.length === 0) {
            return res.status(404).send("Classroom not found");
        }
        const result = await pool.query(queries.createSubject, [name, classroom_id]);
        res.status(201).json({
            message: "Subject created successfully",
            subject_id: result.rows[0].subject_id
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error creating subject");
    }
};

const updateSubject = async (req, res) => {
    const { subject_id } = req.params;
    const { name } = req.body;
    try {
        if (!name) return res.status(400).send("Name is required");
        const result = await pool.query(queries.updateSubject, [name, subject_id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Subject not found");
        }
        res.status(200).send("Subject updated successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error updating subject");
    }
};

const deleteSubject = async (req, res) => {
    const { subject_id } = req.params;
    try {
        const result = await pool.query(queries.deleteSubject, [subject_id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Subject not found");
        }
        res.status(200).send("Subject and associated topics deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error deleting subject");
    }
};

const getSubjectsByClassroom = async (req, res) => {
    const { classroom_id } = req.params;
    try {
        const result = await pool.query(queries.getSubjectsByClassroom, [classroom_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error fetching subjects");
    }
};

module.exports = {
    createSubject,
    updateSubject,
    deleteSubject,
    getSubjectsByClassroom
};
