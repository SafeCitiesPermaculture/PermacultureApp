const Listing = require("../models/Listing");

const createListing = async (req, res) => {
    try {
        // Verify user
        if (!req.user || !req.user._id || !req.user.isVerified) {
            return res
                .status(401)
                .json({ message: "Unauthorized: User not authenticated" });
        }

        const postedBy = req.user._id;

        // Validate listing data
        const { title, price, location, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required." });
        }

        if (title.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "Title must be a non-empty string." });
        }

        if (!price) {
            return res.status(400).json({ message: "Price is required." });
        }

        if (isNaN(price) || price < 0) {
            return res
                .status(400)
                .json({ message: "Price must be a non-negative number." });
        }

        const newListing = Listing({
            title: title.trim(),
            price,
            location: location ? location.trim() : "",
            description: description ? description.trim() : "",
            postedBy,
        });

        const savedListing = await newListing.save();

        res.status(201).json({
            message: "Listing successfully posted.",
            listing: savedListing,
        });
    } catch (error) {
        console.error("Error in posting listing ", error);

        // Handle mongoose validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(
                (err) => err.message
            );
            return res
                .status(400)
                .json({ message: "Validation failed", errors });
        }
        res.status(500).json({
            message: "Server error: Failed to create listing.",
            error: error.message,
        });
    }
};

module.exports = { createListing };
