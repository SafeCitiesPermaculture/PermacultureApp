const WorkersSchedule = require('../models/WorkersModel');

exports.createSchedule = async (req, res) => {
  try {
    const { task, date, time } = req.body;

    const newSchedule = await Schedule.create({
      task,
      date: new Date(date),
      time: new Date(time), // stored as Date object, safe
    });

    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


