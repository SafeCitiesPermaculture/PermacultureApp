const mongoose = require('mongoose');

const WorkersScheduleSchema = new mongoose.Schema({
  task: String,
  date: { type: Date }, // only date part (e.g., 2025-06-12)
  time: { type: Date }, // only time part (e.g., 1970-01-01T14:30:00.000Z)
});

module.exports = mongoose.model('WorkersSchedule', WorkersScheduleSchema);
