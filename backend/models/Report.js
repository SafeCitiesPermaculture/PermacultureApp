const mongoose = require("mongoose");

/** Model for user reports */

const reportSchema = mongoose.Schema({
        reported: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
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