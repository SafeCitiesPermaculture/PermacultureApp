const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  task: String,
  date: { type: Date },
  time: { type: Date },
  userId: { type: String, required: true },
});

module.exports = mongoose.model('Schedule', ScheduleSchema);