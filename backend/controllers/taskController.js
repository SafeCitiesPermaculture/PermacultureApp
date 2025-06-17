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
        const tasks = await Task.find({ assignedTo: id, isCompleted: false }).sort({ dueDateTime: 1});
        res.status(200).json({ message: "Tasks retrieved successfully", tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error when retrieving tasks" });
    }
};

const markCompleted = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const id = req.params.id;
    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.isCompleted = true;
        await task.save();
        return res.status(201).json({ message: "Task marked completed" });
    } catch (error) {
        return res.status(500).json({ message: "Server error when marking task completed" });
    }
};

const markIncomplete = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const id = req.params.id;
    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.isCompleted = false;
        await task.save();
        return res.status(201).json({ message: "Task marked completed" });
    } catch (error) {
        return res.status(500).json({ message: "Server error when marking task completed" });
    }
};

const getCompletedTasks = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const id = req.user._id;

    try {
        const tasks = await Task.find({ assignedTo: id, isCompleted: true }).sort({ dueDateTime: 1 });
        return res.status(201).json({ message: "Completed tasks retrieved", tasks });
    } catch (error) {
        return res.status(500).json({ message: "Server error when getting tasks" });
    }
};

const deleteTask = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const taskId = req.params.id;

    try {
        const task = await Task.findById(taskId);

        if (req.user.userRole !== "admin" && task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized: You cannot remove this listing" });
        }

        await Task.findByIdAndDelete(taskId);
        return res.status(200).json({ message: "Task deleted" });
    } catch (error) {
        return res.status(500).json({ message: "Server error when deleting task" });
    }
}

module.exports = { createTask, getTasks, markCompleted, getCompletedTasks, markIncomplete, deleteTask };