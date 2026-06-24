const Task = require("../models/Task");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload");

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

        // Only the assignee or an admin may complete a task.
        const isAdmin = req.user.userRole === "admin";
        const isOwner = task.assignedTo.toString() === req.user._id.toString();
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "Unauthorized: you cannot complete this task" });
        }

        // Optional completion note describing how the task was done.
        if (typeof req.body.completionNote === "string") {
            task.completionNote = req.body.completionNote;
        }

        // Optional completion photo (multipart upload).
        if (req.file) {
            try {
                const { url, publicId } = await uploadBufferToCloudinary(req.file, "task-completions");
                task.completionPhoto = url;
                task.completionPhotoId = publicId;
            } catch (uploadError) {
                console.error("Completion photo upload failed:", uploadError.message);
                return res.status(500).json({
                    message: "Failed to upload completion photo",
                    reason: uploadError.message,
                });
            }
        }

        task.isCompleted = true;
        task.completedAt = new Date();
        task.completedBy = req.user._id;
        await task.save();
        return res.status(201).json({ message: "Task marked completed", task });
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

        const isAdmin = req.user.userRole === "admin";
        const isOwner = task.assignedTo.toString() === req.user._id.toString();
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "Unauthorized: you cannot edit this task" });
        }

        // Clear the completion record when reverting.
        if (task.completionPhotoId) {
            await deleteFromCloudinary(task.completionPhotoId);
        }
        task.isCompleted = false;
        task.completedAt = null;
        task.completedBy = null;
        task.completionNote = "";
        task.completionPhoto = "";
        task.completionPhotoId = "";
        await task.save();
        return res.status(201).json({ message: "Task marked incomplete" });
    } catch (error) {
        return res.status(500).json({ message: "Server error when marking task incomplete" });
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

const updateTask = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const taskId = req.params.id;
    const { name, dueDateTime, assignedTo } = req.body;

    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isAdmin = req.user.userRole === "admin";

        // Admins may edit any task. Everyone else may only edit tasks assigned
        // to themselves.
        if (!isAdmin && task.assignedTo.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Unauthorized: You cannot edit this task" });
        }

        if (name !== undefined) task.name = name;
        if (dueDateTime !== undefined) task.dueDateTime = dueDateTime;
        // Only admins may reassign a task to another user.
        if (isAdmin && assignedTo !== undefined) task.assignedTo = assignedTo;

        const updatedTask = await task.save();
        return res
            .status(200)
            .json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        return res.status(500).json({ message: "Server error when updating task" });
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
};

/**
 * Admin: list every task, optionally filtered by assignee or completion state.
 * Query params: assignedTo (userId), isCompleted ("true"/"false").
 * Populates the assignee and the user who completed it so admins can review
 * who did what and how (note + photo live on the task itself).
 */
const getAllTasks = async (req, res) => {
    try {
        const filter = {};
        if (req.query.assignedTo) {
            filter.assignedTo = req.query.assignedTo;
        }
        if (req.query.isCompleted === "true") {
            filter.isCompleted = true;
        } else if (req.query.isCompleted === "false") {
            filter.isCompleted = false;
        }

        const tasks = await Task.find(filter)
            .populate({
                path: "assignedTo",
                select: "username farms",
                populate: { path: "farms", select: "name" },
            })
            .populate("completedBy", "username")
            .sort({ dueDateTime: 1 });

        return res.status(200).json({ message: "Tasks retrieved", tasks });
    } catch (error) {
        return res.status(500).json({ message: "Server error when retrieving tasks" });
    }
};

module.exports = {
    createTask,
    getTasks,
    markCompleted,
    getCompletedTasks,
    markIncomplete,
    updateTask,
    deleteTask,
    getAllTasks,
};
