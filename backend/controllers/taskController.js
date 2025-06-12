const Task = require("../models/Task");

const createTask = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const { dueDateTime, name } = req.body;
    const assignedTo = req.body.assignedTo || req.user._id;

    const newTask = Task({
        name,
        dueDateTime,
        assignedTo
    });

    try {
        const savedTask = await newTask.save();
        res.status(201).json({ message: "Task created successfully", task: savedTask });

    } catch (error) {
        return res.status(500).json({ message: "Server error when creating task" });
    }
};

const getTasks = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const id = req.user._id;

    try {
        const tasks = await Task.find({ assignedto: id });
        res.status(200).json({ message: "Tasks retrieved successfully", tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error when retrieving tasks" });
    }
};

module.exports = { createTask, getTasks };