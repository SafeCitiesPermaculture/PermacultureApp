const express = require('express');
const router = express.Router();
const WorkerController = require('../controllers/WorkersController');
const User = require("../models/User")


router.post('/', WorkerController.createSchedule);
router.get('/', WorkerController.getAllSchedules);
router.get("/safeCitiesUsers", async (req, res) => {
  try {
    const users = await User.find({ isSafeCities: true }, "_id username"); // select only what you need
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { task, date, time, assignedTo } = req.body;

    const newSchedule = new Schedule({
      task,
      date,
      time,
      assignedTo,
    });

    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;