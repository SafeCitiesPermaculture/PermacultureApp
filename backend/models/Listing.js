const mongoose = require("mongoose");

/**
 * Model for storing listing data
 * Add data associated with listing to the schema
 */

const listingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Listing title is required."],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Listing price is required."],
            min: [0, "Listing price cannot be negative."],
        },
        location: {
            type: String,
            required: [true, "Location is required."],
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: [
                500,
                "Listing description cannot exceed 500 characters.",
            ],
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        picture: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Listing", listingSchema);
