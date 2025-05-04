const express = require('express');
const router = express.Router();
const topicController = require('./controller');

router.post('/', topicController.createTopic);
router.get('/:topic_id', topicController.getTopicById);
router.put('/:topic_id', topicController.updateTopic);
router.delete('/:topic_id', topicController.deleteTopic);
router.get('/subject/:subject_id', topicController.getTopicsBySubject);

module.exports = router;
