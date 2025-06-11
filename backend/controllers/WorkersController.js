const WorkersSchedule = require('../models/WorkersModel');
const User = require("../models/User")


exports.createSchedule = async (req, res) => {
  try {
    const { task, date, time, assignedTo } = req.body;

    const newSchedule = await WorkersSchedule.create({
      task,
      date: new Date(date),
      time: new Date(time), // stored as Date object, safe
      assignedTo,
    });

    res.status(201).json(newSchedule);
  } catch (error) {

    res.status(400).json({ error: error.message });
  }
};



exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().populate("assignedTo", "username");
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Failed to fetch schedules:", error.message);
    res.status(500).json({ error: error.message });
  }
};






