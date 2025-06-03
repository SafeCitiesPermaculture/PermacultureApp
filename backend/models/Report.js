const mongoose = require("mongoose");

/** Model for user reports */

const reportSchema = mongoose.Schema({
        reportedUsername: {
            type: String,
            required: [true, "Reported username is required."],
            trim: true
        },
        reportedByUsername: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: [true, "Report description is required."]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);