const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/ScheduleController');

router.post('/', ScheduleController.createSchedule);
router.get('/', ScheduleController.getAllSchedules);
router.delete("/delete/:id", ScheduleController.deleteTask);

module.exports = router;
