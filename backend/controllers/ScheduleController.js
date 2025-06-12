const Schedule = require('../models/SchedulePersonalModel');

exports.createSchedule = async (req, res) => {
  try {
    const {schedule} = req.body;
    console.log(schedule);
    const newSchedule = await Schedule.create({
    task: schedule.task,
    date: schedule.date,
    time: schedule.time,
    userId: schedule.userId,
    })
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllSchedules = async (req, res) => {
      try {
        const { userId } = req.query;

        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const schedules = await Schedule.find({ userId }); // ← filter by userId
        res.json(schedules);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };


exports.deleteTask = async (req, res) => {
try {
    const {id} = req.params;

    await Schedule.findByIdAndDelete(id);
    res.status(200).json({message:"deleted successfully"});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
