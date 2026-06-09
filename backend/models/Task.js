const mongoose = require("mongoose");

/**
 * Model for tasks created in scheduler
 */

const taskSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Listing title is required"],
            trim: true
        },
        dueDateTime: {
            type: Date,
            required: [true, "Listing date + time required"],
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isCompleted: {
            type: Boolean,
            default: false
        },
        // Completion record: captures when/who/how a task was completed so
        // admins can review the work, not just a yes/no flag.
        completedAt: {
            type: Date,
            default: null
        },
        completedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        completionNote: {
            type: String,
            default: "",
            trim: true
        },
        completionPhoto: {
            type: String,
            default: ""
        },
        // Cloudinary public_id for the completion photo, so it can be deleted
        // if the task is later marked incomplete.
        completionPhotoId: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);