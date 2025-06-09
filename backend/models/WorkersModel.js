const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  task: String,
  date: {type: Date},
  time: {type: Date},
});

module.exports = mongoose.model('Schedule', ScheduleSchema);