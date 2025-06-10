const express = require('express');
const router = express.Router();
const WorkerController = require('../controllers/WorkersController');

router.post('/', WorkerController.createSchedule);
router.get('/', WorkerController.getAllSchedules);


module.exports = router;