const mongoose = require("mongoose");

/**
 * Model for farms that users can be assigned to.
 *
 * Replaces the previous hard-coded "Safe Cities vs N/A" logic (which lived in a
 * free-text `farmName` string + an `isSafeCities` boolean on the user). Admins
 * can now manage an open-ended list of farms.
 */

const farmSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Farm name is required"],
            unique: true,
            trim: true
        },
        // Soft-disable a farm without deleting it (keeps historical user refs valid).
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Farm", farmSchema);
