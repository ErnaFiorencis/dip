const express = require('express');
const router = express.Router();
const subjectController = require('./controller');

router.post('/', subjectController.createSubject);
router.put('/:subject_id', subjectController.updateSubject);
router.delete('/:subject_id', subjectController.deleteSubject);
router.get('/classroom/:classroom_id', subjectController.getSubjectsByClassroom);

module.exports = router;
