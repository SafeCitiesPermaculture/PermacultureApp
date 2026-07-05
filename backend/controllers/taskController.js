const Task = require("../models/Task");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload");

const createTask = async (req, res) => {
    if (!req.user.isVerified || req.user.isRemoved) {
            return res.status(401).json({ message: "User not verified or removed" });
    }

    const { dueDateTime, name, notes } = req.body;
    // Admins may assign to a specific worker; otherwise the task is the
    // creator's own. createdBy records who made it (for edit permissions).
    const assignedTo = req.body.assignedTo || req.user._id;

    const newTask = Task({
        name,
        dueDateTime,
        assignedTo,
        createdBy: req.user._id,
        notes: notes || ""
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

        // Optional completion photo (multipart upload). Replacing an earlier
        // photo (e.g. after a reopen) deletes the old one from Cloudinary.
        if (req.file) {
            try {
                const { url, publicId } = await uploadBufferToCloudinary(req.file, "task-completions");
                if (task.completionPhotoId && task.completionPhotoId !== publicId) {
                    await deleteFromCloudinary(task.completionPhotoId);
                }
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

        // Reopen the task but KEEP the completion note and photo, so whoever
        // reopened it can still see what was previously done. Completing the
        // task again overwrites them (and cleans up the old photo).
        task.isCompleted = false;
        task.completedAt = null;
        task.completedBy = null;
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
    const { name, dueDateTime, assignedTo, notes } = req.body;

    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isAdmin = req.user.userRole === "admin";
        const meId = req.user._id.toString();
        // For older tasks with no createdBy recorded, fall back to the assignee.
        const creatorId = (task.createdBy || task.assignedTo).toString();
        const assigneeId = task.assignedTo.toString();

        // Core details (name, due) and reschedule: admins, or the creator.
        const canEditCore = isAdmin || creatorId === meId;
        // Notes (e.g. the reason a task wasn't done): also the assignee, so the
        // person doing the work can record what happened.
        const canEditNotes = canEditCore || assigneeId === meId;

        const wantsCore = name !== undefined || dueDateTime !== undefined;
        if (wantsCore && !canEditCore) {
            return res
                .status(403)
                .json({ message: "Unauthorized: You cannot edit this task" });
        }
        // Only admins may reassign a task to another user.
        if (assignedTo !== undefined && !isAdmin) {
            return res
                .status(403)
                .json({ message: "Unauthorized: only admins can reassign tasks" });
        }
        if (notes !== undefined && !canEditNotes) {
            return res
                .status(403)
                .json({ message: "Unauthorized: You cannot edit this task" });
        }

        if (canEditCore) {
            if (name !== undefined) task.name = name;
            if (dueDateTime !== undefined) task.dueDateTime = dueDateTime;
        }
        if (isAdmin && assignedTo !== undefined) task.assignedTo = assignedTo;
        if (notes !== undefined && canEditNotes) task.notes = notes;

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

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        if (req.user.userRole !== "admin" && task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized: You cannot remove this task" });
        }

        // Clean up the completion photo (kept through reopens) with the task.
        if (task.completionPhotoId) {
            await deleteFromCloudinary(task.completionPhotoId);
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
