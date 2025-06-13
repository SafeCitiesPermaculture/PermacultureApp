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
        }
    }
);

module.exports = mongoose.model("Task", taskSchema);